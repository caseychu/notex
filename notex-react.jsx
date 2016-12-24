const React = require('react');
const katex = require('katex');
const smartquotes = require('smartquotes');

const NotexReact = {};

NotexReact.render = function (lines) {
	return lines.length ? <ul>{ lines.map(NotexReact.renderLine) }</ul> : null;
};

NotexReact.renderLine = function ({ tag, inline, sublines }) {
	switch (tag) {
		case null:
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'bullet':
			return (
				<li className={tag}>
					<div className="inline">{ NotexReact.renderInline(inline) }</div>
					{ NotexReact.render(sublines) }
				</li>
			);

		default:
			return (
				<li>
					<div className="inline"><span className="tag">\{ tag }</span> { NotexReact.renderInline(inline) }</div>
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