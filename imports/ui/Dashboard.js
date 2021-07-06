import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings } from '../api/sensorData';

const Dashboard = () => {
  useEffect(() => {
    const sub = Meteor.subscribe('sensorReadings');
    return () => sub.stop();
  }, []);
  const sensorReadings = useTracker(() => {
    return SensorReadings.find({}, { sort: { date: -1 } }).fetch();
  });

  return (
    <div>
      <div>{sensorReadings.map(
        reading => <div key={reading._id} style={{ margin: 16 }}>{reading.date.toString()}<pre style={{ backgroundColor: 'grey', padding: 8 }} key={reading._id}>
          {JSON.stringify(reading.parsed, null, 2)}
        </pre></div>
      )}</div>
    </div>
  );
};

export default Dashboard;