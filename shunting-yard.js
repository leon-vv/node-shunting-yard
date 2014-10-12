
var assert = require("assert");

// All available operators.
// Maps to precedence
var opr = {
	"+": 1,
	"-": 1,
	"*": 2,
	"/": 2,
	"%": 2,
};

var Token = function(value, type) {
	this.value = value;
	this.type = type;
	assert(type == "number" ||
		type == "operator" ||
		type == "paren", "Invalid token");
}

// returns [number, index]
var readNumber = function(str, index) {

	var points_amount = 0;
	var stack = [];
	var i = index;

	for(; i < str.length; i++) {
		var c = str[i];
		if(!isNaN(parseInt(c)) || c == ".") {
			stack.push(c);
		}
		else break;
	}

	var num = Number(stack.join(""));

	if(isNaN(num)) {
		// The points are messed up
		return "Number cannot contain more than one point";
	}

	return [num, i];
}

// prev=true when the previous token was an operator
// helps by detecting unary + and -
// returns [token, index]
var readToken = function(str, index, prev) {

	var index = index || 0;
	var prev = prev || false;

	var returnToken;
	var stack = [];

	for(var i = index; i < str.length; i++) {

		var c = str[i];

		if(c == " ") continue;
		else if(c == "(" || c == ")") {
			returnToken = new Token(c, "paren");
			i += 1;
		}
		else if(c == "." || !isNaN(parseInt(c))) {
			var rn = readNumber(str, i);
			if(typeof rn == "string") return rn;
			return [new Token(rn[0], "number"), rn[1]];
		}
		else if(opr[c]) {
			// If previous token was an operator
			// this opr need to be unary + or -
			// and this token therefore should be a number
			if(prev) {
				if(c == "+") {
					continue;
				}
				else if(c == "-") {
					returnToken = readToken(str, i + 1, true);
					returnToken.value *= -1;
				}
				else return "Illegal second operator at " + i;
			}
			else {
				returnToken = new Token(c, "operator");
				i += 1;	
			}
		}
		else {
			return "Illegal character at " + i;
		}
		
		return [returnToken, i];
	}
}

var readTokens = function(str) {

	var tokens = [];
	var index = 0;
	var lastIsOp = false;

	while(index < str.length) {
		var rt = readToken(str, index, lastIsOp);
		if(typeof rt == "string") return rt;
		tokens.push(rt[0]);
		index = rt[1];
		lastIsOp = rt[0].type == "operator";
	}

	return tokens;
}

var shuntingYard = function(tokens) {

	var output = [];
	var stack = [];

	for(var i = 0; i < tokens.length; i++) {
		var t = tokens[i];
		if(t.type == "number") output.unshift(t);
		else if(t.type == "operator") {
		
			while(stack.length && stack[0].type == "operator") {
				if(opr[t.value] <= opr[stack[0].value])
					output.unshift(stack.shift());
				else break;
			}
			stack.unshift(t);
		}
		else if(t.value == "(") stack.unshift(t);
		else if(t.value == ")") {

			var found = false;
			while(stack.length) {
				var current = stack.shift();
				if(current.value == "(") {
					found = true;
					break;
				}
				else output.unshift(current);
			}
			if(!found) return "Mismatched parentheses.";
		}
		else {
			return "Unknown token type: " + t.type;
		}
	}
	while(stack.length) {
		if(stack[0].type == "paren") return "Mismatched parentheses.";
		output.unshift(stack.shift());
	}

	return output.reverse();
}

// Operator actions.
var opfun = {
	"+": function(a, b) {return a + b},
	"-": function(a, b) {return a - b},
	"*": function(a, b) {return a * b},
	"/": function(a, b) {return a / b},
	"%": function(a, b) {return a % b}
}; 

var evaluatePostfix = function(tokens) {
	var stack = [];
	
	while(tokens.length) {
		var t = tokens.shift();

		if(t.type == "number") stack.unshift(t);
		else if(t.type == "operator") {
			// Number of arguments is hardcoded
			if(stack.length < 2) return "Invalid postfix expression.";
			
			var a = stack.shift().value;
			var b = stack.shift().value;
			stack.unshift(new Token(opfun[t.value](b, a), "number"));
		}
	}
	
	if(stack.length > 1) return "To many numbers supplied.";
	return stack[0].value;	
}

module.exports = {
	readNumber : readNumber,
	readToken : readToken,
	readTokens : readTokens,
	shuntingYard : shuntingYard,
	evaluatePostfix : evaluatePostfix,
	compute : function(str) {
		var tokens = readTokens(str);
		if(typeof tokens == "string") return tokens;
		var shunted = shuntingYard(tokens);
		if(typeof shunted == "string") return shunted;
		var result = evaluatePostfix(shunted);
		if(typeof result == "string") return result;
		return result
	}
};
