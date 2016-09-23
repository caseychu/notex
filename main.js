const fs = require('fs');
//const notex = require('./notex.js');

const katex = require('katex');
const peg = require('pegjs');
/*
const tokens = notex.tokens;
notex.commands = [
	{
		tag: true,
		pattern: [/#{1,6}/, tokens.OPTIONAL_SPACE],
		render: ([type], _, contents, children) => `
			<h${ type.length }>${ contents.join('') }</h${ type.length }>
			${ children.join('') }`
	},
		
	{
		tag: true,
		pattern: [/(?:(-)|\\(iff|if|then))/, tokens.SPACE],
		render: ([type], _, contents, children) => `
			<div class="bullet">
				(${ type }) ${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},

	{
		tag: true,
		pattern: [/\\(\w+)/, tokens.SPACE],
		render: ([_, type], __, contents, children) => `
			<div class="paragraph">
				<b>${ type }:</b> ${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},

	{
		tag: true,
		render: (_, contents, children) => `
			<div class="paragraph">
				${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},

	{	
		pattern: ['$', tokens.VERBATIM, '$'], 
		render: (_, math) => `<tt style="color: red">${ math }</tt>`
		render: (_, math) => `
			<span class="math">
				${ katex.renderToString(math, { throwOnError: false }) }
			</span>`
		
	},

	{
		pattern: ['\\[', tokens.VERBATIM, '\\]'],
		render: (_, math) => `<div><tt style="color: red">${ math }</tt></div>`
		render: (_, math) => `
			<div class="math">
				${ katex.renderToString(math, { throwOnError: false, displayMode: true }) }
			</div>`
	},
	
	{
		pattern: ['**', tokens.TEXT, '**'],
		render: (_, contents)  => `<strong>${ contents.join('') }</strong>`
	},
	
	{
		pattern: ['*', tokens.TEXT, '*'],
		render: (_, contents) => `<em>${ contents.join('') }</em>`
	},
	
	{
		pattern: ['[', tokens.TEXT, '](', tokens.VERBATIM, ')'],
		render: (_, contents, __, url) => `<a href="${url}">${ contents.join('') }</a>`
	}
];
*/

// Add indents and dedents
const lines = fs.readFileSync(process.argv[2]).toString('utf8').split(/\r\n|\r|\n/g);
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



const parser = peg.generate(fs.readFileSync('notex.pegjs').toString('utf8'));
const tree = parser.parse(annotated);
console.log(`
	<meta charset="utf-8" />
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
	<link rel="stylesheet" type="text/css" href="style.css" />
`)
if (typeof tree === 'string')
	console.log(tree)/*
else if (Array.isArray(tree))
	console.log(tree.join(''))*/
else
	console.log(JSON.stringify(tree, null, 2));