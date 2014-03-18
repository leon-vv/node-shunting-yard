var assert = require("assert");

// If you come here to read the source code, jump down to main!

// All available operators.
var opr = {
	"+": new Operator("+", 1, 2),
	"-": new Operator("-", 1, 2),
	"*": new Operator("*", 2, 2),
	"/": new Operator("/", 2, 2),
	"%": new Operator("%", 2, 2),
};

function Operator(operator, precedence, noa) {

	this.operator = operator;
	
	this.precedence = precedence;
	
	// Number of arguments.
	this.noa = noa;
} 

Operator.prototype.smallerPrecedence = function(otherOperator) {

	return this.precedence < otherOperator.precedence;
};

function Token(type, value, index, end) {

	// Either operator or number.
	this.type = type;
	assert(type == "operator" || type == "number", "Illegal type value");

	this.value = value;
	assert(value || value == 0, "Value is falsy: " + value);
	
	// Where in the input does the token start?
	this.begin = index;
	assert(!isNaN(index), "\"index\" Is not a number.");
	
	// Where does the token end?
	this.end = end;
}


// The previous token is needed for correctly detecting unary operators.
Token.read = function(input, index, previousToken) {

	assert(typeof input == "string", "\"input\" should be a string.");
	assert(!isNaN(index), "\"index\" should be a number.");
	
	var stack = [];
	var isNumber = false;
	
	for(var i = index; i < input.length; i++){
	
		var s = input[i];

		var op = opr[s];
	
		if(s == " ") {
		
			// White space is only allowed at the beginning,
			// thus when the stack is still empty.
			if(stack.length == 0) {
			
				index += 1;
				continue;
			}
			else break;
		}
		else if(!isNaN(s)) {
		
			// It's a number.
			stack.push(s);
			isNumber = true;
		}
		else if(op) {
		
			var pto = (previousToken.type == "operator");
			var slz = (stack.length == 0);	
	
			if(slz && !pto) {
			
				stack.push(s);
				i += 1;
				break;
			}
			else if(slz && pto) {
			
				// Unary + and unary -.
				if(op.operator == "+" || op.operator == "-") {
				
					isNumber = true;
					stack.push(s);
				}
				else throw "Error: double operator at position: " + i;
			}
			else if(!slz) break;
		}				
		else if(s == "(") {
		
			// The stack can only be filled if an number is in it.
			// Operators always break the loop instantly.
			if(stack.length > 0) throw "Error: parentheses preceded by a non-operator.";

			// Parentheses should just be returned as an array of tokens. 
			// Watch out: a lot of recursion going on here.
			// Basically what we do is:
			// 	- Cut out everything between the parentheses.
			//	- Use the Token.readRecursive function to read it out.
			//	- Return the array of tokens.	
			
			return Token.readRecursive(input, i + 1);	
		}
		else if(s == ")") break;	
		else throw "Illegal character at position: " + i;

	}
	// console.log(isNumber, stack, index, i, input);
		
	// A new token should be made from the stack.
	if(isNumber) return new Token("number", Number(stack.join("")), index, i);
	// Mark end of stream.
	else if(stack.length == 0) return false;
	else return new Token("operator", stack[0], index, i);
};

Token.readRecursive = function(input, index) {

	// This function should start reading "input" beginning at "index",
	// returning an array of tokens.
		
	var tokens = [];
	tokens.end = index || 0;
	// We give the starting token a type of "operator" because if a - or + is detected,
	// it should be handled as a unary + or an unary -.
	var token = {type: "operator"};

	while(token = Token.read(input, tokens.end, token)) {
	
		// Be aware: token can also be an array, if parentheses are detected.
		// Little big hacky, but the end property should always point to the last elemnt + 1.
		tokens.end = token.end;

		tokens.push(token);
	}
	
	tokens.end += 1;
	
	return tokens;
};

var shuntingYard = function(tokens) {

	// Now that the tokens are read, let the fun begin!
	// Search "Shunting Yard Wikipedia" for a good explanation of this algorithm!	
		
	var output = [];
	var operatorStack = [];

	for(var i = 0; i < tokens.length; i++) {
	
		var token = tokens[i];
		
		// Arrays are handled as numbers, but their content is first put in rpn
		if(token instanceof Array) output.push(shuntingYard(token)); 		
		else if(token.type == "number") output.push(token);
		else if(token.type == "operator") {

			var opl = operatorStack.length;
			var operator = opr[token.value];	
			
			for(var j = opl - 1; j > -1; j--) {
			
				var co = opr[operatorStack[j].value];

				if(!co.smallerPrecedence(operator)) {
				
					output.push(operatorStack.pop());
				}
				else break;
			}
			
			operatorStack.push(token);
		}
		else throw "Error: shunting yard called with unknown token at position: " + i;
	}	
	// Copy the remaining opr to the output.
	Array.prototype.push.apply(output, operatorStack);
	
	output.read = function(){return evaluate(this)};

	return output;
};

// Operator actions.
var opa = {
	"+": function(a, b) {return a + b},
	"-": function(a, b) {return a - b},
	"*": function(a, b) {return a * b},
	"/": function(a, b) {return a / b},
	"%": function(a, b) {return a % b}
}; 

var evaluate =  function(tokens) {

	var stack = [];

	for(var i = 0; i < tokens.length; i++) {
		
		var token = tokens[i];
		var type = token.type;
		var value = token.value;
		
		if(type == "number") stack.push(value);
		else if(type == "operator") {
		
			if(stack.length < 2) throw "Error, only " + stack.length + " arguments supplied for operator: " + value;
			else {
			
				var b = stack.pop();
				var a = stack.pop();
				
				stack.push(opa[value](a, b));
			}
		}
		else if(token instanceof Array) stack.push(evaluate(token));
	}
		
	return stack[0];
}



module.exports = function(input) {return shuntingYard(Token.readRecursive(input))};



