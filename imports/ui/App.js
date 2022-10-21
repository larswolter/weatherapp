import React, { useEffect, useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, LinearProgress } from '@mui/material';
import { useTracker } from 'meteor/react-meteor-data';
import { SensorReadings, SolarReadings } from '../api/sensorData';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/ShowChart';
import Dashboard from './Dashboard';
import History from './History';
import Stats from './Stats';

export const App = () => {
  const [view, setView] = useState('Dashboard');

  useEffect(() => {
    const sub = Meteor.subscribe('sensorReadings', {});
    const sub2 = Meteor.subscribe('solarReadings', {});
    return () => {
      sub.stop();
      sub2.stop();
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

  console.log('Latest data', latest);
  if (!latest)
    return (
      <Box textAlign="center">
        <LinearProgress variant="indeterminate" />
        Lade Wetterdaten
      </Box>
    );
  if (!latest.date)
    return (
      <Box textAlign="center">        
        Keine Wetterdaten verfügbar
      </Box>
    );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        alignContent: 'stretch',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <Box flexBasis="100%" overflow="hidden">
        {view === 'Dashboard' ? <Dashboard latest={latest} /> : latest && <Stats latest={latest} />}
      </Box>
      <BottomNavigation
        value={view}
        onChange={(event, newValue) => {
          setView(newValue);
        }}
        showLabels
      >
        <BottomNavigationAction value="Dashboard" label="Dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction value="Historie" label="Historie" icon={<HistoryIcon />} />
      </BottomNavigation>
    </Box>
  );
};
