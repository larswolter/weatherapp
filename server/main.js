import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ManualReadings, SensorReadings, SolarReadings } from '../imports/api/sensorData';
import { setupMQTT } from '../imports/api/mqtt';
import './excelExport';
import '../imports/common/methods';

await SensorReadings.createIndexAsync({ source: 1, yearOffset: 1, date: -1 });
await SensorReadings.createIndexAsync({ source: 1, yearOffset: 1, date: 1 });
await ManualReadings.createIndexAsync({ manualReading: 1, date: 1 });

await SolarReadings.createIndexAsync({ date: -1 });
await SolarReadings.createIndexAsync({ date: 1 });
await SolarReadings.createIndexAsync({ 'parsed.last_success': 1 });

WebApp.addHtmlAttributeHook(() => ({ lang: 'de' }));

if (process.env.MQTT_URL) {
  setupMQTT({
    mqttUrl: process.env.MQTT_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    topic: process.env.MQTT_TOPIC,
  });
}
Meteor.startup(() => {
  console.log(
    `Starting Weatherapp ${process.env.ACCESS_TOKEN ? 'using access token' : 'without access token'} and ${process.eventNames.SUBMIT_TOKEN ? 'using submit token' : 'without submit token'
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
    const oldest = await SensorReadings.findOneAsync({}, { sort: { date: 1 } });
    const newest = await SensorReadings.findOneAsync({}, { sort: { date: -1 } });
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

Meteor.publish('latestData', async function () {
  if (!this.userId) throw new Meteor.Error(403, 'access denied');
  const powerConsumed = await ManualReadings.find({ manualReading: 'powerConsumed' }, { sort: { date: -1 }, limit: 1 }).fetchAsync();
  const powerProduced = await ManualReadings.find({ manualReading: 'powerProduced' }, { sort: { date: -1 }, limit: 1 }).fetchAsync();
  powerConsumed[0] && this.added('manualReadings', powerConsumed[0]._id, powerConsumed[0]);
  powerProduced[0] && this.added('manualReadings', powerProduced[0]._id, powerProduced[0]);
  return [SensorReadings.find({}, { sort: { date: -1 }, limit: 1 }), SolarReadings.find({}, { sort: { date: -1 }, limit: 1 })];
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

const config = {
  hour: {
    buckets: 60,
    subScale: 'minute',
    subScaleMultiplier: 1,
    dateFormat: 'HH:mm',
    temp: {
      transform: (reading) => {
        return {
          ...reading,
          Innen: ((reading.Innen - 32) * 5) / 9,
          Außen: ((reading.Außen - 32) * 5) / 9,
        };
      },
      col: SensorReadings,
      unit: '°',
      title: '',
      lines: [
        { key: 'Innen', sourceKey: 'tempinf', sel: '$max', stroke: '#ff0000' },
        { key: 'Außen', sourceKey: 'tempf', sel: '$max', stroke: '#00ff00' },
      ],
    },
    humidity: {
      col: SensorReadings,
      title: '',
      unit: '%',
      lines: [
        { key: 'Feuchtigkeit Innen', sourceKey: 'humidityin', sel: '$avg', stroke: '#ff0000' },
        { key: 'Feuchtigkeit Außen', sourceKey: 'humidity', sel: '$avg', stroke: '#00ff00' },
        { key: 'Feuchtigkeit Boden', sourceKey: 'soilmoisture1', sel: '$avg', stroke: '#0000ff' },
      ],
    },
    wind: {
      col: SensorReadings,
      transform(reading) {
        return {
          ...reading,
          Windgeschw: reading.Windgeschw * 1.609344,
          'Windgeschw Böen': reading['Windgeschw Böen'] * 1.609344,
        };
      },
      title: '',
      unit: 'km/h',
      lines: [
        { key: 'Windgeschw', sourceKey: 'windspeedmph', sel: '$max', stroke: '#ff0000' },
        { key: 'Windgeschw Böen', sourceKey: 'windgustmph', sel: '$max', stroke: '#00ff00' },
      ],
    },
    barom: {
      col: SensorReadings,
      title: '',
      unit: 'hpa',

      lines: [
        { key: 'Luftdruck abs', sourceKey: 'baromabsin', sel: '$avg', stroke: '#ff0000' },
        { key: 'Luftdruck rel', sourceKey: 'baromrelin', sel: '$avg', stroke: '#00ff00' },
      ],
    },
    rain: {
      col: SensorReadings,
      title: '',
      unit: 'mm',
      transform(reading) {
        return {
          ...reading,
          Regenrate: reading['Regenrate'] * 25.4,
        };
      },

      lines: [{ key: 'Regenrate', sourceKey: 'rainratein', sel: '$avg', stroke: '#7777ff' }],
    },
    sun: {
      col: SensorReadings,
      title: '',
      unit: 'W',
      lines: [{ key: 'Sonneneinstrahlung', sourceKey: 'solarradiation', sel: '$avg', stroke: '#ffaa00' }],
    },
    solar: {
      transform(reading) {
        return {
          ...reading,
          Westen: reading.Westen[0],
          Süden: reading.Westen[1],
        };
      },
      col: SolarReadings,
      unit: 'W',
      title: '',
      lines: [
        { key: 'Westen', sourceKey: 'strings.power', sel: '$max', stroke: '#ff0000' },
        { key: 'Süden', sourceKey: 'strings.power', sel: '$max', stroke: '#00ff00' },
      ],
    },
    powerConsumed: {
      transform(reading) {
        return {
          ...reading,
          'Strom verbraucht': reading['Strom verbraucht'] - reading['Strom verbraucht (min)'],
          'Strom eingespeist': reading['Strom eingespeist'] - reading['Strom eingespeist (min)'],
        };
      },
      useBars: true,
      col: ManualReadings,
      title: '',
      unit: 'kWh',
      match: { manualReading: 'powerConsumed' },
      lines: [
        { key: 'Strom verbraucht (min)', hidden: true, sourceKey: 'value', sel: '$min', stroke: '#dd0000' },
        { key: 'Strom verbraucht', sourceKey: 'value', sel: '$max', stroke: '#dd0000' },
        { key: 'Strom eingespeist (min)', hidden: true, sourceKey: 'value', sel: '$min', stroke: '#00dd00' },
        { key: 'Strom eingespeist', sourceKey: 'value', sel: '$max', stroke: '#00dd00' },
      ],
    },
    powerProduced: {
      transform(reading) {
        const res = {
          _id: reading._id,
          date: reading.date,
          yearOffset: reading.yearOffset,
          source: reading.source,
          reading,
          Westen: (reading['Westen'][0] - reading['Westen Min'][0]) * 0.001,
          Süden: (reading['Süden'][1] - reading['Süden Min'][1]) * 0.001,
        };
        if (Number.isNaN(res.Westen)) console.log(reading);
        return res;
      },
      col: SolarReadings,
      useBars: true,
      unit: 'kWh',
      title: '',
      match: { 'parsed.strings.energy_total': { $gt: 2000, $lt: 10000000, $ne: NaN } },
      lines: [
        { key: 'Westen Min', hidden: true, sourceKey: 'strings.energy_total', sel: '$min', stroke: '#ff0000', unit: 'kWh' },
        { key: 'Süden Min', hidden: true, sourceKey: 'strings.energy_total', sel: '$min', stroke: '#00ff00', unit: 'kWh' },
        { key: 'Westen', sourceKey: 'strings.energy_total', sel: '$max', stroke: '#ff0000', unit: 'kWh' },
        { key: 'Süden', sourceKey: 'strings.energy_total', sel: '$max', stroke: '#00ff00', unit: 'kWh' },
      ],
    },
  },
};
config.day = {
  buckets: 48,
  subScale: 'minute',
  dateFormat: 'HH:mm',
  subScaleMultiplier: 30,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: config.hour.rain,
  sun: config.hour.sun,
  powerConsumed: config.hour.powerConsumed,
  powerProduced: config.hour.powerProduced,
  solar: config.hour.solar,
};
config.week = {
  buckets: 24 * 7,
  subScale: 'hour',
  dateFormat: 'DD. HH',
  subScaleMultiplier: 1,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: {
    col: SensorReadings,
    useBars: true,
    title: '',
    unit: 'mm',
    transform(reading) {
      return {
        ...reading,
        'Regen pro Stunde': reading['Regen pro Stunde'] * 25.4,
      };
    },

    lines: [{ key: 'Regen pro Stunde', sourceKey: 'hourlyrainin', sel: '$max', stroke: '#7777ff' }],
  },
  sun: config.hour.sun,
  powerConsumed: config.hour.powerConsumed,
  powerProduced: config.hour.powerProduced,
  solar: config.hour.solar,
};
config.month = {
  buckets: 30,
  subScale: 'day',
  dateFormat: 'DD.MM',
  subScaleMultiplier: 1,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  powerConsumed: config.hour.powerConsumed,
  powerProduced: config.hour.powerProduced,
  rain: {
    col: SensorReadings,
    useBars: true,
    title: '',
    unit: 'mm',
    transform(reading) {
      return {
        ...reading,
        'Regen pro Tag': reading['Regen pro Tag'] * 25.4,
      };
    },

    lines: [{ key: 'Regen pro Tag', sourceKey: 'dailyrainin', sel: '$max', stroke: '#7777ff' }],
  },
  sun: config.hour.sun,
  solar: config.hour.solar,
};
config.year = {
  buckets: 13,
  subScale: 'month',
  subScaleMultiplier: 1,
  dateFormat: 'MM',
  temp: {
    transform: (reading) => {
      return {
        ...reading,
        Innen: ((reading.Innen - 32) * 5) / 9,
        Außen: ((reading.Außen - 32) * 5) / 9,
      };
    },
    col: SensorReadings,
    unit: '°',
    title: '',
    lines: [
      { key: 'Innen', sourceKey: 'tempinf', sel: '$avg', stroke: '#ff0000' },
      { key: 'Außen', sourceKey: 'tempf', sel: '$avg', stroke: '#00ff00' },
    ],
  },
  humidity: config.month.humidity,
  wind: config.month.wind,
  barom: config.month.barom,
  rain: {
    col: SensorReadings,
    useBars: true,
    title: '',
    unit: 'mm',
    transform(reading) {
      return {
        ...reading,
        'Regen pro Monat': reading['Regen pro Monat'] * 25.4,
      };
    },

    lines: [{ key: 'Regen pro Monat', sourceKey: 'monthlyrainin', sel: '$max', stroke: '#7777ff' }],
  },
  sun: config.month.sun,
  powerConsumed: config.hour.powerConsumed,
  powerProduced: config.hour.powerProduced,
  solar: config.month.solar,
};

Meteor.publish('sensorStats', async function ({ source, offset, scale, yearOffset = 0 }) {
  if (!this.userId) throw new Meteor.Error(403, 'access-denied');
  const fields = { date: 1 };
  const output = { date: { $first: '$date' } };
  const defaultValues = {};
  const transform = config[scale][source].transform;
  const boundaries = [];
  const subScale = config[scale].subScale;
  const subScaleMultiplier = config[scale].subScaleMultiplier;

  const latestEntry = await SensorReadings.findOneAsync({}, { sort: { date: -1 } });
  const latestSolarEntry = await SolarReadings.findOneAsync({}, { sort: { date: -1 } });
  const latestManualEntry = await ManualReadings.findOneAsync({}, { sort: { date: -1 } });
  let latest = dayjs(latestEntry?.date);
  if (latestSolarEntry && latest.isBefore(latestSolarEntry?.date)) latest = dayjs(latestSolarEntry.date);
  if (latestManualEntry && latest.isBefore(latestManualEntry?.date)) latest = dayjs(latestManualEntry.date);

  const start = latest
    .clone()
    .endOf(subScale)
    .subtract(yearOffset, 'year')
    .subtract(offset + 1, scale)
    .toDate();

  for (let b = 1; b <= config[scale].buckets; b += 1) {
    boundaries.push(
      dayjs(start)
        .clone()
        .startOf(subScale)
        .add(b * subScaleMultiplier, subScale)
        .toDate()
    );
  }
  const search = { date: { $gte: boundaries[0], $lte: boundaries[boundaries.length - 1] }, ...(config[scale][source].match || {}) };
  const collection = config[scale][source].col;
  config[scale][source].lines.forEach((l) => {
    fields['parsed.' + (l.sourceKey || l.key)] = 1;
    output[l.key] = { [l.sel]: '$parsed.' + (l.sourceKey || l.key) };
    defaultValues[l.key] = 0;
  });
  const infos = {
    ...config[scale][source],
    lines: config[scale][source].lines.filter((l) => !l.hidden),
    match: null,
    transform: null,
    col: null,
    dateFormat: config[scale].dateFormat,
    _id: source + scale,
    source,
  };
  this.added('sensorInfos', source + scale, infos);
  try {
    const results = await collection
      .rawCollection()
      .aggregate([
        { $match: search },
        {
          $bucket: {
            groupBy: '$date',
            boundaries,
            output,
          },
        },
      ])
      .toArray();
    boundaries.forEach((_id) => {
      const reading = results.find((r) => dayjs(r._id).isSame(_id, 'second'));
      if (reading) {
        const values = transform ? transform(reading) : reading;
        this.added('sensorReadings', source + reading._id, { ...values, _id: source + reading._id, source, yearOffset, offset });
      } else {
        this.added('sensorReadings', source + _id, { _id: source + _id, date: _id, source, yearOffset, offset });
      }
    });
    this.ready();
  } catch (err) {
    throw new Meteor.Error('ERROR' + err.message + ' : ' + err.reason);
  }
});
