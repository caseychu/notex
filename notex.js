const EOL = '\n';

const notex = {};

notex.commands = {};
notex.createNode = (type, children) => `&lt;${ type }&gt;${ children }&lt;/${ type }&gt;`;

notex.parse = function (string) {
	let position = 0;

	function consume(substring) {
		const matched = string.substr(position, substring.length) === substring;
		if (matched)
			position += substring.length;
		return matched;
	}
	
	function consumeN(n) {
		const substring = string.substr(position, n);
		position += substring.length;
		return substring;
	}
	
	function consumeBlocks(tabs=0) {
		const objects = [];
		while (position < string.length) {
			if (consume('\t'.repeat(tabs))) {
				let createNode = null;
				let match = null;
				for (let command in notex.commands) {
					var re = new RegExp('^' + command);
					if (match = re.exec(string.substr(position))) {
						createNode = notex.commands[command];
						break;
					}
				}
				
				if (!match)
					throw new Error('No match at ' + position + ': "' + string.substr(position, 10) + '"');
				position += match[0].length;
				
				const header = consumeInlineUntil(EOL);
				const children = consumeBlocks(tabs + 1);
				objects.push(createNode(header, children, match[0]));
			}
			
			// A new line.
			//else if (consume('fewer than tabs \t + \n'))
			//	objects.push(null);
			
			else 
				break;
		}
		
		return objects;
	}
	
	function consumeInlineUntil(until) {
		const objects = [];
		while (!consume(until)) {
			// Reached end of string.
			if (position >= string.length) {
				if (until === EOL)
					break;
				else
					throw new SyntaxError('Unexpected end of file: expected character ' + until);
			}
		
			// Math.
			if (consume('$'))
				objects.push(notex.createNode('MATH', consumeVerbatimUntil('$')));
			
			// Bold.
			else if (consume('*'))
				objects.push(notex.createNode('BOLD', consumeInlineUntil('*')));
			
			// Other.
			else {
				if (typeof objects[objects.length - 1] === 'string')
					objects[objects.length - 1] += consumeN(1);
				else
					objects.push(consumeN(1));
			}
		}
		return objects.length && objects;
	}
	
	function consumeVerbatimUntil(until) {
		const verbatim = consumeN(string.indexOf(until, position) - position);
		consume(until);
		return verbatim;
	}
	
	return consumeBlocks();
}

module.exports = notex;
