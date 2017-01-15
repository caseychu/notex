// Run `npm run compile` to recompile

const ReactDOM = require('react-dom');
const NotexReact = require('../notex-react.js');

window.render = function render(doc) {
	ReactDOM.render(NotexReact.render(doc), document.getElementById('main'));
	
	const h1 = document.querySelector('.h1 > .inline');
	document.title = h1 ? h1.innerText : 'Untitled';
}

const socket = new WebSocket('ws://' + location.host);
socket.onmessage = function (event) {
	render(JSON.parse(event.data));
};
