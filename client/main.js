import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { createTheme, useMediaQuery, ThemeProvider, StyledEngineProvider, CssBaseline } from '@mui/material';
import { App } from '/imports/ui/App';
import Authenticator from '../imports/ui/Authenticator';

const AppShell = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

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

render(<AppShell />, document.getElementById('react-target'));
