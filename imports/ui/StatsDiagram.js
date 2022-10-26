import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings } from '../api/sensorData';
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, ReferenceArea, Area, AreaChart } from 'recharts';
import { Button, FormControl, InputLabel, LinearProgress, MenuItem, Select, Skeleton, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

export const SensorInfos = new Mongo.Collection('sensorInfos');

const dateFormater = (mode) => (item) => {
  switch (mode) {
    case 'hour':
      return dayjs(item).format('HH:mm');
    case 'day':
      return dayjs(item).format('ddd HH:mm');
    case 'week':
      return dayjs(item).format('DD.MM.');
    case 'month':
      return dayjs(item).format('DD.MM.');
    case 'year':
      return dayjs(item).format('DD.MM.');
    default:
      return dayjs(item).format('DD.MM. HH:mm');
  }
};

const StatsDiagram = ({ source, scale, offset, diagramHeight }) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    const fields = { date: 1 };
    const sub = Meteor.subscribe('sensorStats', { offset, source, scale }, () => {});
    return () => {
      sub.stop();
    };
  }, [offset, source, scale]);

  const sensorReadings = useTracker(() => {
    return SensorReadings.find({ source }, { sort: { date: 1 } }).fetch();
  });
  const sensorInfos = useTracker(() => {
    return SensorInfos.findOne({ source });
  });
  if (!sensorInfos || !sensorReadings) return <Skeleton variant="rectangular" height={diagramHeight} />;
  console.log({ sensorInfos, sensorReadings });
  return (
    <ResponsiveContainer width="100%" height={diagramHeight}>
      <LineChart syncId="anyId" width={730} height={diagramHeight} data={sensorReadings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="date" tickFormatter={dateFormater(scale)} />
        <Legend verticalAlign="top" height={36} />
        <YAxis width={50} type="number" unit={''} for />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip
          contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
          formatter={(value) => value.toFixed(2) + sensorInfos.unit}
          labelFormatter={(date) => dayjs(date).format(sensorInfos.dateFormat)}
        />
        {sensorInfos.lines &&
          sensorInfos.lines.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} dot={false} stroke={line.strokeDark && darkMode ? line.strokeDark : line.stroke} />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default StatsDiagram;
