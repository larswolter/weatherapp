import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@material-ui/core';
import { App } from '/imports/ui/App';

const theme = createTheme({});

Meteor.startup(() => {
  render(<ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>, document.getElementById('react-target'));
});
