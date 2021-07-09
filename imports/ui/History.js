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
    const end = hourRange[1] && dayjs().subtract(hourRange[1], 'hours').toDate()
    const sub = Meteor.subscribe('sensorReadings', start, end);
    /*
    Meteor.call('sensorAggregation', start, end,(err,res)=>{
      console.log(err,res);
    });
    */
    return () => {
      sub.stop();
    }
  }, [hourRange]);
  const sensorReadings = useTracker(() => {
    return SensorReadings.find({}, { sort: { date: -1 } }).fetch();
  });
  const hour = dayjs().hour() + 1;
  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart syncId="anyId" width={730} height={250} data={sensorReadings.map(sensor => {
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
        <LineChart syncId="anyId" width={730} height={250} data={sensorReadings.map(sensor => {
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
          <YAxis type="number" unit="%" domain={[0, 100]} for label={{ value: 'Feuchtigkeit', angle: -90, position: 'insideLeft' }} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => value.toFixed(2) + '°'} />
          <Line type="monotone" dataKey="Außen" dot={false} stroke="#000088" />
          <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
          <Line type="monotone" dataKey="Boden" dot={false} stroke="#448844" />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={200} >
        <LineChart syncId="anyId" width={730} height={250} data={sensorReadings.map(sensor => {
          return {
            name: dayjs(sensor.date).format('DD.MM HH:mm'),
            Regen: Number(sensor.parsed.rainratein),
            Wind: Number(sensor.parsed.windspeedmph),
            Sonnenschein: Number(sensor.parsed.solarradiation) / 100,
          }
        })}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" />
          <Legend verticalAlign="top" height={36} />
          <YAxis type="number" width={25} allowDecimals={false} for yAxisId="left" />
          <YAxis type="number" width={35} axisLine={{ stroke: "#000088" }} for yAxisId="right" />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => value.toFixed(2) + '°'} />
          <Line type="monotone" yAxisId="right" dataKey="Regen" dot={false} stroke="#000088" />
          <Line type="monotone" yAxisId="left" dataKey="Wind" dot={false} stroke="#aaaaaa" />
          <Line type="monotone" yAxisId="left" dataKey="Sonnenschein" dot={false} stroke="#ff8800" />
        </LineChart>
      </ResponsiveContainer>
      <Box height={100}>&nbsp;</Box>
      <Paper className={classes.slider}>
        <Slider
          value={hourRange}
          aria-labelledby="discrete-slider-custom"
          step={1}
          onChange={(evt, value) => {
            if((hourRange[0] !== value[0]) && (value[1] - value[0] > 12) ) {
              setHourRange([value[0],value[0]+12]);
            } else if((hourRange[1] !== value[1]) && (value[1] - value[0] > 12) ) {
              setHourRange([value[1]-12,value[1]]);
            } else
            setHourRange(value);
          }}
          valueLabelFormat={(value) => dayjs().subtract(value, 'hours').format('HH') + 'Uhr'}
          valueLabelDisplay="on"
          marks={[24 - hour, 48 - hour, 72 - hour, 96 - hour, 120 - hour, 144 - hour].map(value => ({
            value,
            label: dayjs().subtract(value, 'hours').format('DD.MM.')
          }))}
        />
      </Paper>
    </>);
};

export default History;