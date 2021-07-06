import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const SensorReadings = new Mongo.Collection('sensorReadings');

Meteor.isServer && SensorReadings._ensureIndex({ date: -1 });
