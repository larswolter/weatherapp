import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { SensorReadings, SolarReadings } from '../imports/api/sensorData';
import './ssr';

SensorReadings.createIndex({ date: -1 });
SensorReadings.createIndex({ date: 1 });

SolarReadings.createIndex({ date: -1 });
SolarReadings.createIndex({ date: 1 });

Meteor.startup(() => {
  console.log(
    `Starting Weatherapp ${process.env.ACCESS_TOKEN ? 'using access token' : 'without access token'} and ${
      process.eventNames.SUBMIT_TOKEN ? 'using submit token' : 'without submit token'
    }`
  );
});

Meteor.methods({
  authenticate(token) {
    if (process.env.ACCESS_TOKEN && process.env.ACCESS_TOKEN !== token) throw new Meteor.Error(403, 'access denied');
    this.setUserId('authenticated');
    return process.env.ACCESS_TOKEN || 'dummy-token';
  },
  async aggregateSensorData() {
    if (!this.userId) throw new Meteor.Error(403, 'access denied');
    const oldest = SensorReadings.findOne({}, { sort: { date: 1 } });
    const newest = SensorReadings.findOne({}, { sort: { date: -1 } });
    const start = newest.date;
    const maxHours = dayjs(start).clone().diff(oldest.date, 'hours');
    const elements = [
      { label: 'day', hours: 24 },
      { label: 'month', hours: 30 * 24 },
      { label: 'year', hours: 365 * 24 },
    ];
    const whHours = {};
    for (const element of elements) {
      const result = await SensorReadings.rawCollection()
        .aggregate(
          [
            {
              $match: {
                date: {
                  $lt: start,
                  $gt: dayjs(start).clone().subtract(Math.min(maxHours, element.hours), 'hours').toDate(),
                },
              },
            },
            {
              $bucketAuto: {
                groupBy: '$date',
                buckets: Math.min(maxHours, element.hours),
                output: {
                  wh: { $avg: '$parsed.solarradiation' },
                },
              },
            },
            {
              $group: {
                _id: 1,
                wh: { $sum: '$wh' },
              },
            },
          ],
          { allowDiskUse: true }
        )
        .toArray();
      whHours[element.label + 'Wh'] = result[0].wh;
      whHours[element.label + 'Hours'] = Math.min(maxHours, element.hours);
    }
    return whHours;
  },
});

Meteor.publish('latestData', function () {
  if (!this.userId) throw new Meteor.Error(403, 'access denied');
  return [SensorReadings.find({}, { sort: { date: -1 }, limit: 1 }),SolarReadings.find({}, { sort: { date: -1 }, limit: 1 })];
});


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
          SolarReadings.insert({ date: new Date(), parsed, raw });

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
    Meteor.bindEnvironment((chunk) => {
      const parsed = {};
      raw.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        parsed[key] = value.match(/^[0-9.]+$/) ? Number(value) : value;
      });
      SensorReadings.insert({ date: new Date(), raw, parsed });

      response.writeHead(200);
      response.end();
    })
  );
});
Meteor.startup(() => {
  SensorReadings.find().forEach((r) => {
    if (typeof r.parsed.tempf === 'string') {
      const parsed = {};
      Object.keys(r.parsed).forEach((key) => {
        const value = r.parsed[key];
        parsed[key] = value.match(/^[0-9.]+$/) ? Number(value) : value;
      });
      SensorReadings.update(r._id, { $set: { parsed } });
    }
  });
});

const config = {
  hour: {
    buckets: 60,
    temp: {
      transform: (reading) => {
        return {
          ...reading,
          tempf: ((reading.tempf - 32) * 5) / 9,
          tempinf: ((reading.tempinf - 32) * 5) / 9,
        };
      },
      col: SensorReadings,
      unit:'°',
      title: '',
      lines: [
        { key:'Innen', sourceKey: 'tempinf', sel: '$avg', stroke: '#ff0000' },
        { key:'Außen', sourceKey: 'tempf', sel: '$avg', stroke: '#00ff00' },
      ],
    },
    humidity: {
      col: SensorReadings,
      title: '',
      unit:'%',
      lines: [
        { key: 'humidityin', sel: '$avg', stroke: '#ff0000' },
        { key: 'humidity', sel: '$avg', stroke: '#00ff00' },
        { key: 'soilmoisture1', sel: '$avg', stroke: '#0000ff' },
      ],
    },
    wind: {
      col: SensorReadings,
      title: '',
      unit:'km/h',
      lines: [
        { key: 'windspeedmph', sel: '$avg', stroke: '#ff0000' },
        { key: 'windgustmph', sel: '$avg', stroke: '#00ff00' },
      ],
    },
    barom: {
      col: SensorReadings,
      title: '',
      unit:'hpa',

      lines: [
        { key: 'baromabsin', sel: '$avg', stroke: '#ff0000' },
        { key: 'baromrelin', sel: '$avg', stroke: '#00ff00' },
      ],
    },
    rain: {
      col: SensorReadings,
      title: '',
      unit:'l/m²',

      lines: [{ key: 'rainrate', sel: '$avg', stroke: '#ff0000' }],
    },
    sun: {
      col: SensorReadings,
      title: '',
      unit:'W',
      lines: [{ key: 'solarradiation', sel: '$avg', stroke: '#ff0000' }],
    },
    solar: {
      transform(reading) {
        return {
          ...reading,
          string0: reading.string0[0],
          string1: reading.string0[1]
        }
      },
      col: SolarReadings,
      unit: 'W',
      title: '',
      lines: [
        { key: 'string0', sourceKey: 'strings.power', sel: '$min', stroke: '#ff0000' },
        { key: 'string1', sourceKey: 'strings.power', sel: '$max', stroke: '#00ff00' },
      ],
    },
  },
};
config.day = {
  buckets: 24,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: config.hour.rain,
  sun: config.hour.sun,
  solar: config.hour.solar,
};
config.week = {
  buckets: 24 * 7,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: config.hour.rain,
  sun: config.hour.sun,
  solar: config.hour.solar,
};
config.month = {
  buckets: 30,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: config.hour.rain,
  sun: config.hour.sun,
  solar: config.hour.solar,
};
config.year = {
  buckets: 365,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: config.hour.rain,
  sun: config.hour.sun,
  solar: config.hour.solar,
};

Meteor.publish('sensorStats', function ({ source, offset, scale }) {
  const latestEntry = SensorReadings.findOne({}, { sort: { date: -1 } });
  const latest = dayjs(latestEntry.date);

  const search = {
    date: {
      $lt: latest.clone().subtract(offset, scale).startOf(scale).toDate(),
      $gt: latest
        .clone()
        .subtract(offset + 1, scale)
        .startOf(scale)
        .toDate(),
    },
  };
  const fields = { date: 1 };
  const output = { date: { $first: '$date' } };
  const transform = config[scale][source].transform;
  const buckets = config[scale].buckets;
  const collection = config[scale][source].col;
  config[scale][source].lines.forEach((l) => {
    fields['parsed.' + (l.sourceKey || l.key)] = 1;
    output[l.key] = { [l.sel]: '$parsed.' + (l.sourceKey || l.key) };
  });
  this.added('sensorInfos', source + scale, { ...config[scale][source], col: null, _id: source + scale, source });

  collection
    .rawCollection()
    .aggregate([
      { $match: search },
      {
        $bucketAuto: {
          groupBy: '$date',
          buckets,
          output,
        },
      },
    ])
    .forEach((reading) => {
      const values = transform ? transform(reading) : reading;
      this.added('sensorReadings', source + reading._id.min, { ...values, _id: source + reading._id.min, source });
    })
    .finally(() => {
      this.ready();
    })
    .catch((err) => {
      throw new Meteor.Error('ERROR' + err.message + ' : ' + err.reason);
    });
});
