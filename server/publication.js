import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { ManualReadings, SensorReadings, SolarReadings } from '../imports/api/sensorData';
import config from './config';

Meteor.publish('latestData', async function () {
  if (!this.userId) throw new Meteor.Error(403, 'access denied');
  const consumedHandler = await ManualReadings.find({ manualReading: 'powerConsumed' }, { sort: { date: -1 }, limit: 1 }).observe({
    removed: (old) => {
      this.removed('manualReadings', old._id);
    },
    added: (doc) => {
      this.added('manualReadings', doc._id, doc);
    },
  });
  const producedHandler = await ManualReadings.find({ manualReading: 'powerProduced' }, { sort: { date: -1 }, limit: 1 }).observe({
    removed: (old) => {
      this.removed('manualReadings', old._id);
    },
    added: (doc) => {
      this.added('manualReadings', doc._id, doc);
    },
  });
  this.onStop(() => {
    consumedHandler.stop();
    producedHandler.stop();
  });
  return [SensorReadings.find({}, { sort: { date: -1 }, limit: 1 }), SolarReadings.find({}, { sort: { date: -1 }, limit: 1 })];
});

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
  