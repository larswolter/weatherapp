import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { SensorReadings } from '/imports/api/sensorData';

Meteor.publish('sensorReadings', function (limit = 1) {
  check(limit, Number);
  return SensorReadings.find({}, { sort: { date: -1 }, limit });
});

WebApp.connectHandlers.use('/weatherinput', (request, response) => {
  let raw = '';
  request.on('data', (chunk) => {
    raw += chunk.toString();
    console.log(chunk.toString());
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
