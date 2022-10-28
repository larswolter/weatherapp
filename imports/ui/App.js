import React, { useEffect, useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, LinearProgress } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/ShowChart';
import Dashboard from './Dashboard';
import Stats from './Stats';

Meteor.subscribe('latestData', {});

export const App = () => {
  const [view, setView] = useState('Dashboard');

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
        {view === 'Dashboard' ? <Dashboard /> : <Stats />}
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
