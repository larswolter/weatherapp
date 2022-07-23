import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings } from '../api/sensorData';
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, ReferenceArea, Area, AreaChart } from 'recharts';
import { Button, FormControl, InputLabel, LinearProgress, MenuItem, Select, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

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

const History = ({ latest }) => {
  const [diagramTypes, setDiagramTypes] = useState(['temp']);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('hour');
  const [dateRange, setDateRange] = useState([+latest.date, +dayjs(latest.date).subtract(1, 'hour').toDate()]);
  const [refAreaLeft, setRefAreaLeft] = useState();
  const [refAreaRight, setRefAreaRight] = useState();

  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const changeMode = (event) => {
    setMode(event.target.value);
    setDateRange([dateRange[0], +dayjs(dateRange[0]).subtract(1, event.target.value)]);
  };
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === 0) {
      setRefAreaRight(0);
      setRefAreaLeft(0);
      return;
    }

    // xAxis domain
    let [left, right] = [refAreaLeft, refAreaRight];
    if (refAreaLeft < refAreaRight) [left, right] = [refAreaRight, refAreaLeft];
    setDateRange([left, right]);
  };

  useEffect(() => {
    const start = dateRange[0];
    let end = dateRange[1];
    let sub;
    const fields = { date: 1 };
    diagramTypes.forEach((t) => {
      switch (t) {
        case 'temp':
          fields['parsed.tempf'] = 1;
          fields['parsed.tempinf'] = 1;
          break;
        case 'sun':
          fields['parsed.solarradiation'] = 1;
          break;
        case 'wind':
          fields['parsed.windspeedmph'] = 1;
          fields['parsed.windgustmph'] = 1;
          break;
        case 'rain':
          fields['parsed.rainratein'] = 1;
          break;
        case 'barom':
          fields['parsed.baromabsin'] = 1;
          fields['parsed.baromrelin'] = 1;
          break;
        case 'humidity':
          fields['parsed.humidity'] = 1;
          fields['parsed.humidityin'] = 1;
          fields['parsed.soilmoisture1'] = 1;
          break;
        default:
      }
    });
    setLoading(true);
    if (dayjs(dateRange[0]).diff(dateRange[1], 'minute') < 18) {
      end = +dayjs(dateRange[0]).subtract(20, 'minute');
      setDateRange([dateRange[0], end]);
    }
    if (dayjs(start).diff(end, 'hour') > 4) {
      sub = Meteor.subscribe(
        'sensorAggregation',
        { start: dayjs(start).toDate(), end: dayjs(end).toDate(), buckets: Math.floor(window.innerWidth / 3), fields },
        () => {
          setLoading(false);
        }
      );
    } else {
      sub = Meteor.subscribe('sensorReadings', { start: dayjs(start).toDate(), end: dayjs(end).toDate(), fields }, () => {
        setLoading(false);
      });
    }
    if (dayjs(start).diff(end, 'hour') < 3) setMode('hour');
    else if (dayjs(start).diff(end, 'day') < 3) setMode('day');
    else if (dayjs(start).diff(end, 'week') < 3) setMode('week');
    else if (dayjs(start).diff(end, 'month') < 3) setMode('month');
    else setMode('year');
    return () => {
      sub.stop();
    };
  }, [dateRange, diagramTypes]);

  const handle = (type) => {
    return (evt) => {
      console.log(diagramTypes);
      if (diagramTypes.includes(type)) setDiagramTypes(diagramTypes.filter((t) => t !== type));
      else setDiagramTypes([...diagramTypes, type]);
    };
  };
  const sensorReadings = useTracker(() => {
    const start = dayjs(dateRange[0]).toDate();
    const end = dayjs(dateRange[1]).toDate();
    return SensorReadings.find({ date: { $lte: start, $gte: end } }, { sort: { date: -1 } }).fetch();
  }, [dateRange]);
  const diagramHeight = (window.innerHeight - 210) / diagramTypes.length;
  console.log(sensorReadings);

  const controlProps = {/* 
    // is problematic on mobile devices with touch interactions
    onMouseDown:(e) => setRefAreaLeft(e.activeLabel),
    onMouseMove:(e) => refAreaLeft && setRefAreaRight(e.activeLabel),
    onMouseUp:() => zoom(),
    */
  }
  return (
    <Box display="flex" height="100%" flexDirection="column" justifyContent="space-between">
      <Box overflow="auto" padding={2}>
        {diagramTypes.includes('temp') && (
          <ResponsiveContainer width="100%" height={diagramHeight}>
            <LineChart
              syncId="anyId"
              width={730}
              height={diagramHeight}
              data={sensorReadings.map((reading) => {
                const sensor = { ...reading, ...reading.parsed };
                return {
                  name: +sensor.date,
                  Außen: ((sensor.tempf - 32) * 5) / 9,
                  Innen: ((sensor.tempinf - 32) * 5) / 9,
                };
              })}
              {...controlProps}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
              <Legend verticalAlign="top" height={36} />
              <YAxis
                width={40}
                type="number"
                unit="°"
                domain={[(dataMin) => Math.round(dataMin) - 2, (dataMax) => Math.round(dataMax) + 2]}
                for
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
                formatter={(value) => value.toFixed(2) + '°'}
                labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
              />
              <Line type="monotone" dataKey="Außen" dot={false} stroke={darkMode ? '#8888ff' : '#000088'} />
              <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
              {refAreaLeft && refAreaRight ? <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} /> : null}
            </LineChart>
          </ResponsiveContainer>
        )}
        {diagramTypes.includes('humidity') && (
          <ResponsiveContainer width="100%" height={diagramHeight}>
            <LineChart
              syncId="anyId"
              width={730}
              height={diagramHeight}
              data={sensorReadings.map((reading) => {
                const sensor = { ...reading, ...reading.parsed };
                return {
                  name: +sensor.date,
                  Außen: sensor.humidity,
                  Innen: sensor.humidityin,
                  Boden: sensor.soilmoisture1,
                };
              })}
              {...controlProps}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
              <Legend verticalAlign="top" height={36} />
              <YAxis width={40} type="number" domain={[0, 100]} for />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
                formatter={(value) => value.toFixed(2) + '%'}
                labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
              />
              <Line type="monotone" dataKey="Außen" dot={false} stroke={darkMode ? '#8888ff' : '#000088'} />
              <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
              <Line type="monotone" dataKey="Boden" dot={false} stroke="#448844" />
            </LineChart>
          </ResponsiveContainer>
        )}
        {diagramTypes.includes('wind') && (
          <ResponsiveContainer width="100%" height={diagramHeight}>
            <AreaChart
              syncId="anyId"
              width={730}
              height={diagramHeight}
              data={sensorReadings.map((reading) => {
                const sensor = { ...reading, ...reading.parsed };
                return {
                  name: +sensor.date,
                  Wind: sensor.windspeedmph * 1.609344, // in kmh
                  Böhen: sensor.windgustmph * 1.609344, // in kmh
                };
              })}
              {...controlProps}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
              <Legend verticalAlign="top" height={36} />
              <YAxis type="number" width={40} allowDecimals={false} for yAxisId="left" />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
                formatter={(value, name) => {
                  if (name === 'Wind') return value.toFixed(2) + ' km/h';
                  if (name === 'Böhen') return value.toFixed(2) + ' km/h';
                }}
                labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
              />
              <Area type="monotone" yAxisId="left" dataKey="Wind" stackId="1" dot={false} stroke="rgba(200,200,200,1)" fill="transparent" />
              <Area type="monotone" yAxisId="left" dataKey="Böhen" stackId="2" dot={false} stroke="rgba(200,200,200,0.5)" fill="rgba(200,200,200,0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {diagramTypes.includes('rain') && (
          <ResponsiveContainer width="100%" height={diagramHeight}>
            <AreaChart
              syncId="anyId"
              width={730}
              height={diagramHeight}
              data={sensorReadings.map((reading) => {
                const sensor = { ...reading, ...reading.parsed };
                return {
                  name: +sensor.date,
                  Regen: sensor.rainratein * 100,
                };
              })}
              {...controlProps}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
              <Legend verticalAlign="top" height={36} />
              <YAxis type="number" width={40} allowDecimals={true} for yAxisId="left" />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
                formatter={(value, name) => {
                  if (name === 'Regen') return value.toFixed(2) + ' mm';
                }}
                labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
              />
              <Area type="monotone" yAxisId="left" dataKey="Regen" stackId="1" dot={false} stroke={darkMode ? '#8888ff' : '#000088'} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {diagramTypes.includes('sun') && (
          <ResponsiveContainer width="100%" height={diagramHeight}>
            <AreaChart
              syncId="anyId"
              width={730}
              height={diagramHeight}
              data={sensorReadings.map((reading) => {
                const sensor = { ...reading, ...reading.parsed };
                return {
                  name: +sensor.date,
                  Sonnenschein: sensor.solarradiation,
                };
              })}
              {...controlProps}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
              <Legend verticalAlign="top" height={36} />
              <YAxis type="number" width={40} allowDecimals={false} for yAxisId="left" />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
                formatter={(value, name) => {
                  if (name === 'Sonnenschein') return value + ' Watt/m²';
                }}
                labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
              />
              <Area type="monotone" yAxisId="left" dataKey="Sonnenschein" stackId="3" dot={false} stroke="#ff8800" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {diagramTypes.includes('barom') && (
          <ResponsiveContainer width="100%" height={diagramHeight}>
            <LineChart
              syncId="anyId"
              width={730}
              height={diagramHeight}
              data={sensorReadings.map((reading) => {
                const sensor = { ...reading, ...reading.parsed };
                return {
                  name: +sensor.date,
                  'Luftdruck Absolut': sensor.baromabsin,
                  'Luftdruck Relativ': sensor.baromrelin,
                };
              })}
              {...controlProps}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
              <Legend verticalAlign="top" height={36} />
              <YAxis
                width={40}
                type="number"
                domain={[(dataMin) => Math.round(dataMin) - 2, (dataMax) => Math.round(dataMax) + 2]}
                for
                yAxisId="left"
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={darkMode ? { backgroundColor: theme.palette.background.paper } : undefined}
                formatter={(value, name) => {
                  return value + ' hPa';
                }}
                labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
              />
              <Line type="monotone" yAxisId="left" dataKey="Luftdruck Absolut" stroke="#55aa55" dot={false} />
              <Line type="monotone" yAxisId="left" dataKey="Luftdruck Relativ" stroke="#55aa00" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
      {loading && <LinearProgress />}
      <Box boxShadow="0px -3px 5px rgba(0,0,0,0.2)" display="flex" flexDirection="column">
        <Box display="flex" flexDirection="row" paddingY={2} justifyContent="space-between">
          <Button variant={diagramTypes.includes('temp') ? 'contained' : 'outlined'} onClick={handle('temp')}>
            Temperatur
          </Button>
          <Button variant={diagramTypes.includes('humidity') ? 'contained' : 'outlined'} onClick={handle('humidity')}>
            Feuchtigkeit
          </Button>
          <Button variant={diagramTypes.includes('wind') ? 'contained' : 'outlined'} onClick={handle('wind')}>
            Wind
          </Button>
          <Button variant={diagramTypes.includes('rain') ? 'contained' : 'outlined'} onClick={handle('rain')}>
            Regen
          </Button>
          <Button variant={diagramTypes.includes('sun') ? 'contained' : 'outlined'} onClick={handle('sun')}>
            Sonne
          </Button>
          <Button variant={diagramTypes.includes('barom') ? 'contained' : 'outlined'} onClick={handle('barom')}>
            Druck
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Button disabled={dateRange[0] >= +latest.date}>
            <ChevronLeft onClick={() => setDateRange(dateRange.map((d) => Math.min(latest.date, +dayjs(d).add(1, mode))))} />
          </Button>
          <Box>{dayjs(dateRange[0]).format('DD.MM.YYYY')}</Box>
          <FormControl>
            <InputLabel id="mode-label">Zeitraum</InputLabel>
            <Select variant="standard" labelId="mode-label" id="mode-select" value={mode} onChange={changeMode}>
              <MenuItem value={'hour'}>Stunde</MenuItem>
              <MenuItem value={'day'}>Tag</MenuItem>
              <MenuItem value={'week'}>Woche</MenuItem>
              <MenuItem value={'month'}>Monat</MenuItem>
              <MenuItem value={'year'}>Jahr</MenuItem>
            </Select>
          </FormControl>
          <Box>{dayjs(dateRange[1]).format('DD.MM.YYYY')}</Box>
          <Button>
            <ChevronRight onClick={() => setDateRange(dateRange.map((d) => +dayjs(d).subtract(1, mode)))} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default History;
