const http = require('http');
const fs = require('fs');
const open = require('open');
const path = require('path');
const retry = require('retry');
const url = require('url');
const ws = require('ws');
const ReactDOMServer = require('react-dom/server');

const Notex = require('./notex.js');
const NotexReact = require('./notex-react.js');

const file = process.argv[2];
const server = http.createServer(function (req, res) {
	const pathname = url.parse(req.url).pathname;
	
	if (pathname === '/') {
		read().then(function (contents) {
			res.writeHead(200, { 'Content-type': 'text/html' });
			res.end(renderHTML(contents));
		});
		return;
	}
	
	if (pathname.indexOf('/client/') === 0) {
		serveStatic('./client', pathname.substr('/client/'.length), req, res);
		return;
	}
	
	if (pathname.indexOf('/katex/') === 0) {
		serveStatic(path.join(path.dirname(require.resolve('katex')), 'dist'), pathname.substr('/katex/'.length), req, res);
		return;
	}
	
	res.writeHead(404);
	res.end('Not found');
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

const mimeTypes = {
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.eot': 'application/vnd.ms-fontobject',
	'.ttf': 'application/x-font-ttf',
	'.woff': 'application/font-woff',
	'.woff2': 'font/woff2'
};

function serveStatic(root, pathname, req, res) {
	root = path.resolve(root);
	const filename = path.resolve(path.join(root, pathname));
	
	if (filename.indexOf(root) !== 0) {	
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}
	
	const stream = fs.createReadStream(filename);
	stream.once('error', function () {
		res.writeHead(404);
		res.end('Not found');
	});
	stream.once('readable', function () {
		res.writeHead(200, { 'Content-type': mimeTypes[path.extname(filename)] });
		stream.pipe(res);
	});
}

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
	<link rel="stylesheet" type="text/css" href="/katex/katex.min.css" />
	<link rel="stylesheet" type="text/css" href="/client/style.css" />
	</head>
	<body>`;
	
const postscript = `
		<script src="/client/script.js"></script>
	</body>
</html>`;