import { ManualReadings, SensorReadings, SolarReadings } from '../imports/api/sensorData';

const config = {
  hour: {
    buckets: 60,
    subScale: 'minute',
    densityRange: { unit: 'second', step: 10 },
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
          Westen: reading.Westen && reading.Westen[0],
          Süden: reading['Süden'] && reading['Süden'][1],
        };
      },
      col: SolarReadings,
      dontInterpolate: true,
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
          Westen: reading.Westen && (reading['Westen'][0] - reading['Westen Min'][0]) * 0.001,
          Süden: reading['Süden'] && (reading['Süden'][1] - reading['Süden Min'][1]) * 0.001,
        };
        if (Number.isNaN(res.Westen)) console.log(reading);
        return res;
      },
      col: SolarReadings,
      useBars: true,
      dontInterpolate: true,
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
  densityRange: { unit: 'minute', step: 1 },
  dateFormat: 'HH:mm',
  subScaleMultiplier: 30,
  temp: config.hour.temp,
  humidity: config.hour.humidity,
  wind: config.hour.wind,
  barom: config.hour.barom,
  rain: config.hour.rain,
  sun: config.hour.sun,
  powerConsumed: {...config.hour.powerConsumed, subScale: 'hour'},
  powerProduced: {...config.hour.powerProduced, subScale: 'hour'},
  solar: config.hour.solar,
};
config.week = {
  buckets: 7,
  subScale: 'hour',
  densityRange: { unit: 'minute', step: 10 },
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
  powerConsumed: {...config.hour.powerConsumed, subScale: 'day'},
  powerProduced: {...config.hour.powerProduced, subScale: 'day'},
  solar: config.hour.solar,
};
config.month = {
  buckets: 30,
  subScale: 'day',
  densityRange: { unit: 'hour', step: 1 },
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
  densityRange: { unit: 'day', step: 1 },
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
export default config;
