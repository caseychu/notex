const ReactDOM = require('react-dom');
const NotexReact = require('../notex-react.js');

const socket = new WebSocket('ws://' + location.host);
socket.onmessage = function (event) {
	ReactDOM.render(NotexReact.render(JSON.parse(event.data)), document.body);
	window.onload();
};

window.onload = function () {
	const h1 = document.querySelector('.h1 > .inline');
	document.title = h1 ? h1.innerText : 'Untitled';
};
