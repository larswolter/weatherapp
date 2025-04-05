import React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { App } from '/imports/ui/App';
import Authenticator from '../imports/ui/Authenticator';
import '../imports/common/methods';

const AppShell = () => {
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
  });
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Authenticator>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <App />
          </LocalizationProvider>
        </Authenticator>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

const root = createRoot(document.getElementById('react-target')); // createRoot(container!) if you use TypeScript
root.render(<AppShell />);
