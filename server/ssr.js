import React from 'react'
import { renderToString } from 'react-dom/server'
import { onPageLoad } from 'meteor/server-render'
import { CircularProgress, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'

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
