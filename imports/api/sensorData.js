import { Mongo } from 'meteor/mongo';

export const SensorReadings = new Mongo.Collection('sensorReadings');
export const SolarReadings = new Mongo.Collection('solarReadings');
export const ManualReadings = new Mongo.Collection('manualReadings');
export const SensorInfos = new Mongo.Collection('sensorInfos');


export const beaufort = [
  { beaufort: 0, mph: 0, text: 'Windstille' },
  { beaufort: 1, mph: 1.2, text: 'leichter Zug' },
  { beaufort: 2, mph: 4.6, text: 'leichte Brise' },
  { beaufort: 3, mph: 8.1, text: 'schwache Brise' },
  { beaufort: 4, mph: 12.7, text: 'mäßige Brise' },
  { beaufort: 5, mph: 18.4, text: 'frische Brise' },
  { beaufort: 6, mph: 25.3, text: 'starker Wind' },
  { beaufort: 7, mph: 32.2, text: 'steifer Wind' },
  { beaufort: 8, mph: 39.1, text: 'stürmischer Wind' },
  { beaufort: 9, mph: 47.2, text: 'Sturm 	hohe' },
  { beaufort: 10, mph:55.2 , text: 'schwerer Sturm' },
  { beaufort: 11, mph: 64.4, text: 'orkanartiger Sturm' },
  { beaufort: 12, mph: 73.6, text: 'Orkan' }];