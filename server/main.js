import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ManualReadings, SensorReadings, SolarReadings } from '../imports/api/sensorData';
import { setupMQTT } from '../imports/api/mqtt';
import './excelExport';
import '../imports/common/methods';
import './publication';
import './connectHandler';

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
