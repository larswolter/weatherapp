import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, makeStyles } from '@material-ui/core';
import DashboardIcon from '@material-ui/icons/Dashboard';
import HistoryIcon from '@material-ui/icons/ShowChart';
import Dashboard from './Dashboard';
import History from './History';

const useStyles = makeStyles(theme => {
  return {
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      alignContent: 'stretch',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    content: {
      padding: theme.spacing(),
      overflow: 'auto',
      flexBasis: '100%'
    }
  }
});

export const App = () => {
  const [view, setView] = useState('Dashboard');
  const classes = useStyles();
  return <Box className={classes.root}>
    <Box className={classes.content}>
      {view === 'Dashboard' ? <Dashboard /> : <History />}
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
  </Box>;
};
