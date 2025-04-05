import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Excel from 'exceljs';
import { ManualReadings, SensorReadings, SolarReadings } from '../imports/api/sensorData';

WebApp.connectHandlers.use('/excelExport.xlsx', async (request, response) => {
  try {
    if (process.env.ACCESS_TOKEN && process.env.ACCESS_TOKEN !== request.query.token) {
      response.writeHead(403);
      response.end();
      console.log(`Blocked excelExport with token ${request.query.token}`);
      return;
    }
    console.log('Start writing Excel');

    const limit = Number(request.query.limit || '0');
    response.writeHead(200, 'Ok', {
      'content-disposition': 'attachment; filename="weather' + (request.query.year || '') + '-' + dayjs().format('YYYYMMDD_HHmm') + '.xls"',
    });
    const wb = new Excel.stream.xlsx.WorkbookWriter({ stream: response });
    let sheet = wb.addWorksheet('Wetterdaten');
    const query = {};
    if (request.query.year) {
      query.date = {
        $gte: dayjs(request.query.year, 'YYYY').startOf('year').startOf('day').toDate(),
        $lte: dayjs(request.query.year, 'YYYY').endOf('year').endOf('day').toDate(),
      };
    }
    else if (request.query.gte) {
      query.date = {
        $gte: dayjs(request.query.gte, 'YYYYMMDD').startOf('day').toDate(),
        $lte: dayjs(request.query.lte, 'YYYYMMDD').endOf('day').toDate(),
      };
    }
    await SensorReadings.find(query, { fields: { parsed: 1, date: 1 }, sort: { date: -1 }, limit }).forEachAsync(async (entry, idx) => {
      const item = { date: entry.date, ...entry.parsed };
      ['PASSKEY', 'stationtype', 'dateutc', 'model'].forEach((k) => delete item[k]);
      if (idx === 0) sheet.addRow(Object.keys(item));
      if (idx % 1000 === 0) await sheet.addRow(Object.values(item)).commit();
      sheet.addRow(Object.values(item));
    });
    await sheet.commit();
    console.log('finished writing Wetter');
    sheet = wb.addWorksheet('Solardaten');

    await SolarReadings.find({ ...query, 'parsed.strings': { $exists: true } }, { fields: { parsed: 1, date: 1 }, sort: { date: -1 }, limit }).forEachAsync(
      async (entry, idx) => {
        const item = { date: entry.date, ...entry.parsed };
        item.strings.forEach((str, strIdx) => {
          Object.keys(str).forEach((key) => {
            item[strIdx + '-' + key] = str[key];
          });
        });
        ['strings', 'last_success', 'Efficiency', 'F_AC', 'I_AC', 'MaxPower', 'MaxTemp'].forEach((k) => delete item[k]);
        if (idx === 0) sheet.addRow(Object.keys(item));
        if (idx % 100 === 0) await sheet.addRow(Object.values(item)).commit();
        sheet.addRow(Object.values(item));
      }
    );
    await sheet.commit();
    console.log('finished writing Solar');
    sheet = wb.addWorksheet('Manuelle Daten');
    await ManualReadings.find(query, { fields: { value: 1, date: 1, manualReading: 1 }, sort: { date: -1 }, limit }).forEachAsync(async (entry, idx) => {
      if (idx === 0) sheet.addRow(Object.keys(entry));
      if (idx % 1000 === 0) await sheet.addRow(Object.values(entry)).commit();
      sheet.addRow(Object.values(entry));
    });
    await sheet.commit();
    console.log('finished writing manual data');

    await wb.commit();
    console.log('finished writing Excel');
  } catch (err) {
    console.log('error on excelExport', err.message);
    response.writeHead(500);
    response.end();
  }
});
