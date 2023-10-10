import React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import createTheme from '@mui/material/styles/createTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import { App } from '/imports/ui/App';
import Authenticator from '../imports/ui/Authenticator';
import './service-worker';

const AppShell = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  console.log({prefersDarkMode});
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  );
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Authenticator>
          <App />
        </Authenticator>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

const root = createRoot(document.getElementById('react-target')); // createRoot(container!) if you use TypeScript
root.render(<AppShell />, );
