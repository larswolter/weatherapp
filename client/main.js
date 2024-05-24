import React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import { App } from '/imports/ui/App';
import Authenticator from '../imports/ui/Authenticator';

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
          <App />
        </Authenticator>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

const root = createRoot(document.getElementById('react-target')); // createRoot(container!) if you use TypeScript
root.render(<AppShell />);
