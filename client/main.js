import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import {
  createTheme,
  ThemeProvider,
  StyledEngineProvider,
  CssBaseline
} from '@mui/material';
import { App } from '/imports/ui/App';
import Authenticator from '../imports/ui/Authenticator';

const theme = createTheme();

render(<StyledEngineProvider injectFirst>
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Authenticator >
      <App />
    </Authenticator>
  </ThemeProvider>
</StyledEngineProvider>, document.getElementById('react-target'));
