# Weatherapp

A small Meteor WebApp that receives Ecowitt Data and displays it using a Dashboard and Charts

Very early stage of development

## Data submission

The data needs to be posted to `https://hostname/weatherinput` using the ecowitt format.

## Authentication

Because there ist no sensitive data stored, only a simple authentication mechanism has been implemented.

Two tokens can be defined using environment Variables:

`ACCESS_TOKEN` to get access to the Web interface, by submitting any url param with the token as value. The token is then stored in localStorage to stay authenticated without keeping the token in the URL.

`SUBMIT_TOKEN` to authorize the sender of the weatherdata. It needs to be appended to the weatherinput request in the param token: `https://hostname/weatherinput?token=secret`

