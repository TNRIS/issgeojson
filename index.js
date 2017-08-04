var geojson = require('geojson');
var request = require('request');
var express = require('express');
var cors = require('cors');
var client = require('prom-client');

var ISS_API_URL = "http://api.wheretheiss.at/v1/satellites/25544";

var collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({timeout: 5000});

const requestCounter = new client.Counter({name: 'total_requests', help: 'Total Requests'});
const successCounter = new client.Counter({name: 'successful_responses', help: 'Successful Responses'});
const errorCounter = new client.Counter({name: 'error_responses', help: 'Error Responses'});

var app = express();
app.use(cors());

app.set('port', (process.env.PORT || 5000));

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

app.get('/', function (req, res) {
  request(ISS_API_URL, function (err, resp, body) {
    requestCounter.inc();
    if (err) {
      console.log(err);
      res.status(400).json({error: 'Unable to contact ISS API'});
      errorCounter.inc();
      return;
    }

    var issStatus = JSON.parse(body);
    var issGj = geojson.parse([issStatus], {Point: ['latitude', 'longitude']});

    res.json(issGj);
    successCounter.inc();

  });
});

app.get('/metrics', function (req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
});

app.listen(app.get('port'), function () {
  console.log("App listening on port " + app.get('port'));
});