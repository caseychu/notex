const EOL = '\n';

function notex(string) {
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
				const header = consumeInlineUntil(EOL);
				const children = consumeBlocks(tabs + 1);
				
				if (header.length === 1) // Todo: check that this is a TAG instead
					objects.push([header[0][0], header[0][1], children]);
				else
					objects.push(['PARAGRAPH', header, children]);
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
				objects.push(['MATH', consumeVerbatimUntil('$')]);
			
			else if (consume('\\['))
				objects.push(['MATH_DISPLAY', consumeVerbatimUntil('\\]')]);
			
			// Bold.
			else if (consume('*'))
				objects.push(['BOLD', consumeInlineUntil('*')]);
			
			// Tags.
			else if (consume('\\def ')) {
				objects.push(['DEF', consumeInlineUntil(until)]);
				break;
			}
			else if (consume('\\thm ')) {
				objects.push(['THM', consumeInlineUntil(until)]);
				break;
			}
			else if (consume('\\pred ')) {
				objects.push(['PRED', consumeInlineUntil(until)]);
				break;
			}
			else if (consume('\\iff ')) {
				objects.push(['IFF', consumeInlineUntil(until)]);
				break;
			}
			
			// Other.
			else {
				if (objects[objects.length - 1] && objects[objects.length - 1][0] === 'TEXT')
					objects[objects.length - 1][1] += consumeN(1);
				else
					objects.push(['TEXT', consumeN(1)]);
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
