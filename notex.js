const EOL = /\r\n|\r|\n|$/;

const notex = {};
notex.commands = [['', (head, children) => [head, children]]];
notex.inline = [];
notex.inlineVerbatim = [];

notex.parse = function (string) {
	let position = 0;

	// Returns truthy iff successfully consumed the pattern.
	function consume(pattern) {
		if (typeof pattern === 'string') {
			if (pattern === string.substr(position, pattern.length)) {
				position += pattern.length;
				return true;
			}
			return false;
		}
		
		else if (pattern instanceof RegExp) {
			// Simulate a sticky regex
			const match = (new RegExp('^(' + pattern.source + ')')).exec(string.substr(position));
			if (match) {
				position += match[0].length;
				return match.slice(1);
			}
			return false;
		}
		
		else
			throw new Error('invalid object to consume');
	}
	
	function consumeN(n) {
		const substring = string.substr(position, n);
		position += substring.length;
		return substring;
	}
	
	function consumeVerbatimUntil(until) {
		// Little microoptimization for strings, even though the else clause would work.
		if (typeof until === 'string') {			
			const verbatim = consumeN(string.indexOf(until, position) - position);
			if (!consume(until))
				throw new Error('something is wrong with the above calculation');
			return verbatim;
		} else {
			let string = '';
			while (!consume(until))
				string += consumeN(1);
			return string;
		}
	}
	
	function consumePatterns(patterns) {
		for (let [pattern, ...rest] of patterns) {
			const match = consume(pattern);
			if (match)
				return [match, pattern, ...rest];
		}
		return false;
	}
	
	function consumeBlocks(tabs=0) {
		const objects = [];
		while (position < string.length) {
			if (consume('\t'.repeat(tabs))) {
				const command = consumePatterns(notex.commands);
				if (!command)
					throw new Error('There\'s no fallback tag, a rule like /^/');
				
				const [match, pattern, fn] = command;
				const head = consumeInlineUntil(EOL);
				const children = consumeBlocks(tabs + 1);
				objects.push(fn({ head, children, match }));
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
		let currentTextNode = '';
		
		const objects = [];
		while (!consume(until)) {
			const consumedPattern = consumePatterns(notex.inline);
			if (consumedPattern) {
				if (currentTextNode) {
					objects.push(currentTextNode);
					currentTextNode = '';
				}
				
				if (consumedPattern.length === 4) {
					const [leftMatch, leftPattern, rightPattern, fn] = consumedPattern;
					objects.push(fn({ children: consumeInlineUntil(rightPattern), match: leftMatch }));
				} 
				
				else if (consumedPattern.length === 3) {
					const [match, pattern, fn] = consumedPattern;
					objects.push(fn({ match }));
				}
				
				continue;
			}
			
			// Just text.
			currentTextNode += consumeN(1);
		}

		if (currentTextNode) {
			objects.push(currentTextNode);
			currentTextNode = '';
		}
		
		return objects;
	}
	
	return consumeBlocks();
}

module.exports = notex;
