import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Alert, AlertTitle } from '@mui/material';
import { Box, LinearProgress } from '@mui/material';

const token = window.location.search ? window.location.search.split('=')[1] :
  window.localStorage.getItem('token');

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Authenticator = ({ children }) => {
  const [authError, setAutherror] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);
  useEffect(() => {
    Meteor.call('authenticate', token || 'dummy-token', (err, res) => {
      if (err) setAutherror(err.reason || err.message);
      else {
        window.localStorage.setItem('token', res);
        console.log('authenticated with ',res);
        setAuthenticated(true);
      }
    });
  });
  if(authError) return <Alert severity="error"><AlertTitle>{authError}</AlertTitle></Alert>;
  if(authenticated) return  children;
  return <Box textAlign="center" >
  <LinearProgress variant="indeterminate" />
    Authentifiziere
  </Box> 
}

export default Authenticator;