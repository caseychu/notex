const React = require('react');
const katex = require('katex');
const smartquotes = require('smartquotes');

const NotexReact = {};

NotexReact.render = function (lines) {
	return <ul>{ lines.map(NotexReact.renderLine) }</ul>;
};

NotexReact.renderLine = function ({ tag, inline, sublines }) {
	switch (tag) {
		case null:
			return (
				<li>
					{ NotexReact.renderInline(inline) }
					{ NotexReact.render(sublines) }
				</li>
			);
		
		case 'h1':
			return (
				<li>
					<h1>{ NotexReact.renderInline(inline) }</h1>
					{ NotexReact.render(sublines) }
				</li>
			);
		case 'h2':
			return (
				<li>
					<h2>{ NotexReact.renderInline(inline) }</h2>
					{ NotexReact.render(sublines) }
				</li>
			);
		case 'h3':
			return (
				<li>
					<h3>{ NotexReact.renderInline(inline) }</h3>
					{ NotexReact.render(sublines) }
				</li>
			);
		
		case 'bullet':
			return (
				<li className="bullet-circle">
					{ NotexReact.renderInline(inline) }
					{ NotexReact.render(sublines) }
				</li>
			);

		default:
			return (
				<li>
					<span className="tag">\\{ tag }</span> { NotexReact.renderInline(inline) }
					{ NotexReact.render(sublines) }
				</li>
			);
	}
};

NotexReact.renderInline = function (nodes) {
	return nodes.map(node => typeof node === 'string' ? smartquotes.string(node) : NotexReact.renderInlineCommand(node));
};

NotexReact.renderInlineCommand = function ({ tag, text }) {
	switch (tag) {
		case 'html':
			return html;
	
		case 'math-block':
		case 'math-inline':
			let math;
			try {
				math = katex.renderToString(text, {
					macros: {'\\R': '\\mathbb{R}'},
					throwOnError: false,
					displayMode: tag === 'math-block'
				});
			} catch (e) {
				math = <tt className="math-error">{ e.message }</tt>;
			}
			
			if (tag === 'math-block')
				return <div className="math" dangerouslySetInnerHTML={{__html: math}} />;
			else if (tag === 'math-inline')
				return <span className="math" dangerouslySetInnerHTML={{__html: math}} />;
		
		case 'b':
			return <b>{ NotexReact.renderInline(text) }</b>;
	}
};

module.exports = NotexReact;