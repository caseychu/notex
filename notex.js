const notex = {};

const tokens = notex.tokens = {
	EOL: /\r\n|\r|\n/,
	TEXT: Symbol('TEXT'),
	VERBATIM: Symbol('VERBATIM')
};

// A default set of commands.
notex.commands = [
	{
		tag: true,
		pattern: /(\\\w+)?/,
		render: ([_, tag], contents, children) => [tag || null, contents, children]
	}
];

notex.parse = function (string) {
	const tagCommands = [];
	const inlineCommands = [];
	for (let command of notex.commands) {
		if (!Array.isArray(command.pattern))
			command.pattern = [command.pattern || ''];
		(command.tag ? tagCommands : inlineCommands).push(command);
	}
	const rawTextEscape = text => text;
	
	function cloneableGenerator(generatorFunction, ...args) {
		const generator = generatorFunction(...args);
		const oldNext = generator.next;
		const calledValues = [];
		generator.next = function (value) {
			calledValues.push(value);
			return oldNext.apply(this, arguments);
		};
		generator.cloner = function () {
			const length = calledValues.length;
			return function () {
				const generator = cloneableGenerator(generatorFunction, ...args);
				for (let i = 0; i < length; i++)
					generator.next(calledValues[i]);
				return generator;
			};
		};
		return generator;
	}
	
	function* matchGen(position, iter, nextValue) {
		const result = iter.next(nextValue);
		if (result.done) {
			yield [position, result.value];
			return;
		}
	
		let clone;
		let matched = false;
		for (let [nextPosition, nextCaptures] of match(position, result.value)) {
			
			// Reset the iterator if necessary.
			if (!clone)
				clone = iter.cloner();
			else
				iter = clone();
			
			matched = true;
			yield* matchGen(nextPosition, iter, nextCaptures);
		}
	}
	
	function patternToString(pattern) {
		// This is a list of possibilities.
		if (Array.isArray(pattern))
			return '[ ' + pattern.map(patternToString).join(', ') + ' ]';
		
		// A generator.
		else if (typeof pattern === 'function')
			return pattern.name;
			
		else
			return pattern.toString();
	}

	function* match(position, pattern) {
		//console.warn(`Matching at position ${position}, pattern ${patternToString(pattern)}`)
		
		// This is a list of possibilities.
		if (Array.isArray(pattern)) {
			if (pattern.length) {
				for (let subpattern of pattern)
					yield* match(position, subpattern); 
			}
		}
		
		// A generator.
		else if (typeof pattern === 'function') {
			yield* matchGen(position, cloneableGenerator(pattern));
			
			// Will adding a return here trigger tail-call optimization?
			// Apparently not -- http://stackoverflow.com/questions/30135916/does-es6-tail-call-optimization-cover-generators
		}
		
		else if ([tokens.VERBATIM].includes(pattern)) {
			let i = 0;
			do {
				yield [position + i, string.substr(position, i)];
			} while ((position + i) <= string.length && !['\r', '\n', '\r\n'].includes(string[position + (i++)]));
		}
		
		else if (typeof pattern === 'string') {
			if (pattern === string.substr(position, pattern.length))
				yield [position + pattern.length, pattern];
		}
		
		else if (pattern instanceof RegExp) {
			// Simulate a sticky regex starting from the given position
			const re = new RegExp('^(?:' + pattern.source + ')');
			const substr = string.substr(position);
			const result = re.exec(substr);
			
			if (result)
				yield [position + result[0].length, result.length > 1 ? result : result[0]]
		}
		
		else
			throw new Error('Invalid pattern: ' + pattern);
	}
	
	function createGenBlock(tabs=0) {
		// block_n -> line_n block_n | e
		return function* genBlock() {
			return yield [
				function* genBlock1() {
					return [
						yield createGenLine(tabs),
						...yield createGenBlock(tabs)
					];
				},
				function* genBlock2() {
					yield '';
					return [];
				}
			];
		};
	}
	
	function createGenLine(tabs=0) {
		// line_n -> TAB^n tagCommand text EOL block_{n+1} | TAB* EOL
		return function* genLine() {
			return yield [
				function* genLine1() {
					yield '\t'.repeat(tabs);
					return yield tagCommands.map(command => function* genTagCommand() {
						const captures = [];
						for (let pattern of command.pattern)
							captures.push(yield pattern);
						
						const contents = yield genText;
						yield tokens.EOL;
						const children = yield createGenBlock(tabs + 1);
						return command.render(...captures, contents, children);
					});
				},
				
				function* genLine2() {
					yield (/\t*/);
					yield tokens.EOL;
					return [];
				}
			];
		};
	}
	
	// text -> rawText inlineCommand text | rawText
	function* genText() {
		return yield [
			function* genText1() {
				return [
					rawTextEscape(yield genRawText),
					yield inlineCommands.map(command => function* genInlineCommand() {
						const captures = []
						for (let pattern of command.pattern) {
							if (pattern === tokens.TEXT)
								captures.push(yield genText);
							else
								captures.push(yield pattern);
						}
						return command.render(...captures);
					}),
					...yield genText
				];
			},
			
			function* genText2() {
				return [rawTextEscape(yield genRawText)];
			}
		];
	}
	
	// rawText -> e | [^\r\n] rawText
	function* genRawText() {
		return yield [
			'',
			function* genRawText1() {
				return [
					yield /[^\r\n]/,
					...yield genRawText
				].join('');
			}
		];
	}
	
	// START -> block_0 EOF
	function* genStart() {
		const parsed = yield createGenBlock(0);
		yield /$/;
		return parsed;
	}
	
	string += '\n';
	for (let [position, block] of match(0, genStart))
		return block;
};

module.exports = notex;
