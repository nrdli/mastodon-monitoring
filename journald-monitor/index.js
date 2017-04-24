const { Tail } = require('tail');
const { createServer } = require('http');

const { Counters } = require('./Counters');

const {
  EXPORTER_LINE_MATCH = 'systemd-mastodon-web.sh',
  EXPORTER_LOGFILE_PATH = '/var/log/syslog',
  NAMESPACE = 'mastodon_web',
  WEB_LISTEN_PORT = '9000',
  WEB_LISTEN_ADDRESS = 'localhost',
} = process.env;

const tail = new Tail(EXPORTER_LOGFILE_PATH, {
  follow: true,
  fromBeginning: false,
});

const uuidRegex = /\[[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\] /

const counters = new Counters();

tail.on("line", function(line) {
  if (!line.indexOf(EXPORTER_LINE_MATCH) === -1) {
    return;
  }

  const chunks = line.split(uuidRegex);

  if (chunks.length !== 2) {
    return;
  }

  const stats = chunks[1]
    .split(' ').map((stat) => stat.split('='))
    .reduce((o, [k, v]) => Object.assign(o, {[k]: v}), {});

  const keyPrefix = `${stats.controller}_${stats.action}`;

  let responseBucket;

  if (stats.status < 400) {
    responseBucket = 'success';
  } else if (stats.status < 500) {
    responseBucket = 'client_error';
  } else {
    responseBucket = 'server_error';
  }

  counters.increment(`${NAMESPACE}_count`);
  counters.increment(`${NAMESPACE}_${responseBucket}_count`);
  counters.increment(`${NAMESPACE}_${stats.status}_count`);
  counters.increment(`${NAMESPACE}_${keyPrefix}_count`);
  counters.increment(`${NAMESPACE}_${keyPrefix}_${responseBucket}_count`);
  counters.increment(`${NAMESPACE}_${keyPrefix}_${stats.status}_count`);
  counters.add(`${NAMESPACE}_duration`, parseFloat(stats.duration));
  counters.add(`${NAMESPACE}_${keyPrefix}_duration`, parseFloat(stats.duration));
  counters.add(`${NAMESPACE}_view_duration`, parseFloat(stats.view));
  counters.add(`${NAMESPACE}_${keyPrefix}_view_duration`, parseFloat(stats.view));
  counters.add(`${NAMESPACE}_db_duration`, parseFloat(stats.db));
  counters.add(`${NAMESPACE}_${keyPrefix}_db_duration`, parseFloat(stats.db));
});

tail.on("error", function(error) {
  console.log('ERROR: ', error);
});

const server = createServer((req, res) => {
  counters.toPrometheus((line) => res.write(line), () => res.end());
});

server.listen(WEB_LISTEN_PORT, WEB_LISTEN_ADDRESS);
