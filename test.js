var sy = require("./");
var assert = require("assert");

(function() {

	var num =  ".555";
	var rnum = sy.readNumber(num, 0);
	assert(rnum[0] == .555 && rnum[1] == 4);
})();


(function() {
	
	var num = "15 * 20 + 100";
	var rnum = sy.readNumber(num, 5);
	assert(rnum[0] == 20 && rnum[1] == 7);
})();


(function() {
	var error = sy.readNumber(".3.42.34.2", 0);
	assert(typeof error == "string");
})();


(function() {
	var str1 = "55 + 100";
	var str1_token = sy.readToken(str1, 0);
	assert(str1_token[0].value == 55 && str1_token[1] == 2);
})();


(function() {
	var str = "  55";
	var tok = sy.readToken(str);
	assert(tok[0].value == 55);
	assert(tok[0].type == "number");
	assert(tok[1] == 4);
})();

(function() {

	var tokens = sy.readTokens("55+100*(2+2)");
	var correct = ["number",
	"operator",
	"number",
	"operator",
	"paren",
	"number",
	"operator",
	"number",
	"paren"];

	for(var i = 0; i < correct.length; i++)
		assert(correct[i] == tokens[i].type);
})();


(function() {

	var tokens = sy.readTokens("2+2*3");
	var result = sy.shuntingYard(tokens);
	var correct = [2, 2, 3, "*", "+"];

	for(var i = 0; i < correct.length; i++) {
		assert(correct[i] == result[i].value);
	}
	var r = sy.evaluatePostfix(result);
	assert(r == 8);
})();


(function() {

	var str = "5*5+(2/2)";
	var result = sy.compute(str);
	assert(result == 26);
})();


(function() {

	var str = "50/(10*2)";
	var tokens = sy.readTokens(str);
	var shunted = sy.shuntingYard(tokens);
	var result = sy.evaluatePostfix(shunted);
	assert(result == 2.5);
})();


(function() {

	var str = "100*100*(1/100)";
	var result = sy.compute(str);
	assert(result == 100);
})();

(function() {

	var str = "100 % 3   + 1";
	assert(sy.compute(str) == 2);
})();

