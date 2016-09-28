const http = require('http');
const fs = require('fs');
const open = require('open');
const ws = require('ws');

const notex = require('./notex.js');

const file = process.argv[2];
const server = http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-type': 'text/html' });
	res.end(notex.parse(fs.readFileSync(file).toString('utf8')));
});

const wss = new ws.Server({ server });
fs.watch(file, function () {
	wss.clients.forEach(function (client) {
		client.send('reload');
	});
});

server.listen(0, function () {
	open('http://localhost:' + this.address().port);
});