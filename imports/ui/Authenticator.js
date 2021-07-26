import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Alert, AlertTitle } from '@material-ui/lab';

const token = window.location.search ? window.location.search.split('=')[1] :
  window.localStorage.getItem('token');

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Authenticator = () => {
  const [authError, setAutherror] = useState(null);
  useEffect(() => {
    if (token) {
      Meteor.call('authenticate', token, (err, res) => {
        if (err) setAutherror(err.reason || err.message);
        else window.localStorage.setItem('token', res);
      });
    }
  });
  return authError ? <Alert color="error"><AlertTitle>{authError}</AlertTitle></Alert>:null;
}

export default Authenticator;