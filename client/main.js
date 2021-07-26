import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@material-ui/core';
import { App } from '/imports/ui/App';
import Authenticator from '../imports/ui/Authenticator';

const theme = createTheme({});

Meteor.startup(() => {
  render(<ThemeProvider theme={theme}>
    <CssBaseline />
    <Authenticator />
    <App />
  </ThemeProvider>, document.getElementById('react-target'));
});
