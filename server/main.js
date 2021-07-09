import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { SensorReadings } from '../imports/api/sensorData';

const SENSOR_FIELDS = {
  date:1,
  'parsed.tempf':1,
  'parsed.tempinf':1,
  'parsed.humidity':1,
  'parsed.humidityin':1,
  'parsed.soilmoisture1':1,
  'parsed.rainratein':1,
  'parsed.windspeedmph':1,
  'parsed.solarradiation':1,
};

Meteor.publish('sensorReadings', function (start, end) {
  //check(start, Match.Maybe(Date));
  //check(end, Match.Maybe(Date));
  const search = {};
  if (start && end) search.date = { $lte: start, $gte: end };
  else if (start) search.date = { $lte: start };
  else if (end) search.date = { $gte: end };
  else return SensorReadings.find(search, { fields: SENSOR_FIELDS, sort: { date: -1 }, limit: 1 });
  return SensorReadings.find(search, { fields: SENSOR_FIELDS, sort: { date: -1 }, limit: 800 });
});
Meteor.methods({
  async sensorAggregation(start,end) {
    const search = {};
    if (start && end) search.date = { $lte: start, $gte: end };
    else if (start) search.date = { $lte: start };
    else if (end) search.date = { $gte: end };
    return await SensorReadings.rawCollection().aggregate([
      {$match:search},
      {$bucketAuto: {
        $groupBy:'$date',
        buckets: 20,
        output: {
          tempinf: {$average: '$parsed.tempinf'},
          tempf: {$average: '$parsed.tempf'},
          date: {$first:'$date'}
        }
      }}
    ]).toArray();
  }
})
WebApp.connectHandlers.use('/weatherinput', (request, response) => {
  let raw = '';
  request.on('data', (chunk) => {
    raw += chunk.toString();
  });
  request.on('end', Meteor.bindEnvironment((chunk) => {
    const parsed = {};
    raw.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      parsed[key] = value;
    });
    SensorReadings.insert({ date: new Date(), raw, parsed });

    response.writeHead(200);
    response.end();
  }));
});
