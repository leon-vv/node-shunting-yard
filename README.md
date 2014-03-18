Usage
------------------

```
npm install shunting-yard
```

```JavaScript
var sy = require("shunting-yard");

// Multidimensional array of numbers and operators
var rpn = sy("-5+(3*3)");

// 4
var result = rpn.read();

```

Please note that this module has not yet been thoroughly tested,
please report any issues.

License
-------------------
MIT
