import localForage from 'localforage';
import { Meteor } from 'meteor/meteor';
import { Reload } from 'meteor/reload';
import { Workbox, messageSW } from 'workbox-window';

if ('serviceWorker' in navigator) {
  console.log('service-worker: service worker available',Meteor.absoluteUrl('sw.js'));
  if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.disableGMServiceWorker) {
    // if we disable service worker, force unregistration of them
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  } else {
    const wb = new Workbox('/sw.js');
    let retry;
    wb.addEventListener('statechange', (evt) => {
      console.log('service-worker: Active state:' + evt.target.state);
    });
    wb.addEventListener('waiting', (event) => {
      console.log('service-worker: Waiting service worker found');
      if (event.sw) {
        console.log('service-worker: sending command to skip');
        messageSW(event.sw, { type: 'SKIP_WAITING' });
      }
    });
    wb.addEventListener('externalwaiting', (event) => {
      console.log('service-worker: External Waiting service worker found');
      if (event.sw) {
        console.log('service-worker: sending command to skip');
        messageSW(event.sw, { type: 'SKIP_WAITING' });
      }
    });
    let canMigrate = false;
    wb.addEventListener('controlling', (event) => {
      console.log('service-worker: is controlling, retrying migration');
      canMigrate = true;
      if (retry) retry();
      else window.location.reload();
    });
    wb.addEventListener('externalactivated', (event) => {
      console.log('service-worker: is external activated, retrying migration');
      canMigrate = true;
      if (retry) retry();
      else window.location.reload();
    });
    Reload._onMigrate((r) => {
      if (canMigrate) return [canMigrate];
      console.log('service-worker: force updating service worker...');
      wb.update();
      retry = r;
      return false;
    });
    wb.register();
    console.log('service-worker: registered service worker');
  }
} else {
  console.log('service-worker: service worker not available');
}
