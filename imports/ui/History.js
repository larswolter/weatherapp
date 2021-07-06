import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings } from '../api/sensorData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, Label } from 'recharts';
import dayjs from 'dayjs';

const History = () => {
  useEffect(() => {
    const sub = Meteor.subscribe('sensorReadings', 100);
    return () => sub.stop();
  }, []);
  const sensorReadings = useTracker(() => {
    return SensorReadings.find({}, { sort: { date: -1 } }).fetch();
  });
  console.log(sensorReadings);
  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart width={730} height={250} data={sensorReadings.map(sensor => {
          return {
            name: dayjs(sensor.date).format('DD.MM HH:mm'),
            Außen: (Number(sensor.parsed.tempf) - 32) * 5 / 9,
            Innen: (Number(sensor.parsed.tempinf) - 32) * 5 / 9,
          }
        })}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" />
          <Legend verticalAlign="top" height={36} />
          <YAxis type="number" unit="°" label={{ value: 'Temperatur', angle: -90, position: 'insideLeft' }} domain={[dataMin => (Math.round(dataMin) - 2), dataMax => Math.round(dataMax) + 2]} for />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => value.toFixed(2) + '°'} />
          <Line type="monotone" dataKey="Außen" dot={false} stroke="#000088" />
          <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart width={730} height={250} data={sensorReadings.map(sensor => {
          return {
            name: dayjs(sensor.date).format('DD.MM HH:mm'),
            Außen: Number(sensor.parsed.humidity),
            Innen: Number(sensor.parsed.humidityin),
            Boden: Number(sensor.parsed.soilmoisture1),
          }
        })}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" />
          <Legend verticalAlign="top" height={36} />
          <YAxis type="number" unit="%" domain={[0, 100]} for label={{ value: 'Feuchtigkeit', angle: -90, position: 'insideLeft' }}/>
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => value.toFixed(2) + '°'} />
          <Line type="monotone" dataKey="Außen" dot={false} stroke="#000088" />
          <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
          <Line type="monotone" dataKey="Boden" dot={false} stroke="#448844" />
        </LineChart>
      </ResponsiveContainer>

    </>);
};

export default History;