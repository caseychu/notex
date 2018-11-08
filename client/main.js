// Run `npm run compile` to recompile

const ReactDOM = require('react-dom');
const NotexDocument = require('../notex-react.js');

window.render = function (doc) {
	// If we're already at the bottom, scroll to the bottom after rerendering.
	// Possibly non-cross-browser!
	var atBottom = window.scrollY && window.scrollY + document.documentElement.clientHeight === document.documentElement.scrollHeight;

	console.log('received doc of length ' + doc.length);
	ReactDOM.render(NotexDocument(doc), document.getElementById('main'), function () {
		if (atBottom) {
			console.log('scrolling to the bottom');
			window.scrollTo(0, document.documentElement.scrollHeight);
		}
	});
	
	const h1 = document.querySelector('.h1 > .inline');
	document.title = h1 ? h1.innerText : 'Untitled';
}

const socket = new WebSocket('ws://' + location.host);
socket.onmessage = function (event) {
	render(JSON.parse(event.data));
};

window.onload = function () {
	if (window.location.search.indexOf('autoprint') !== -1) {
		// Close the window after printing.
		if (window.matchMedia)
			window.matchMedia('print').addListener(function (media) {
				if (!media.matches)
					window.close();
			});
			
		window.print();
	}
};