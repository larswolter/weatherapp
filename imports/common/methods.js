import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { ManualReadings } from '../api/sensorData';

Meteor.methods({
  async addValue(manualReading, value) {
    check(manualReading, String);
    check(value, Number);

    if (!this.userId) throw new Meteor.Error(403, 'access denied');
    await ManualReadings.insertAsync({ date: new Date(), value, manualReading });
  },
});
