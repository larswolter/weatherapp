import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { beaufort, SensorReadings } from '../api/sensorData';
import { Grid, CircularProgress, makeStyles } from '@material-ui/core';
import DashboardItem from './DashboardItem';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import de from 'dayjs/locale/de';

dayjs.locale(de);
dayjs.extend(utc);

const useStyles = makeStyles(theme => {
  return {
    root: {
      margin: theme.spacing()
    }
  }
});



const Dashboard = () => {
  const classes = useStyles()
  useEffect(() => {
    const sub = Meteor.subscribe('sensorReadings',(err)=>{
      console.log(err);
    });
    return () => sub.stop();
  }, []);
  const sensorReadings = useTracker(() => {
    return SensorReadings.find({}, { sort: { date: -1 } }).fetch();
  });
  const reading = sensorReadings[0]?.parsed;
  if (!reading || !reading.dateutc) return <CircularProgress />

  const wind = beaufort.find(b=>b.mph >= reading.windspdmph_avg10m);
  console.log(reading);
  return (
    <Grid container spacing={1}>
      <Grid xs={12} item>
        {reading.dateutc.split('+').join(' ')}
      </Grid>
      <DashboardItem
        src="/icons/thermometer.svg"
        value={`${((reading.tempinf - 32) * 5 / 9).toFixed(2)} °C`}
        text="Innentemperatur" />
      <DashboardItem
        src="/icons/thermometer.svg"
        value={`${((reading.tempf - 32) * 5 / 9).toFixed(2)} °C`}
        text="Außentemperatur" />
      <DashboardItem
        src="/icons/humidity.svg"
        value={`${(reading.humidityin).toFixed(2)} %`}
        text="Innenraumfeuchtigkeit" />
      <DashboardItem
        src="/icons/humidity.svg"
        value={`${(reading.humidity).toFixed(2)} %`}
        text="Außenfeuchtigkeit" />
      <DashboardItem
        src={`/icons/wind-beaufort-${wind.beaufort}.svg`}
        value={`${(reading.windspdmph_avg10m* 1.60934).toFixed(2)} km/h`}
        text="Windgeschwindigkeit" />
      <DashboardItem
        src={reading.uv?`/icons/uv-index-${reading.uv}.svg`:'/icons/clear-day.svg'}
        value={`${(reading.solarradiation).toFixed(4)} Watt ${reading.uv?'':',Kein UV Index'}`}
        text="Sonnenstrahlung und UV Index" />
      <DashboardItem
        src={'/icons/rain.svg'}
        value={`${(reading.hourlyrainin).toFixed(2)} mm `}
        text="Regenmenge pro Stunde" />
    </Grid>
  );
};

/*
{
  "PASSKEY": "4ADCEC4AFD5914CBCFF65D6BB0BA8868",
  "stationtype": "EasyWeatherV1.5.2",
  "dateutc": "2021-07-13+21:22:09",
  "tempinf": "75.0",
  "humidityin": "74",
  "baromrelin": "29.770",
  "baromabsin": "29.457",
  "tempf": "71.8",
  "humidity": "82",
  "winddir": "333",
  "winddir_avg10m": "324",
  "windspeedmph": "0.2",
  "windspdmph_avg10m": "0.4",
  "windgustmph": "3.4",
  "maxdailygust": "11.windspdmph_avg10m4",
  "rainratein": "0.071",
  "eventrainin": "0.244",
  "hourlyrainin": "0.138",
  "dailyrainin": "0.244",
  "weeklyrainin": "0.350",
  "monthlyrainin": "2.339",
  "yearlyrainin": "3.984",
  "solarradiation": "0.00",
  "uv": "0",
  "soilmoisture1": "10",
  "model": "WS2350"
}
*/
export default Dashboard;