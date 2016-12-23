const http = require('http');
const fs = require('fs');
const open = require('open');
const retry = require('retry');
const url = require('url');
const ws = require('ws');
const ReactDOMServer = require('react-dom/server');

const Notex = require('./notex.js');
const NotexReact = require('./notex-react.js');

const file = process.argv[2];
const server = http.createServer(function (req, res) {
	
	switch (url.parse(req.url).pathname) {
		case '/':
			read().then(function (contents) {
				res.writeHead(200, { 'Content-type': 'text/html' });
				res.end(renderHTML(contents));
			});
			return;
		
		case '/script.js':
			fs.readFile('./client/script.js', function (err, contents) {
				res.writeHead(200, { 'Content-type': 'text/javascript' });
				res.end(contents.toString('utf8'));
			});
			return;
		case '/style.css':
			fs.readFile('./client/style.css', function (err, contents) {
				res.writeHead(200, { 'Content-type': 'text/css' });
				res.end(contents.toString('utf8'));
			});
			return;
		
		default:
			res.writeHead(404);
			res.end('Not found');
			return;
	}
});

const wss = new ws.Server({ server });
fs.watch(file, function () {
	read().then(function (contents) {
		wss.clients.forEach(function (client) {
			client.send(JSON.stringify(Notex.parse(contents)));
		});
	});
});

server.listen(0, function () {
	open('http://localhost:' + server.address().port);
});

// Time out.
setInterval(function () {
	if (wss.clients.length === 0)
		process.exit();
}, 10000);

function read() {
	return new Promise(function (resolve, reject) {
		
		// Retry because readFile can fail if the file is being saved to
		const op = retry.operation();
		op.attempt(function () {
			fs.readFile(file, function (err, contents) {
				if (op.retry(err))
					return;
				resolve(contents.toString('utf8'));
			});
		}, { minTimeout: 50 });
	});
}

function renderHTML(contents) {
	const parsed = Notex.parse(contents);
	return preamble + ReactDOMServer.renderToString(NotexReact.render(parsed)) + postscript;
}

const preamble = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
	<title></title>
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
	<link rel="stylesheet" type="text/css" href="style.css" />
	</head>
	<body>`;
	
const postscript = `
		<script src="script.js"></script>
		<script src="http://smartquotesjs.com/src/smartquotes.min.js"></script>
	</body>
</html>`;