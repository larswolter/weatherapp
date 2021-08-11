import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Alert, AlertTitle } from '@material-ui/lab';

const token = window.location.search ? window.location.search.split('=')[1] :
  window.localStorage.getItem('token');

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Authenticator = ({children}) => {
  const [authError, setAutherror] = useState(null);
  useEffect(() => {
    if (token) {
      Meteor.call('authenticate', token, (err, res) => {
        if (err) setAutherror(err.reason || err.message);
        else window.localStorage.setItem('token', res);
      });
    }
  });
  return authError ? <Alert severity="error"><AlertTitle>{authError}</AlertTitle></Alert>:children;
}

export default Authenticator;