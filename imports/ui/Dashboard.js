import React, { useEffect, useState } from 'react';
import { beaufort } from '../api/sensorData';
import { Grid, Box } from '@mui/material';
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
  const [aggregated, setAggregated] = useState({});

  useEffect(() => {
    const sup = Meteor.subscribe('latestData');
    return () => {
      sup.stop();
    };
  }, []);
  const latest = useTracker(() => {
    const sensor = SensorReadings.findOne({}, { sort: { date: -1 } }) || {};
    const solar = SolarReadings.findOne({}, { sort: { date: -1 } }) || {};
    return {
      date: sensor.date,
      parsed: {
        ...sensor.parsed,
        ...solar.parsed,
      },
    };
  });

  if (!latest) return <LinearProgress variant="indeterminate" />;

  const reading = latest?.parsed;

  const wind = beaufort.find((b) => b.mph >= reading.windspdmph_avg10m);
  const windgust = beaufort.find((b) => b.mph >= reading.windgustmph);
  const winddir = degToCompass(reading.winddir_avg10m);
  console.log('Dashboard:', aggregated);
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
          src={reading.uv ? `/icons/uv-index-${reading.uv}.svg` : '/icons/clear-day.svg'}
          value={`${reading.solarradiation.toFixed(4)} Watt ${reading.uv ? '' : ',Kein UV Index'}`}
          text={[
            'Sonnenstrahlung und UV Index'
          ]}
        />
        <DashboardItem
          src={'/icons/rain.svg'}
          value={`${(reading.hourlyrainin * 100).toFixed(2)} mm `}
          text={['Regenmenge pro Stunde', `Regen heute ${(reading.dailyrainin * 100).toFixed(2)} mm`]}
        />
        {reading.phases && (
          <DashboardItem
            src={'/icons/uv-index-1.svg'}
            value={`${(reading.phases && reading.phases[0] && reading.phases[0].power).toFixed(0)} W (${dayjs
              .utc(reading.time, 'YYYY-MM-DD HH:mm:ss')
              .local()
              .format('DD.MM. HH:mm')})`}
            text={[
              'Solarmodule',
              ...(reading.strings && reading.strings.map((string) => `${string.power}W ${string.energy_daily}Wh `)),
              reading.strings && reading.strings.reduce((total, string) => total + string.energy_total, 0) / 1000 + 'kWh',
            ]}
          />
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
