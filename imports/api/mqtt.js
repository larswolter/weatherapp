import mqtt from 'mqtt';
import { SolarReadings } from './sensorData';

export const setupMQTT = async ({ username, password, topic, mqttUrl }) => {
  try {
    console.log(`MQTT connecting to ${mqttUrl} as ${username}...`);
    const client = mqtt.connect(mqttUrl, { username, password });
    const dataPacket = {};
    client.on('connect', () => {
      console.log(`MQTT connected, subscribing to ${topic}...`);
      client.subscribe(topic, (err) => {
        if (err) {
          console.log(`MQTT ERROR subscribing ${topic}`, err);
        } else {
          console.log(`MQTT subscribed to ${topic}`);
        }
      });
    });
    client.on('error', (err) => {
      console.log(`MQTT client error`, err);
    });
    client.on('disconnect', () => {
      console.log(`MQTT disconnect`);
    });
    client.on('close', () => {
      console.log(`MQTT close`);
    });
    client.on('end', () => {
      console.log(`MQTT end`);
    });

    client.on('message', (msgTopic, message) => {
      if (msgTopic.endsWith('/last_success')) {
        // save the current accumulated data shortly after last_success
        setTimeout(async () => {
          if(!dataPacket.ch1?.MaxPower && !dataPacket.ch2?.MaxPower) {
            console.log('MQTT no valid power data', dataPacket);
            return;
          }
          const parsed = {
            last_success: Number(dataPacket.last_success),
            strings: [
              { power: Number(dataPacket.ch1.MaxPower), energy_daily: Number(dataPacket.ch1.YieldDay), energy_total: Number(dataPacket.ch1.YieldTotal)*1000 },
              { power: Number(dataPacket.ch2.MaxPower), energy_daily: Number(dataPacket.ch2.YieldDay), energy_total: Number(dataPacket.ch2.YieldTotal)*1000 },
            ],
          };
          dataPacket.ch0 &&
            Object.keys(dataPacket.ch0)
              .sort()
              .forEach((key) => {
                parsed[key] = Number(dataPacket.ch0[key]);
              });
          const exists = await SolarReadings.findOneAsync({ 'parsed.last_success': parsed.last_success });
          if (exists) {
            console.log('MQTT ignoring existing entry');
            return;
          }
          delete dataPacket.ch0;
          delete dataPacket.ch1;
          delete dataPacket.ch2;
          await SolarReadings.insertAsync({ date: new Date(), parsed, raw: JSON.stringify(dataPacket) });
        }, 500);
      }
      const topicParts = msgTopic.split('/');
      const prop = topicParts.pop();
      const channel = topicParts.pop();
      if (channel.match(/^ch[0-9]+$/)) {
        if (!dataPacket[channel]) dataPacket[channel] = {};
        dataPacket[channel][prop] = message.toString();
      } else {
        dataPacket[prop] = message.toString();
      }
    });
  } catch (err) {
    console.log(`MQTT Error connecting to ${mqttUrl}:`, err);
  }
};
