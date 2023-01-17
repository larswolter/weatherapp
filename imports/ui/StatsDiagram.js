import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorInfos, SensorReadings } from '../api/sensorData';
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, ReferenceArea, Area, AreaChart } from 'recharts';
import { Button, FormControl, InputLabel, LinearProgress, MenuItem, Select, Skeleton, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { Box } from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ChevronLeft from '@mui/icons-material/ChevronLeft';

const dateFormater = (mode) => (item) => {
  switch (mode) {
    case 'hour':
      return dayjs(item).format('HH:mm');
    case 'day':
      return dayjs(item).format('HH:mm');
    case 'week':
      return dayjs(item).format('ddd');
    case 'month':
      return dayjs(item).format('DD.MM.');
    case 'year':
      return dayjs(item).format('DD.MM.');
    default:
      return dayjs(item).format('DD.MM. HH:mm');
  }
};

const StatsDiagram = ({ source, scale, offset, diagramHeight, idx, yearOffset }) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    const sub = Meteor.subscribe('sensorStats', { offset, source, scale }, () => {});
    const subOld = yearOffset && Meteor.subscribe('sensorStats', { offset, source, scale, yearOffset }, () => {});

    return () => {
      sub.stop();
      subOld && subOld.stop();
    };
  }, [offset, source, scale, yearOffset]);

  const sensorReadings = useTracker(() => {
    if (yearOffset) {
      const oldReadings = SensorReadings.find({ source, yearOffset }, { sort: { date: 1 } }).fetch();
      return SensorReadings.find({ source, yearOffset: 0 }, { sort: { date: 1 } }).map((reading, sridx) => {
        const old = oldReadings[sridx];
        old && Object.keys(old).forEach((key) => {
          reading[key + ' Alt'] = old[key];
        });
        return reading;
      });
    } else return SensorReadings.find({ source }, { sort: { date: 1 } }).fetch();
  });

  const sensorInfos = useTracker(() => {
    return SensorInfos.findOne({ source });
  });

  if (!sensorInfos || !sensorReadings) return <Skeleton variant="rectangular" height={diagramHeight} />;

  console.log({ sensorInfos, sensorReadings });
  return (
    <Box position="relative">
      {idx === 0 && sensorReadings.length ? (
        <Box position="absolute" top={5} right={5} fontSize="0.8rem" textAlign="right">
          {dayjs(sensorReadings[sensorReadings.length - 1].date).format('DD.MM.YY')}
          <br />
          {dayjs(sensorReadings[sensorReadings.length - 1].date).format('HH:mm')}
        </Box>
      ) : null}
      <ResponsiveContainer width="100%" height={diagramHeight}>
        <LineChart syncId="anyId" width={730} height={diagramHeight} data={sensorReadings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={dateFormater(scale)} />
          <Legend verticalAlign="top" height={36} />
          <YAxis width={50} type="number" unit={''} for />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
            formatter={(value, key) => {
              const line = sensorInfos.lines.find((l) => l.key === key);
              return value.toFixed(2) + (line && line.unit ? line.unit : sensorInfos.unit);
            }}
            labelFormatter={dateFormater(scale)}
          />
          {sensorInfos.lines &&
            sensorInfos.lines.map((line) => (
              <Line key={line.key} type="monotone" dataKey={line.key} dot={false} stroke={line.strokeDark && darkMode ? line.strokeDark : line.stroke} />
            ))}
          {yearOffset &&
            sensorInfos.lines &&
            sensorInfos.lines.map((line) => (
              <Line
                key={line.key + ' Alt'}
                type="monotone"
                dataKey={line.key + ' Alt'}
                dot={false}
                strokeOpacity={0.5}
                stroke={line.strokeDark && darkMode ? line.strokeDark : line.stroke}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default StatsDiagram;
