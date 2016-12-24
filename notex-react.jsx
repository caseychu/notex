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
			try {
				return (
					<span className={tag} dangerouslySetInnerHTML={{
						__html: katex.renderToString(text, {
							macros: {'\\R': '\\mathbb{R}'},
							throwOnError: false,
							displayMode: tag === 'math-block',
							errorColor: '#C80000'
						})
					}} />);
			} catch (e) {
				return <span className={tag} style={{color: '#C80000'}}>{ e.message }</span>;
			}
		
		case 'b':
			return <b>{ NotexReact.renderInline(text) }</b>;
		case 'i':
			return <i>{ NotexReact.renderInline(text) }</i>;
	}
};

module.exports = NotexReact;