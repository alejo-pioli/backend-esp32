import express from 'express'
import { CH4ReadingTable, CO2ReadingTable, DeviceTable } from './db/index.js';
import cors from 'cors'


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

    res.status(200).send("Éxito");
});

app.post("/device", async (req, res) => {
    console.log("POST data:", req.body);

    const data = await DeviceTable.create({ name: "ESP32" })

    res.status(200).send("Éxito");
})

app.listen(80, "192.168.232.255", () => {
    console.log("Express app listening");
});