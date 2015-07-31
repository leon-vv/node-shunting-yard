
var assert = require("assert");

// All available operators.
// Maps to precedence
var opr = {
	"+": 1,
	"-": 1,
	"#": 1,
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
var readToken = function(str, index, expectNum) {

	var index = index || 0;
	if(expectNum == undefined) {
		expectNum = true;
	}

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
			if(expectNum) {
				if(c == "+") {
					continue;
				}
				else if(c == "-") {
					returnToken = new Token('#', 'operator');
					i += 1;
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
	var expectNum = true;

	while(index < str.length) {
		var rt = readToken(str, index, expectNum);
		if(typeof rt == "string") return rt;
		tokens.push(rt[0]);
		index = rt[1];
		expectNum = rt[0].type == "operator" || rt[0].type == "paren";
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
		
			while(stack.length
					&& stack[0].type == "operator"
					&& opr[t.value] <= opr[stack[0].value]) {
					output.unshift(stack.shift());
			}
			stack.unshift(t);
		}
		else if(t.value == "(") stack.unshift(t);
		else if(t.value == ")") {
			
			var found = false;
			while(stack.length) {
				var current = stack.shift();
				if(current.value == "(") {
					if(stack.length && stack[0].type == "operator")
						output.unshift(stack.shift());
					
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
	"%": function(a, b) {return a % b},
	"#": function(a) { return -a}
}; 

var evaluatePostfix = function(tokens) {
	var stack = [];
	
	while(tokens.length) {
		var t = tokens.shift();

		if(t.type == "number") stack.unshift(t);
		else if(t.type == "operator") {
			var fun = opfun[t.value];

			// fun.length returns the amount of argument a function accepts
			if(stack.length < fun.length) return "Invalid postfix expression.";

			// splice alters the original array
			var args = stack.splice(0, fun.length).map(function(v){return v.value;});

			// reverse is needed because I use the stack upside down
			// the top of the stack is the first element of the array
			stack.unshift(new Token(fun.apply(null, args.reverse()), "number"));
		}
	}
	
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
