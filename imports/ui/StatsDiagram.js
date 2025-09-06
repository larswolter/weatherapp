import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorInfos, SensorReadings } from '../api/sensorData';
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';
import Skeleton from '@mui/material/Skeleton';
import useTheme from '@mui/material/styles/useTheme';
import Box from '@mui/material/Box';
import { LinearProgress, Typography } from '@mui/material';
import { dateFormater } from './helpers';
import config from '../common/config';

const StatsDiagram = ({ source, scale, offset, diagramHeight, idx, yearOffset }) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const subScale = config[scale][source].subScale || config[scale].subScale;
  const isLoading = useTracker(() => {
    const sub = Meteor.subscribe('sensorStats', { offset, source, scale }, () => {});
    const subOld = yearOffset && Meteor.subscribe('sensorStats', { offset, source, scale, yearOffset }, () => {});

    return !(sub.ready() && (!subOld || subOld.ready()));
  }, [offset, source, scale, yearOffset]);

  const sensorReadings = useTracker(() => {
    if (yearOffset) {
      const oldReadings = SensorReadings.find({ source, offset, yearOffset }, { sort: { date: 1 } }).fetch();
      return SensorReadings.find({ source, yearOffset: 0 }, { sort: { date: 1 } }).map((reading, sridx) => {
        const old = oldReadings[sridx];
        old &&
          Object.keys(old).forEach((key) => {
            reading[key + ' Alt'] = old[key];
          });
        return reading;
      });
    } else return SensorReadings.find({ source, offset }, { sort: { date: 1 } }).fetch();
  });

  const sensorInfos = useTracker(() => {
    return SensorInfos.findOne({ source });
  });
  if(!config[scale][source]) return <Typography padding={4} textAlign="center" width="100%">Daten können in dieser Zeitskala nicht angezeigt werden</Typography>
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
        {sensorInfos.useBars ? (
          <BarChart syncId="anyId" width={730} height={diagramHeight} data={sensorReadings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tickFormatter={dateFormater(subScale)} />
            <Legend verticalAlign="top" height={36} />
            <YAxis width={50} type="number" unit={''} for />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip
              contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
              formatter={(value, key) => {
                const line = sensorInfos.lines.find((l) => l.key === key);
                return value.toFixed(2) + (line && line.unit ? line.unit : sensorInfos.unit);
              }}
              labelFormatter={dateFormater(subScale)}
            />
            {sensorInfos.lines &&
              sensorInfos.lines.map((line) => (
                <React.Fragment key={line.key}>
                  {yearOffset ? (
                    <Bar
                      key={line.key + ' Alt'}
                      dataKey={line.key + ' Alt'}
                      fillOpacity={0.5}
                      fill={line.strokeDark && darkMode ? line.strokeDark : line.stroke}
                    />
                  ) : null}

                  <Bar dataKey={line.key} fill={line.strokeDark && darkMode ? line.strokeDark : line.stroke} />
                </React.Fragment>
              ))}
          </BarChart>
        ) : (
          <LineChart syncId="anyId" width={730} height={diagramHeight} data={sensorReadings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tickFormatter={dateFormater(subScale)} />
            <Legend verticalAlign="top" height={36} />
            <YAxis width={50} type="number" unit={''} for />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip
              contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
              formatter={(value, key) => {
                const line = sensorInfos.lines.find((l) => l.key === key);
                return value.toFixed(2) + (line && line.unit ? line.unit : sensorInfos.unit);
              }}
              labelFormatter={dateFormater(subScale)}
            />
            {sensorInfos.lines &&
              sensorInfos.lines.map((line) => (
                <Line
                  connectNulls
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  dot={false}
                  stroke={line.strokeDark && darkMode ? line.strokeDark : line.stroke}
                />
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
        )}
      </ResponsiveContainer>
      {isLoading?<LinearProgress />:null}
    </Box>
  );
};

export default StatsDiagram;
