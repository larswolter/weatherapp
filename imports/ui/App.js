import React, { useEffect, useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, LinearProgress, makeStyles } from '@material-ui/core';
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
  const [latest, setLatest] = useState();
  useEffect(() => {
    Meteor.call('latestSensorData', (err,res) => {
      console.log(err, res);
      res && setLatest(res);
    });
  }, []);
  console.log(latest)
  const classes = useStyles();
  if (!latest) return <Box textAlign="center" >
    <LinearProgress variant="indeterminate" />
    Lade Wetterdaten
  </Box>

  return <Box className={classes.root}>
    <Box className={classes.content}>
      {view === 'Dashboard' ? <Dashboard latest={latest} /> : (latest && <History latest={latest} />)}
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
