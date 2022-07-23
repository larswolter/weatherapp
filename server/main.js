import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { SensorReadings } from '../imports/api/sensorData';
import './ssr';

SensorReadings.createIndex({ date: -1 });
SensorReadings.createIndex({ date: 1 });


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
    for(const element of elements) {
      const result = await SensorReadings.rawCollection()
        .aggregate([
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
        ],{allowDiskUse:true})
        .toArray();
      whHours[element.label+'Wh'] = result[0].wh;
      whHours[element.label+'Hours'] = Math.min(maxHours, element.hours);
    }
    return whHours;
  },
});

Meteor.publish('sensorReadings', function ({ start, end, fields }) {
  if (!this.userId) throw new Meteor.Error(403, 'access denied');
  //check(start, Match.Maybe(Date));
  //check(end, Match.Maybe(Date));
  const search = {};
  if (start && end) search.date = { $lte: start, $gte: end };
  else if (start) search.date = { $lte: start };
  else if (end) search.date = { $gte: end };
  else return SensorReadings.find(search, { sort: { date: -1 }, limit: 1 });
  console.log('sensor readings', { search, fields });
  return SensorReadings.find(search, { fields, sort: { date: -1 }, limit: 800 });
});

Meteor.publish('sensorAggregation', function ({ start, end, buckets, fields }) {
  const search = {};
  if (start && end) search.date = { $lte: start, $gte: end };
  else if (start) search.date = { $lte: start };
  else if (end) search.date = { $gte: end };
  SensorReadings.rawCollection()
    .aggregate([
      { $match: search },
      {
        $bucketAuto: {
          groupBy: '$date',
          buckets,
          output: {
            tempinf: { $avg: '$parsed.tempinf' },
            tempf: { $avg: '$parsed.tempf' },
            baromabsin: { $avg: '$parsed.baromabsin' },
            baromrelin: { $avg: '$parsed.baromrelin' },
            humidityin: { $avg: '$parsed.humidityin' },
            humidity: { $avg: '$parsed.humidity' },
            rainratein: { $avg: '$parsed.rainratein' },
            windspeedmph: { $avg: '$parsed.windspeedmph' },
            soilmoisture1: { $avg: '$parsed.soilmoisture1' },
            solarradiation: { $avg: '$parsed.solarradiation' },
            windgustmph: { $max: '$parsed.windgustmph' },
            date: { $first: '$date' },
          },
        },
      },
    ])
    .forEach((doc) => {
      this.added('sensorReadings', +doc._id.min + '', { ...doc, _id: doc._id.min + '' });
    })
    .finally(() => this.ready())
    .catch((err) => {
      throw new Meteor.Error('ERROR' + err.message + ' : ' + err.reason);
    });
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
