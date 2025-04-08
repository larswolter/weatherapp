import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { SensorReadings, SolarReadings } from '../imports/api/sensorData';

WebApp.connectHandlers.use('/solarinput', (request, response) => {
  try {
    if (process.env.SUBMIT_TOKEN && process.env.SUBMIT_TOKEN !== request.query.token) {
      response.writeHead(403);
      response.end();
      console.log(`Blocked sensor reading submitions with token ${request.query.token}`);
      return;
    }
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk.toString();
    });
    request.on(
      'end',
      Meteor.bindEnvironment(async () => {
        try {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (err) {
            parsed = { error: err.message };
          }
          await SolarReadings.insertAsync({ date: new Date(), parsed, raw });

          response.writeHead(200);
          response.end();
        } catch (err) {
          console.log('error on handline solarinput', err.message);
          response.writeHead(500);
          response.end();
        }
      })
    );
  } catch (err) {
    console.log('error on solarinput', err.message);
    response.writeHead(500);
    response.end();
  }
});

WebApp.connectHandlers.use('/weatherinput', (request, response) => {
  if (process.env.SUBMIT_TOKEN && process.env.SUBMIT_TOKEN !== request.query.token) {
    response.writeHead(403);
    response.end();
    console.log(`Blocked sensor reading submitions with token ${request.query.token}`);
    return;
  }

  let raw = '';
  request.on('data', (chunk) => {
    raw += chunk.toString();
  });
  request.on(
    'end',
    Meteor.bindEnvironment(async (chunk) => {
      const parsed = {};
      raw.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        parsed[key] = value.match(/^[0-9.]+$/) ? Number(value) : value;
      });
      await SensorReadings.insertAsync({ date: new Date(), raw, parsed });

      response.writeHead(200);
      response.end();
    })
  );
});

WebApp.connectHandlers.use('/export', async (request, response) => {
  try {
    if (process.env.SUBMIT_TOKEN && process.env.SUBMIT_TOKEN !== request.query.token) {
      response.writeHead(403);
      response.end();
      console.log(`Blocked sensor reading export with token ${request.query.token}`);
      return;
    }
    const query = {};
    if (request.query.from) query.date = { $gte: dayjs(request.query.from).toDate() };
    if (request.query.until && query.date) query.date.$lte = dayjs(request.query.until).toDate();
    else if (request.query.until) query.date = { $lte: dayjs(request.query.until).toDate() };
    let cursor;
    if (request.query.collection === 'readings') cursor = SensorReadings.find(query, { fields: { raw: 0 } });
    if (request.query.collection === 'solar') cursor = SolarReadings.find(query, { fields: { raw: 0 } });
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename="weather-export-${request.query.collection}-${dayjs().format('YYYY-MM-DD_HH-mm')}.json"`);
    response.writeHead(200);

    await cursor.forEachAsync((doc) => {
      response.write(JSON.stringify(doc) + '\n');
    });
    response.end();
  } catch (err) {
    console.log('error on export', err.message);
    response.writeHead(500);
    response.end();
  }
});
