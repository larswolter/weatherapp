import React, { useCallback, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings } from '../api/sensorData';
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer } from 'recharts';
import { makeStyles } from '@material-ui/styles';
import { Paper, Slider } from '@material-ui/core';
import dayjs from 'dayjs';
import { Box } from '@material-ui/core';
import debounce from '@material-ui/core/utils/debounce';

const useStyles = makeStyles(theme => {
  return {
    slider: {
      position: 'fixed',
      padding: theme.spacing(),
      bottom: 55,
      left: 0,
      right: 0
    }
  }
});

const History = () => {
  const classes = useStyles();
  const [hourRange, setHourRange] = useState([0, 4]);

  useEffect(() => {
    const start = hourRange[0] && dayjs().subtract(hourRange[0], 'hours').toDate();
    const end = hourRange[1] && dayjs().subtract(hourRange[1], 'hours').toDate();
    let sub;
    if (hourRange[1] - hourRange[0] > 4) {
      sub = Meteor.subscribe('sensorAggregation', start, end, Math.floor(window.innerWidth / 3));
    } else {
      sub = Meteor.subscribe('sensorReadings', start, end);

    }
    return () => {
      sub.stop();
    }
  }, [hourRange]);
  const sensorReadings = useTracker(() => {
    return SensorReadings.find({}, { sort: { date: -1 } }).fetch();
  });
  const hour = dayjs().hour() + 1;
  const days = [];
  for (let d = 0; d < 8; d++) days.push(d * 24 - hour);
  console.log('Got sensorReadings', sensorReadings.length, days);
  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart syncId="anyId" width={730} height={250} data={sensorReadings.map(reading => {
          const sensor = { ...reading, ...reading.parsed };
          return {
            name: dayjs(sensor.date).format('DD.MM HH:mm'),
            Außen: (sensor.tempf - 32) * 5 / 9,
            Innen: (sensor.tempinf - 32) * 5 / 9,
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
        <LineChart syncId="anyId" width={730} height={250} data={sensorReadings.map(reading => {
          const sensor = { ...reading, ...reading.parsed };
          return {
            name: dayjs(sensor.date).format('DD.MM HH:mm'),
            Außen: sensor.humidity,
            Innen: sensor.humidityin,
            Boden: sensor.soilmoisture1,
          }
        })}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" />
          <Legend verticalAlign="top" height={36} />
          <YAxis type="number" unit="%" domain={[0, 100]} for label={{ value: 'Feuchtigkeit', angle: -90, position: 'insideLeft' }} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => value.toFixed(2) + '%'} />
          <Line type="monotone" dataKey="Außen" dot={false} stroke="#000088" />
          <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
          <Line type="monotone" dataKey="Boden" dot={false} stroke="#448844" />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={200} >
        <LineChart syncId="anyId" width={730} height={250} data={sensorReadings.map(reading => {
          const sensor = { ...reading, ...reading.parsed };
          return {
            name: dayjs(sensor.date).format('DD.MM HH:mm'),
            Regen: sensor.rainratein,
            Wind: sensor.windspeedmph * 1.60934, // in kmh
            Sonnenschein: sensor.solarradiation / 100,
          }
        })}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" />
          <Legend verticalAlign="top" height={36} />
          <YAxis type="number" width={25} allowDecimals={false} for yAxisId="left" />
          <YAxis type="number" width={35} axisLine={{ stroke: "#000088" }} for yAxisId="right" />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value, name) => {
            if (name === 'Regen') return value.toFixed(2) + ' mm'
            if (name === 'Wind') return value.toFixed(2) + ' km/h'
            if (name === 'Sonnenschein') return (value * 100).toFixed(2) + ' Watt'
          }} />
          <Line type="monotone" yAxisId="right" dataKey="Regen" dot={false} stroke="#000088" />
          <Line type="monotone" yAxisId="left" dataKey="Wind" dot={false} stroke="#aaaaaa" />
          <Line type="monotone" yAxisId="left" dataKey="Sonnenschein" dot={false} stroke="#ff8800" />
        </LineChart>
      </ResponsiveContainer>
      <Box height={100}>&nbsp;</Box>
      <Paper className={classes.slider}>
        <Slider
          max={8 * 24}
          min={0}
          value={hourRange}
          step={1}
          onChange={(evt, value) => {
            if (value[0] === value[1]) setHourRange([value[0], value[0] + 1]);
            else setHourRange(value);
          }}
          valueLabelFormat={(value) => dayjs().subtract(value, 'hours').format('HH') + 'Uhr'}
          valueLabelDisplay="on"
          marks={days.map(value => ({
            value,
            label: dayjs().subtract(value, 'hours').format('DD.MM.')
          }))}
        />
      </Paper>
    </>);
};

export default History;