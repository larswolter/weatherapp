import React, { createContext, useContext, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

const token = window.location.search ? window.location.search.split('=')[1] : window.localStorage.getItem('token');

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const AuthContext = createContext();
export const useAuthContext = () => {
  return useContext(AuthContext);
};

const Authenticator = ({ children }) => {
  const [authError, setAutherror] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);
  const isConnected = useTracker(() => {
    return Meteor.status().connected;
  });
  const userId = useTracker(() => {
    return Meteor.connection.userId();
  });
  useEffect(() => {
    if (isConnected) {
      console.time('authenticated');
      Meteor.call('authenticate', token || 'dummy-token', (err, res) => {
        if (err) setAutherror(err.reason || err.message);
        else {
          window.localStorage.setItem('token', res);
          console.log('authenticated with ', res);
          Meteor.connection.setUserId('authenticated-'+new Date());
          setAuthenticated(true);
          console.timeEnd('authenticated');
        }
      });
    }
  }, [isConnected]);
  if (authError)
    return (
      <Alert severity="error">
        <AlertTitle>{authError}</AlertTitle>
      </Alert>
    );
  if (authenticated) return <AuthContext.Provider value={{ token, userId  }}>{children}</AuthContext.Provider>;
  return (
    <Box textAlign="center">
      <LinearProgress variant="indeterminate" />
      Authentifiziere
    </Box>
  );
};

export default Authenticator;
