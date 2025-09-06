import dayjs from 'dayjs';
import { Meteor } from 'meteor/meteor';
import { ManualReadings, SensorReadings, SolarReadings } from '../imports/api/sensorData';
import config from '../imports/common/config';

const collections = {
  ManualReadings, 
  SensorReadings, 
  SolarReadings
}
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
  const fillOutput = {};
  const defaultValues = {};
  if(!config[scale][source]) return [];
  const transform = config[scale][source].transform;
  const densityRange = config[scale].densityRange;
  const boundaries = [];
  const subScale = config[scale][source].subScale || config[scale].subScale;

  const start = dayjs().startOf(scale).subtract(yearOffset, 'year').subtract(offset, scale);
  const end = dayjs().endOf(scale).subtract(yearOffset, 'year').subtract(offset, scale);
  const preSearch = { date: { $gte: start.subtract(1,scale).toDate(), $lte: end.add(1,scale).toDate() }, ...(config[scale][source].match || {}) };
  const finalSearch = { date: { $gte: start.toDate(), $lte: end.toDate() } };
  const collection = collections[config[scale][source].col];
  config[scale][source].lines.forEach((l) => {
    fields['parsed.' + (l.sourceKey || l.key)] = 1;
    if (config[scale][source].dontInterpolate) {
      output[l.key] = { [l.sel]: '$parsed.' + (l.sourceKey || l.key) };
    } else {
      output[l.key] = { [l.sel]: '$ip' + (l.sourceKey || l.key) };
      fillOutput['ip' + (l.sourceKey || l.key)] = { $linearFill: '$parsed.' + (l.sourceKey || l.key) };
    }
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
    output: JSON.stringify({ output, fillOutput }, null, 2),
  };
  this.added('sensorInfos', source + scale, infos);
  try {
    const results = await collection
      .rawCollection()
      .aggregate([
        { $match: preSearch },
        {
          $densify: {
            field: 'date',
            range: {
              ...densityRange,
              bounds: [preSearch.date.$gte, preSearch.date.$lte],
            },
          },
        },
        { $sort: { date: 1 } },

        ...(!config[scale][source].dontInterpolate
          ? [
              {
                $setWindowFields: {
                  partitionBy: null,
                  sortBy: { date: 1 },
                  output: fillOutput,
                },
              },
            ]
          : []),
        { $match: finalSearch },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: '$date', // Dein Datumsfeld
                unit: subScale,
              },
            },
            ...output,
          },
        },
      ])
      .toArray();
    results.forEach((reading) => {
      const values = transform ? transform(reading) : reading;
      this.added('sensorReadings', source + reading._id, { ...values, reading, _id: source + reading._id, source, yearOffset, offset });
    }); /*
    boundaries.forEach((_id) => {
      const reading = results.find((r) => dayjs(r._id).isSame(_id, 'second'));
      if (reading) {
        const values = transform ? transform(reading) : reading;
        this.added('sensorReadings', source + reading._id, { ...values, _id: source + reading._id, source, yearOffset, offset });
      } else {
        this.added('sensorReadings', source + _id, { _id: source + _id, date: _id, source, yearOffset, offset });
      }
    });*/
    this.ready();
  } catch (err) {
    console.log('ERROR' + err.message + ' : ' + err.reason, err);
    throw new Meteor.Error('ERROR' + err.message + ' : ' + err.reason);
  }
});
