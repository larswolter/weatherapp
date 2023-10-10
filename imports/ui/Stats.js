import React, { useState } from 'react';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box  from '@mui/material/Box';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import StatsDiagram from './StatsDiagram';

const Stats = ({ yearOffset }) => {
  const [sources, setSources] = useState(['temp']);
  const [scale, setScale] = useState('hour');
  const [offset, setOffset] = useState(0);

  const xs = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const handle = (type) => {
    return (evt) => {
      if (sources.includes(type)) setSources(sources.filter((t) => t !== type));
      else setSources([...sources, type]);
    };
  };

  const diagramHeight = (window.innerHeight - 210) / sources.length;

  return (
    <Box display="flex" height="100%" flexDirection="column" justifyContent="space-between">
      <Box padding={{ xs: 0, sm: 2 }} overflow="hidden">
        {sources.map((source, idx) => (
          <StatsDiagram idx={idx} key={source} source={source} scale={scale} offset={offset} yearOffset={yearOffset||0} diagramHeight={diagramHeight} />
        ))}
      </Box>
      <Box boxShadow="0px -3px 5px rgba(0,0,0,0.2)" display="flex" flexDirection="column">
        <Box display="flex" flexWrap="wrap" flexDirection="row" paddingY={2} justifyContent="space-between">
          <Button variant={sources.includes('temp') ? 'contained' : 'outlined'} onClick={handle('temp')}>
            {xs ? <img src="/icons/thermometer.svg" alt="Temperatur" /> : 'Temperatur'}
          </Button>
          <Button variant={sources.includes('humidity') ? 'contained' : 'outlined'} onClick={handle('humidity')}>
            {xs ? <img src="/icons/humidity.svg" alt="Feuchtigkeit" /> : 'Feuchtigkeit'}
          </Button>
          <Button variant={sources.includes('wind') ? 'contained' : 'outlined'} onClick={handle('wind')}>
            {xs ? <img src="/icons/wind-beaufort-0.svg" alt="Wind" /> : 'Wind'}
          </Button>
          <Button variant={sources.includes('rain') ? 'contained' : 'outlined'} onClick={handle('rain')}>
            {xs ? <img src="/icons/rain.svg" alt="Regen" /> : 'Regen'}
          </Button>
          <Button variant={sources.includes('sun') ? 'contained' : 'outlined'} onClick={handle('sun')}>
            {xs ? <img src="/icons/clear-day.svg" alt="Sonnenscheinr" /> : 'Sonne'}
          </Button>
          <Button variant={sources.includes('barom') ? 'contained' : 'outlined'} onClick={handle('barom')}>
            {xs ? 'hPA' : 'Druck'}
          </Button>
          <Button variant={sources.includes('solar') ? 'contained' : 'outlined'} onClick={handle('solar')}>
            {xs ? 'kwH' : 'Solar'}
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Button onClick={() => setOffset((cur) => cur + 1)}>
            <ChevronLeft />
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
          <Button disabled={offset === 0} onClick={() => setOffset((cur) => Math.max(0, cur - 1))}>
            <ChevronRight />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Stats;
