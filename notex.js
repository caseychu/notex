const peg = require('pegjs');
const fs = require('fs');

const parser = peg.generate(fs.readFileSync('notex.pegjs').toString('utf8'));
const Notex = {};

Notex.parse = function (string) {
	// Add indents and dedents, since PEG.js doesn't parse indents easily
	const lines = string.split(/\r\n|\r|\n/g);
	let indentation = 0;
	const annotated = lines.map(function (line) {
		if (/^\s*$/.test(line))
			return '';
		return line.replace(/^\t*/, function (tabs) {
			const difference = tabs.length - indentation;
			indentation = tabs.length;
			return difference >= 0 ? '\\indent'.repeat(difference) : '\\dedent'.repeat(-difference);
		});
	}).join('\n') + '\n' + '\\dedent'.repeat(indentation);

	return parser.parse(annotated);
};

module.exports = Notex;
