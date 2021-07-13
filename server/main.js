import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { SensorReadings } from '../imports/api/sensorData';

const SENSOR_FIELDS = {
  date: 1,
  'parsed.tempf': 1,
  'parsed.tempinf': 1,
  'parsed.humidity': 1,
  'parsed.humidityin': 1,
  'parsed.soilmoisture1': 1,
  'parsed.rainratein': 1,
  'parsed.windspeedmph': 1,
  'parsed.solarradiation': 1,
};

Meteor.publish('sensorReadings', function (start, end) {
  //check(start, Match.Maybe(Date));
  //check(end, Match.Maybe(Date));
  const search = {};
  if (start && end) search.date = { $lte: start, $gte: end };
  else if (start) search.date = { $lte: start };
  else if (end) search.date = { $gte: end };
  else return SensorReadings.find(search, { sort: { date: -1 }, limit: 1 });
  return SensorReadings.find(search, { fields: SENSOR_FIELDS, sort: { date: -1 }, limit: 800 });
});
Meteor.publish('sensorAggregation', function (start, end, buckets) {
  const search = {};
  if (start && end) search.date = { $lte: start, $gte: end };
  else if (start) search.date = { $lte: start };
  else if (end) search.date = { $gte: end };
  SensorReadings.rawCollection().aggregate([
    { $match: search },
    {
      $bucketAuto: {
        groupBy: '$date',
        buckets,
        output: {
          tempinf: { $avg: '$parsed.tempinf' },
          tempf: { $avg: '$parsed.tempf' },
          humidityin: { $avg: '$parsed.humidityin' },
          humidity: { $avg: '$parsed.humidity' },
          rainratein: { $avg: '$parsed.rainratein' },
          windspeedmph: { $avg: '$parsed.windspeedmph' },
          soilmoisture1: { $avg: '$parsed.soilmoisture1' },
          solarradiation: { $avg: '$parsed.solarradiation' },
          date: { $first: '$date' }
        }

      }
    }
  ]).forEach((doc => {
    this.added('sensorReadings', +doc._id.min + '', { ...doc, _id: doc._id.min + '' });
  })).finally(() => this.ready()).catch((err) => {
    throw new Meteor.Error('ERROR' + err.message + ' : ' + err.reason);
  })
});

WebApp.connectHandlers.use('/weatherinput', (request, response) => {
  let raw = '';
  request.on('data', (chunk) => {
    raw += chunk.toString();
  });
  request.on('end', Meteor.bindEnvironment((chunk) => {
    const parsed = {};
    raw.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      parsed[key] = value.match(/^[0-9.]+$/) ? Number(value) : value;
    });
    SensorReadings.insert({ date: new Date(), raw, parsed });

    response.writeHead(200);
    response.end();
  }));
});
Meteor.startup(() => {
  SensorReadings.find().forEach(r => {
    if (typeof r.parsed.tempf === 'string') {
      const parsed = {};
      Object.keys(r.parsed).forEach(key => {
        const value = r.parsed[key];
        parsed[key] = value.match(/^[0-9.]+$/) ? Number(value) : value;
      });
      SensorReadings.update(r._id, { $set: { parsed } });
    }
  });

})
