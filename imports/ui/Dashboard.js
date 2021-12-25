import React from 'react';
import { beaufort } from '../api/sensorData';
import { Grid, Box } from '@mui/material';
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

const Dashboard = ({ latest }) => {
  const reading = latest?.parsed;

  const wind = beaufort.find((b) => b.mph >= reading.windspdmph_avg10m);
  const windgust = beaufort.find((b) => b.mph >= reading.windgustmph);
  const winddir = degToCompass(reading.winddir_avg10m);
  console.log('WInd:',{dir:reading.winddir_avg10m,winddir,test:degToCompass(180),test2:degToCompass(0)})
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
          text="Sonnenstrahlung und UV Index"
        />
        <DashboardItem
          src={'/icons/rain.svg'}
          value={`${reading.hourlyrainin.toFixed(2)} mm `}
          text={['Regenmenge pro Stunde', `Regen heute ${reading.dailyrainin.toFixed(2)} mm`]}
        />
      </Grid>
    </Box>
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
