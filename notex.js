const EOL = /\r\n|\r|\n/;

const notex = {};
notex.commands = [['', (head, children) => [head, children]]];
notex.inline = [];
notex.inlineVerbatim = [];

notex.parse = function (string) {
	let position = 0;

	function matchRegex(re) {
		// Simulate a sticky regex
		return (new RegExp('^(' + re.source + ')')).exec(string.substr(position));
	}

	function consumeRegex(re) {
		const match = matchRegex(re);
		if (match) {
			position += match[0].length;
			return match.slice(1);
		}
		return false;
	}
	
	function consumeLiteral(substring) {
		const matched = string.substr(position, substring.length) === substring;
		if (matched)
			position += substring.length;
		return matched;
	}

	// Returns truthy iff successfully consumed the pattern.
	function consume(pattern) {
		if (typeof pattern === 'string')
			return consumeLiteral(pattern)
		else if (pattern instanceof RegExp)
			return consumeRegex(pattern);
		else
			throw new Error('invalid object to consume');
	}
	
	function consumeN(n) {
		const substring = string.substr(position, n);
		position += substring.length;
		return substring;
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
					throw new Error('Couldn\'t parse tag');
				
				const [match, pattern, fn] = command;
				const header = consumeInlineUntil(EOL);
				const children = consumeBlocks(tabs + 1);
				objects.push(fn(header, children, match));
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
			// Reached end of string.
			if (position >= string.length) {
				if (until === EOL)
					break;
				else
					throw new SyntaxError('Unexpected end of file: expected character ' + until);
			}
		
			const verbatimPattern = consumePatterns(notex.inlineVerbatim);
			if (verbatimPattern) {
				if (currentTextNode) {
					objects.push(currentTextNode);
					currentTextNode = '';
				}
			
				const [leftMatch, leftPattern, rightPattern, fn] = verbatimPattern;
				objects.push(fn(consumeVerbatimUntil(rightPattern), leftMatch));
				continue;
			}
			
			const inlinePattern = consumePatterns(notex.inline);
			if (inlinePattern) {
				if (currentTextNode) {
					objects.push(currentTextNode);
					currentTextNode = '';
				}
					
				const [leftMatch, leftPattern, rightPattern, fn] = inlinePattern;
				objects.push(fn(consumeInlineUntil(rightPattern), leftMatch));
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
	
	return consumeBlocks();
}

module.exports = notex;
