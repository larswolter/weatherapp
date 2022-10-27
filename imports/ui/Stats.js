import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings } from '../api/sensorData';
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, ReferenceArea, Area, AreaChart } from 'recharts';
import { Button, FormControl, InputLabel, LinearProgress, MenuItem, Select, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import StatsDiagram from './StatsDiagram';

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

const Stats = ({ latest }) => {
  const [sources, setSources] = useState(['temp']);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState('hour');
  const [offset, setOffset] = useState(0);
  const [refAreaLeft, setRefAreaLeft] = useState();
  const [refAreaRight, setRefAreaRight] = useState();

  const handle = (type) => {
    return (evt) => {
      if (sources.includes(type)) setSources(sources.filter((t) => t !== type));
      else setSources([...sources, type]);
    };
  };

  const diagramHeight = (window.innerHeight - 210) / sources.length;

  return (
    <Box display="flex" height="100%" flexDirection="column" justifyContent="space-between">
      <Box overflow="auto" padding={2}>
        {sources.map((source) => (
          <StatsDiagram key={source} source={source} scale={scale} offset={offset} diagramHeight={diagramHeight} />
        ))}
      </Box>
      {loading && <LinearProgress />}
      <Box boxShadow="0px -3px 5px rgba(0,0,0,0.2)" display="flex" flexDirection="column">
        <Box display="flex" flexDirection="row" paddingY={2} justifyContent="space-between">
          <Button variant={sources.includes('temp') ? 'contained' : 'outlined'} onClick={handle('temp')}>
            Temperatur
          </Button>
          <Button variant={sources.includes('humidity') ? 'contained' : 'outlined'} onClick={handle('humidity')}>
            Feuchtigkeit
          </Button>
          <Button variant={sources.includes('wind') ? 'contained' : 'outlined'} onClick={handle('wind')}>
            Wind
          </Button>
          <Button variant={sources.includes('rain') ? 'contained' : 'outlined'} onClick={handle('rain')}>
            Regen
          </Button>
          <Button variant={sources.includes('sun') ? 'contained' : 'outlined'} onClick={handle('sun')}>
            Sonne
          </Button>
          <Button variant={sources.includes('barom') ? 'contained' : 'outlined'} onClick={handle('barom')}>
            Druck
          </Button>
          <Button variant={sources.includes('solar') ? 'contained' : 'outlined'} onClick={handle('solar')}>
            Solar
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Button>
            <ChevronLeft onClick={() => setOffset((cur) => cur + 1)} />
          </Button>
          <FormControl>
            <InputLabel id="mode-label">Zeitraum</InputLabel>
            <Select
              variant="standard"
              labelId="mode-label"
              id="mode-select"
              value={scale}
              onChange={(evt) => {
                setScale(evt.target.value);
                setOffset(0);
              }}
            >
              <MenuItem value={'hour'}>Stunde</MenuItem>
              <MenuItem value={'day'}>Tag</MenuItem>
              <MenuItem value={'week'}>Woche</MenuItem>
              <MenuItem value={'month'}>Monat</MenuItem>
              <MenuItem value={'year'}>Jahr</MenuItem>
            </Select>
          </FormControl>
          <Button>
            <ChevronRight disabled={offset === 0} onClick={() => setOffset((cur) => Math.max(0, cur - 1))} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Stats;
