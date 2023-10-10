import React from 'react'
import { renderToString } from 'react-dom/server'
import { onPageLoad } from 'meteor/server-render'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/material/styles/ThemeProvider';

import createTheme from '@mui/material/styles/createTheme';

const theme = createTheme()

onPageLoad((sink) => {
  sink.renderIntoElementById(
    'react-target',
    renderToString(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Box textAlign="center">
            <CircularProgress />
            <Box>Lade Wetter App</Box>
          </Box>
        </Box>
      </ThemeProvider>
    )
  )
})
