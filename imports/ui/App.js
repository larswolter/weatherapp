import React, { lazy, useState, Suspense } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/ShowChart';
import CompareIcon from '@mui/icons-material/StackedLineChart';
import LinearProgress from '@mui/material/LinearProgress';
import { useMediaQuery } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Export from './Export';

const Stats = lazy(() => import('./Stats'));
const Dashboard = lazy(() => import('./Dashboard'));

export const App = () => {
  const [view, setView] = useState('Dashboard');
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
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
        <Suspense fallback={<LinearProgress variant="indeterminate" />}>
          {view === 'Dashboard' ? <Dashboard /> : null}
          {view === 'Historie' ? <Stats /> : null}
          {view === 'Vergleich' ? <Stats yearOffset={1} /> : null}
          {view === 'Export' ? <Export /> : null}
        </Suspense>
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
        <BottomNavigationAction value="Vergleich" label="Vergleich" icon={<CompareIcon />} />
        {isDesktop ? <BottomNavigationAction value="Export" label="Export" icon={<FileDownloadIcon />} /> : null}
      </BottomNavigation>
    </Box>
  );
};
