import CryptoJS from 'crypto-js';
import express from 'express';
import executeQuery from '../utils/executeQuery';
import { verifyJWT } from './user';

const ticketRouter = express.Router();

ticketRouter.get('/', async (_, res) => {
  const query = `
    SELECT
      TO_CHAR(t.date, 'YYYY-MM-DD"T"HH24:MI:SS.MSZ') AS date_string,
      SUM(CASE WHEN t.issold = true THEN 1 ELSE 0 END) AS sold_count,
      SUM(CASE WHEN t.issold = false THEN 1 ELSE 0 END) AS not_sold_count,
      s1.stationname AS from_station,
      s1.coords AS from_station_coords,
      s2.stationname AS to_station,
      s2.coords AS to_station_coords,
      b.busnumber as busnumber,
      b.manufacturer as bus_manufacturer,
      b.color as bus_color
    FROM
      ticket t
    JOIN
      busstation s1 ON t.fromstationid = s1.id
    JOIN
      busstation s2 ON t.tostationid = s2.id
    JOIN
      bus b ON t.busnumber = b.busnumber
    GROUP BY
      TO_CHAR(t.date, 'YYYY-MM-DD"T"HH24:MI:SS.MSZ'), s1.stationname, s1.coords, s2.stationname, s2.coords, b.busnumber, b.manufacturer, b.color
  `;

  const data = await executeQuery(query);

  res.json(data);
});

ticketRouter.get('/:ticketSifer', async (req, res) => {
  try {
    const ticketBase64 = CryptoJS.enc.Base64.parse(req.params.ticketSifer);
    const ticketData = JSON.parse(CryptoJS.enc.Utf8.stringify(ticketBase64));

    const { date, busnumber } = ticketData;

    const mainInfoQuery = `
    SELECT
      TO_CHAR(t.date, 'YYYY-MM-DD"T"HH24:MI:SS.MSZ') AS date_string,
      SUM(CASE WHEN t.issold = true THEN 1 ELSE 0 END) AS sold_count,
      SUM(CASE WHEN t.issold = false THEN 1 ELSE 0 END) AS not_sold_count,
      s1.stationname AS from_station,
      s1.coords AS from_station_coords,
      s2.stationname AS to_station,
      s2.coords AS to_station_coords,
      b.busnumber as busnumber,
      b.manufacturer as bus_manufacturer,
      b.color as bus_color
    FROM
      ticket t
    JOIN
      busstation s1 ON t.fromstationid = s1.id
    JOIN
      busstation s2 ON t.tostationid = s2.id
    JOIN
      bus b ON t.busnumber = b.busnumber
    where
      t.date='${date}' and t.busnumber='${busnumber}'
    GROUP BY
      TO_CHAR(t.date, 'YYYY-MM-DD"T"HH24:MI:SS.MSZ'), s1.stationname, s1.coords, s2.stationname, s2.coords, b.busnumber, b.manufacturer, b.color;
    `;

    const mainInfo = await executeQuery(mainInfoQuery);

    const seatsQuery = `
      select id, seatnumber, issold from ticket
      where
        date='${date}' and busnumber='${busnumber}'
      order by seatnumber;
    `;

    const seatsInfo = await executeQuery(seatsQuery);

    res.json({
      ...mainInfo[0],
      seats: [
        ...seatsInfo,
      ],
    });
  } catch (e) {
    res.json(e);
  }
});

ticketRouter.post('/', async (req, res) => {
  try {
    const {
      body: {
        fromstationid, tostationid, busnumber, price, date,
      },
    } = req;

    /** Нахоидм автобус и выявляем его вместимость */

    const bus = await executeQuery(`SELECT * from bus where busnumber='${busnumber}';`);

    const { capacity } = bus[0];

    /** Формируем значения для вставки (количество билетов умножить на вместимость автобуса) */

    let bodyForInsertion = [];

    for (
      let incrementedSeatNumber = 1; incrementedSeatNumber <= capacity; incrementedSeatNumber += 1
    ) {
      const values = [fromstationid, tostationid, busnumber, price, date, incrementedSeatNumber].map((el) => `'${el}'`).join();

      bodyForInsertion.push(`(${values})`);
    }

    bodyForInsertion = bodyForInsertion.join();

    const queryString = `insert into ticket (fromstationid, tostationid, busnumber, price, date, seatnumber) values ${bodyForInsertion};`;

    await executeQuery(queryString);

    const data = await executeQuery(`SELECT * from ticket where date='${date}' and busnumber='${busnumber}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

ticketRouter.put('/:ticketid', async (req, res) => {
  try {
    const { ticketid } = req.params;
    const { body } = req;

    const keys = Object.keys(body);

    const updateFieldsString = keys.map((key) => `${key}='${body[key]}'`).join(', ');

    await executeQuery(`update ticket set ${updateFieldsString} where id='${ticketid}';`);

    const data = await executeQuery(`SELECT * from ticket where id='${ticketid}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

ticketRouter.post('/book/:ticketid', verifyJWT, async (req, res) => {
  try {
    const { ticketid } = req.params;
    const data = await executeQuery(`update ticket set issold=true,userid=${req.userId} where id='${ticketid}';`);

    res.json(data);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

ticketRouter.delete('/:ticketid', async (req, res) => {
  try {
    const { ticketid } = req.params;

    const data = await executeQuery(`delete from ticket where id='${ticketid}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

export default ticketRouter;
