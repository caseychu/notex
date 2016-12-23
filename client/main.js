const ReactDOM = require('react-dom');
const NotexReact = require('../notex-react.js');

const socket = new WebSocket('ws://' + location.host);
socket.onmessage = function (event) {
	ReactDOM.render(NotexReact.render(JSON.parse(event.data)), document.body);
};