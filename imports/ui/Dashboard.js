import React, { useEffect, useState } from 'react';
import { beaufort, ManualReadings } from '../api/sensorData';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings, SolarReadings } from '../api/sensorData';
import DashboardItem from './DashboardItem';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import de from 'dayjs/locale/de';

dayjs.locale(de);
dayjs.extend(utc);

const degToCompass = (num) => {
  const val = Number(num) / 22.5 + 0.5;
  const arr = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[Math.floor(val) % 16];
};

const Dashboard = () => {
  const userId = useTracker(() => {
    return Meteor.connection.userId();
  });
  useEffect(() => {
    const sup = Meteor.subscribe('latestData');
    console.log('subscribing latestData');
    return () => {
      sup.stop();
      console.log('stopped subscribing latestData');
    };
  }, [userId]);
  const latest = useTracker(() => {
    const sensor = SensorReadings.findOne({}, { sort: { date: -1 } }) || {};
    const solar = SolarReadings.findOne({}, { sort: { date: -1 } }) || {};
    const powerConsumed = ManualReadings.findOne({ manualReading: 'powerConsumed' }, { sort: { date: -1 } }) || {};
    const powerProduced = ManualReadings.findOne({ manualReading: 'powerProduced' }, { sort: { date: -1 } }) || {};
    console.log('Tracker',ManualReadings.find().fetch(), {powerConsumed, powerProduced})
    return (
      (sensor.parsed || solar.parsed) && {
        date: sensor.date,
        solarDate: solar.date,
        parsed: {
          ...sensor.parsed,
          ...solar.parsed,
          powerConsumed,
          powerProduced,
        },
      }
    );
  });

  const reading = latest?.parsed;
  if (!reading) return <LinearProgress variant="indeterminate" />;

  const wind = beaufort.find((b) => b.mph >= reading.windspdmph_avg10m);
  const windgust = beaufort.find((b) => b.mph >= reading.windgustmph);
  const winddir = degToCompass(reading.winddir_avg10m);
  console.log('Dashboard:', latest);
  return (
    <Box padding={2} overflow="auto" height="100%">
      <Grid container spacing={1}>
        <Grid xs={12} item>
          {dayjs.utc(reading.dateutc.split('+').join(' '), 'YYYY-MM-DD HH:mm:ss').local().format('DD.MM.YYYY HH:mm')}
        </Grid>
        <DashboardItem src="/icons/thermometer.svg" value={`${(((reading.tempinf - 32) * 5) / 9).toFixed(2)} °C`} text="Innentemperatur" />
        <DashboardItem src="/icons/thermometer.svg" value={`${(((reading.tempf - 32) * 5) / 9).toFixed(2)} °C`} text="Außentemperatur" />
        <DashboardItem src="/icons/humidity.svg" value={`${reading.humidityin.toFixed(2)} %`} text="Innenraumfeuchtigkeit" />
        <DashboardItem src="/icons/humidity.svg" value={`${reading.humidity.toFixed(2)} %`} text="Außenfeuchtigkeit" />
        <DashboardItem
          src={`/icons/wind-beaufort-${wind.beaufort}.svg`}
          value={`${(reading.windspdmph_avg10m * 1.609344).toFixed(2)} km/h`}
          text={`Windgeschwindigkeit ${winddir}`}
        />
        <DashboardItem
          src={`/icons/wind-beaufort-${windgust.beaufort}.svg`}
          value={`${(reading.windgustmph * 1.609344).toFixed(2)} km/h`}
          text={['Windböhen', `Stärkste Böhe ${(reading.maxdailygust * 1.609344).toFixed(2)} km/h`]}
        />
        <DashboardItem
          src={'/icons/rain.svg'}
          value={`${(reading.hourlyrainin * 25.4).toFixed(2)} mm `}
          text={['Regenmenge pro Stunde', `Regen heute ${(reading.dailyrainin * 25.4).toFixed(2)} mm`]}
        />
        <DashboardItem
          src={reading.uv ? `/icons/uv-index-${reading.uv}.svg` : '/icons/clear-day.svg'}
          value={`${reading.solarradiation.toFixed(4)} Watt ${reading.uv ? '' : ',Kein UV Index'}`}
          text={[
            `Solarmodule (${dayjs(latest.solarDate).format('DD.MM. HH:mm')})`,
            ...((reading.strings && reading.strings.map((string) => `${string.power}W ${string.energy_daily}Wh `)) || []),
            reading.strings && reading.strings.reduce((total, string) => total + string.energy_total, 0) / 1000 + 'kWh',
          ]}
        />
        <DashboardItem
          onAddValue={(value)=>{
            value && Meteor.callAsync('addValue','powerConsumed', Number(value));
          }}
          value={`${reading.powerConsumed?.value || '-'} kWh `}
          text={['Strom verbraucht', reading.powerConsumed?.date && dayjs(reading.powerConsumed.date).format('DD.MM. HH:mm')]}
        />
        <DashboardItem
          onAddValue={(value)=>{
            value && Meteor.callAsync('addValue','powerProduced', Number(value));
          }}
          value={`${reading.powerProduced?.value || '-'} kWh `}
          text={['Strom produziert', reading.powerProduced?.date && dayjs(reading.powerProduced.date).format('DD.MM. HH:mm')]}
        />
      </Grid>
    </Box>
  );
};

export default Dashboard;
