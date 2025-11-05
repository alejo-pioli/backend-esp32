import express from 'express'
import { CH4ReadingTable, CO2ReadingTable, COReadingTable, DeviceTable } from './db/index.js';
import cors from 'cors'
import { DataTypes, Sequelize, Op, fn, col, literal } from '@sequelize/core';


const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

app.post("/", async (req, res) => {
    console.log("POST data:", req.body);
    const start = Date.now()

    const data1 = await CO2ReadingTable.create({value: req.body.co2, date: start, deviceId: req.body.deviceId})
    const data2 = await CH4ReadingTable.create({value: req.body.ch4, date: start, deviceId: req.body.deviceId})
    const data3 = await COReadingTable.create({value: req.body.co, date: start, deviceId: req.body.deviceId})

    latestCO2 = req.body.co2
    latestCH4 = req.body.ch4
    latestCO = req.body.co

    res.status(200).send("Éxito");
});

app.post("/device", async (req, res) => {
    console.log("POST data:", req.body);

    const data = await DeviceTable.create({ name: "Aula 1" })

    res.status(200).send("Éxito");
})

let latestCO2 = 1;
let latestCH4 = 1;
let latestCO = 1;

app.get('/latest', async (req, res) => {
  const result = {
    co2: latestCO2,
    ch4: latestCH4,
    co: latestCO
  }

  res.json(result).status(200)
})


app.get('/day/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  // Query CO2 hourly averages
  const co2Hourly = await CO2ReadingTable.findAll({
    attributes: [
      [literal("strftime('%H', datetime(date, '-3 hours'))"), 'hour'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of day','+3 hours')"),
      },
    },
    group: [literal("strftime('%H', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Query CH4 hourly averages
  const ch4Hourly = await CH4ReadingTable.findAll({
    attributes: [
      [literal("strftime('%H', datetime(date, '-3 hours'))"), 'hour'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of day','+3 hours')"),
      },
    },
    group: [literal("strftime('%H', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Query CO hourly averages
  const coHourly = await COReadingTable.findAll({
    attributes: [
      [literal("strftime('%H', datetime(date, '-3 hours'))"), 'hour'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of day','+3 hours')"),
      },
    },
    group: [literal("strftime('%H', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Convert query results into lookup maps
  const co2Map = Object.fromEntries(co2Hourly.map(r => [r.hour, Math.round(r.avgValue * 100) / 100]));
  const ch4Map = Object.fromEntries(ch4Hourly.map(r => [r.hour, Math.round(r.avgValue * 100) / 100]));
  const coMap  = Object.fromEntries(coHourly.map(r  => [r.hour,  Math.round(r.avgValue * 100) / 100]));

  // Build full 24-hour array
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  // Final format: header + rows
  const result = [
    ['Hora', 'CO2', 'CH4', 'CO'],
    ...hours.map(h => [
      `${h}:00`,
      co2Map[h] ?? null,
      ch4Map[h] ?? null,
      coMap[h]  ?? null,
    ]),
  ];

  res.json(result);
});


app.get('/month/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  // Query CO2 daily averages
  const co2Daily = await CO2ReadingTable.findAll({
    attributes: [
      [literal("strftime('%d', datetime(date, '-3 hours'))"), 'day'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of month')"),
        [Op.lt]: literal("datetime('now','-3 hours','start of month','+1 month')"),
      },
    },
    group: [literal("strftime('%d', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Query CH4 daily averages
  const ch4Daily = await CH4ReadingTable.findAll({
    attributes: [
      [literal("strftime('%d', datetime(date, '-3 hours'))"), 'day'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of month')"),
        [Op.lt]: literal("datetime('now','-3 hours','start of month','+1 month')"),
      },
    },
    group: [literal("strftime('%d', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Query CO daily averages
  const coDaily = await COReadingTable.findAll({
    attributes: [
      [literal("strftime('%d', datetime(date, '-3 hours'))"), 'day'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of month')"),
        [Op.lt]: literal("datetime('now','-3 hours','start of month','+1 month')"),
      },
    },
    group: [literal("strftime('%d', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Convert query results into lookup maps
  const co2Map = Object.fromEntries(co2Daily.map(r => [r.day, Math.round(r.avgValue * 100) / 100]));
  const ch4Map = Object.fromEntries(ch4Daily.map(r => [r.day, Math.round(r.avgValue * 100) / 100]));
  const coMap  = Object.fromEntries(coDaily.map(r  => [r.day,  Math.round(r.avgValue * 100) / 100]));

  // Figure out how many days are in the current month
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build full array of days, filling missing with null
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  // Final format: header + rows
  const result = [
    ['Día', 'CO2', 'CH4', 'CO'],
    ...days.map(d => [
      d,
      co2Map[d] ?? null,
      ch4Map[d] ?? null,
      coMap[d]  ?? null,
    ]),
  ];

  res.json(result);
});


app.get('/year/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  // Query CO2 monthly averages
  const co2Monthly = await CO2ReadingTable.findAll({
    attributes: [
      [literal("strftime('%m', datetime(date, '-3 hours'))"), 'month'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of year')"),
        [Op.lt]: literal("datetime('now','-3 hours','start of year','+1 year')"),
      },
    },
    group: [literal("strftime('%m', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Query CH4 monthly averages
  const ch4Monthly = await CH4ReadingTable.findAll({
    attributes: [
      [literal("strftime('%m', datetime(date, '-3 hours'))"), 'month'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of year')"),
        [Op.lt]: literal("datetime('now','-3 hours','start of year','+1 year')"),
      },
    },
    group: [literal("strftime('%m', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Query CO monthly averages
  const coMonthly = await COReadingTable.findAll({
    attributes: [
      [literal("strftime('%m', datetime(date, '-3 hours'))"), 'month'],
      [fn('AVG', col('value')), 'avgValue'],
    ],
    where: {
      deviceId,
      date: {
        [Op.gte]: literal("datetime('now','-3 hours','start of year')"),
        [Op.lt]: literal("datetime('now','-3 hours','start of year','+1 year')"),
      },
    },
    group: [literal("strftime('%m', datetime(date, '-3 hours'))")],
    raw: true,
  });

  // Convert query results into lookup maps
  const co2Map = Object.fromEntries(co2Monthly.map(r => [r.month, Math.round(r.avgValue * 100) / 100]));
  const ch4Map = Object.fromEntries(ch4Monthly.map(r => [r.month, Math.round(r.avgValue * 100) / 100]));
  const coMap  = Object.fromEntries(coMonthly.map(r  => [r.month,  Math.round(r.avgValue * 100) / 100]));

  // Build full 12-month array, filling missing with null
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  // Final format: header + rows
  const result = [
    ['Mes', 'CO2', 'CH4', 'CO'],
    ...months.map(m => [
      m,
      co2Map[m] ?? null,
      ch4Map[m] ?? null,
      coMap[m]  ?? null,
    ]),
  ];

  res.json(result);
});



app.listen(3000, () => console.log('Server running on port 3000'));

async function seedYearEvery10Minutes(deviceId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1); // Jan 1 of this year

  const co2Readings = [];
  const ch4Readings = [];
  const coReadings  = [];

  const stepMs = 10 * 60 * 1000; // 10 minutes in ms

  for (let t = start.getTime(); t <= now.getTime(); t += stepMs) {
    const date = new Date(t);

    co2Readings.push({
      deviceId,
      date,
      value: 450 + Math.random() * 1000, // CO₂ ppm
    });

    ch4Readings.push({
      deviceId,
      date,
      value: 30 + Math.random() * 400, // CH₄ ppm
    });

    coReadings.push({
      deviceId,
      date,
      value: 20 + Math.random() * 50, // CO ppm (example range)
    });

    // Insert in batches of 5000 to avoid memory issues
    if (co2Readings.length >= 5000) {
      await CO2ReadingTable.bulkCreate(co2Readings);
      await CH4ReadingTable.bulkCreate(ch4Readings);
      await COReadingTable.bulkCreate(coReadings);
      co2Readings.length = 0;
      ch4Readings.length = 0;
      coReadings.length = 0;
    }
  }

  // Insert any remaining rows
  if (co2Readings.length > 0) {
    await CO2ReadingTable.bulkCreate(co2Readings);
    await CH4ReadingTable.bulkCreate(ch4Readings);
    await COReadingTable.bulkCreate(coReadings);
  }

  console.log(`Finished seeding readings every 10 minutes for device ${deviceId}`);
}


app.get('/test', (req, res) => {
    seedYearEvery10Minutes(1)
});

app.listen(80, "192.168.41.126", () => {
    console.log("Express app listening");
});