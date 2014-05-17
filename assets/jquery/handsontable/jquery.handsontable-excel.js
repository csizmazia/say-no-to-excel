
/**
	Extension to jquery.handsontable to implement formula evaluation
	as well as dynamic types depending on the value you input.

	To get the translation, add the following code to your 'cell' function:


    cells: function (row, col, prop) {
      var cellProperties = {};
      cellProperties.type = 'excel';
      return cellProperties;
    },

 */

var Token = Formula = {};

;(function ( $, window ) {


Token = function (t,c) {
  var _d = { "type": null, t: t, c: c };
};

Token.parse = function () {
  var c;

  if (self._d.type != null)
    return self._d;		// Already parsed
  if (typeof self._d.t === 'undefined' || self._d.t == null || self._d.t == '')
    return self._d = { "type": '', token: null, next: null };
  if (typeof self._d.t == 'string') {
    c = self._d.t[0].toUpperCase();
    if (c == "'")
      return self._d = { "type": 'text', token: self._d.t.substring(1), next: self._d.c };
    if (c == '=')
      return self._d = { "type": 'formula', token: self._d.t.substring(1), next: self._d.c };
    if (c == '(' || c == ')')
      return self._d = { "type": 'paranthes', token: c, next: self._d.t.substring(1) };
  }
  else if (typeof self._d.t == 'number' && typeof self._d.c == 'number') {
    return self._d = { "type": 'coord', row: self._d.t, col: self._d.c };
  }
};

Token.get = function () {
  if (self._d.type != null)
    return self._d;
  else
    return self.parse();
}

Token.set = function(t,c) {
  self._d = { "type": null, t: t, c: c };
}

Token.error = function () {
  if (self._d.type == 'error')
    return self._d;
  if (self._d.type == null && typeof self._d.t == 'string')
    return self._d = { "type": 'error', error: self._d.t };
  return self._d = { "type": 'error', error: 'Bad error' };
}


Token.boolean = function () {
  if (self._d.type == 'boolean')
    return self._d;
  if (self._d.type == null && typeof self._d.t == 'number')
    return self._d = { "type": 'boolean', token: !!self._d.t, next: self._d.c };
  if (self._d.type == null && typeof self._d.t == 'string' &&
      self._d.t.length > 0 && self._d.t[0] >= '0' && self._d.t[0] <= '9')
    return self._d = { "type": 'boolean', token: !!(self._d.t * 1.0), next: self._d.c };
  return self._d = { "type": 'boolean', token: null, next: self._d.c };
}


Token.number = function () {
  if (self._d.type == 'number')
    return self._d;
  if (self._d.type == null && typeof self._d.t == 'number')
    return self._d = { "type": 'number', token: !!self._d.t, next: self._d.c };
  if (self._d.type == null && typeof self._d.t == 'string' && self._d.t.length > 0 &&
      (self._d.t[0] == '-' || (self._d.t[0] >= '0' && self._d.t[0] <= '9')))
    return self._d = { "type": 'number', token: !!(self._d.t * 1.0), next: self._d.c };
  return self._d = { "type": 'number', token: null, next: self._d.c };
}

Formula = function (formula) {
  this.formula = formula;

  return this;
};

Formula.prototype.tokenize = function () {
  var nextToken = function (formulaString) {  // split the textstring into tokens one at a time
    var result = { "type": 'empty', "token": null, "next": null};
    var i;
    var c;
    var l;

    if (formulaString == null || formulaString == '') {
      return result;
    }
    while (formulaString.length > 0 && formulaString[0] == ' ') {
      formulaString = formulaString.substring(1);
    }
    if (formulaString == null || formulaString == '') {
      return result;
    }
    
    l = formulaString.length;
    c = formulaString[0].toUpperCase();
    if (c == '-' || c == '+' || c == '*' || c == '/') {
      result = { "type": "operator", token: c, next: formulaString.substring(1) };
    }
    else if (c == '(' || c == ')') {
      result = { "type": "paranthes", token: c, next: formulaString.substring(1) };
    }
    else if (c == ':') {
      result = { "type": "range", token: c, next: formulaString.substring(1) };
    }
    // XXX stefanc
    //else if (c == ';' || c == ',' ) {
    else if (c == ';' ) {
      result = { "type": "param", token: c, next: formulaString.substring(1) };
    }
    // XXX stefanc
    // else if ((c >= '0' && c <= '9') || c == '.') {
    else if ((c >= '0' && c <= '9' && Handsontable.helper.isNumeric(c)) || c == '.' || c == ',') {
      var val = 0.0;
      var part = 0.0;
      var state = 0;
      var div = 1.0;
      // XXX stefanc
      // for (i = 0; i < formulaString.length && ((formulaString[i] >= '0' && formulaString[i] <= '9') || formulaString[i] == '.'); i++) {
      for (i = 0; i < formulaString.length && ((formulaString[i] >= '0' && formulaString[i] <= '9' && Handsontable.helper.isNumeric(formulaString[i])) || formulaString[i] == '.' || formulaString[i] == ','); i++) {
        c = formulaString[i];
        // XXX stefanc
        // if (state == 0 && c == '.') {
        if (state == 0 && (c == '.' || c == ','))  {
          state = 1;
        }
        else if (state == 0) {
          val = val * 10 + formulaString.charCodeAt(i) - "0".charCodeAt(0);
        }
        // XXX stefanc
        // else if (state == 0 && c == '.') {
        else if (state == 0 && (c == '.' || c == ',')) {
          return { "type": 'error', error: i18n.t("table.formula.error.bad-number"), next: null };
        }
        else if (state == 1) {
          div /= 10.0;
          part = part + (formulaString.charCodeAt(i) - "0".charCodeAt(0)) * div;
        }
      }

      result = { "type": "number", token: val + part, next: formulaString.substring(i) };
    }
    else if (c == '$' || (c >= 'A' && c <= 'Z')) {  // See if it is a cell reference
      var ref = '';
      for (i = 0; i < formulaString.length && (formulaString[i] == '$' || (formulaString[i] >= '0' && formulaString[i] <= '9') || (formulaString[i].toUpperCase() >= 'A' && formulaString[i].toUpperCase() <= 'Z')); i++) {
        c = formulaString[i].toUpperCase();
        ref = ref + c;
      }
      if (i < formulaString.length && formulaString[i] == '(') {
        ref = ref.toLowerCase();  // Reformat the function names to lower case!!!!!
        result.type = 'func';
      }
      else {
        result.type = 'cell';
      }
      result.token = ref;   // NOTE: Keep the upper case for cell references!!!!!
      result.next = formulaString.substring(i);
    }
    else if (c == '=' || c == '<' || c == '>') {  // See if it is a relation that produces a boolean
      var c2 = null;

      if (l == 1) {
        result = { "type": "relation", token: c, next: formulaString.substring(1) };
      }
      else {
        c2 = formulaString[1];
        if (c2 == '=' || c2 == '<' || c2 == '>') {
          result = { "type": "relation", token: c+c2, next: formulaString.substring(2) };
        }
        else {
          result = { "type": "relation", token: c, next: formulaString.substring(1) };
        }
      }
    }
    else if (c == '"') {
      var str = ''
      var i;
      for (i = 1; i < formulaString.length && formulaString[i] != '"'; i++) {
        c = formulaString[i];
        if (c == '\\') {
          i++;
          c = formulaString[i];
        }
        str = str + c;
      }
      if (i == formulaString.length || formulaString[i] != '"') {
        return { "type": 'error', error: i18n.t("table.formula.error.unbalanced-string"), next: null };
      }
      result = { "type": "text", token: str, next: formulaString.substring(i+1) };
    }
    else { // Error or unknown token
      result.type = 'error';
      result.error = i18n.t("table.formula.error.bad-token") +": " + c;
    }

    return result;
  };

  var theToken = {};
  var tokens = [];

  theToken = nextToken(this.formula);
  while (theToken.type != 'error' && theToken.next != '' && theToken.next != null) {
    tokens.push(theToken);
    theToken = nextToken(theToken.next);
  }
  if (theToken.type == 'error') {
    tokens = [];
  }
  tokens.push(theToken);

  return tokens;
};

Formula.prototype.cellReferenceToCoordinates = function (cellRef) {
  var row = 0;
  var col = 0;
  var radix = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;
  var moff = "A".charCodeAt(0);

  var res = { "type": "coord", "colAbsolute": false, "rowAbsolute": false };
  var referenceError = { "type": 'error', error: i18n.t("table.formula.error.bad-reference"), next: null };
  var state = 0;
  var dollars = 0;

  for (ii = 0; ii < cellRef.length; ii++) {
    var c = cellRef[ii];
    if (c == '$') {
      dollars++;
      if(state == 0) {
        res.colAbsolute = true;
      }
      else if(state == 1) {
        res.rowAbsolute = true;
      }
      continue;
    }
    if (state < 2 && c >= 'A' && c <= 'Z') {
      state = 1;
      col +=  (c.charCodeAt(0) - moff + 1) * Math.pow(26, ii-dollars);
    }
    else if (state >= 1 && state <= 2 && c >= '0' && c <= '9') {
      state = 2;
      row = row * 10 + c.charCodeAt(0) - "0".charCodeAt(0);
    }
    else {
      return referenceError;
    }
  }
  if(state < 2 || row-1 < 0 || col-1 < 0) {
    return referenceError;
  }
    
  res.row = row-1;
  res.col = col-1;
  return res;
};

Formula.prototype.coordinatesToCellReference = function (cellCoordinates) {
  return { "type": "cell", "token": (cellCoordinates.colAbsolute?"$":"")+Handsontable.helper.spreadsheetColumnLabel(cellCoordinates.col)+(cellCoordinates.rowAbsolute?"$":"")+(cellCoordinates.row+1), "next": null };
};




  //
  // Take the formula as a string
  // and make an array of tokens
  // Take the array of tokens and evaluate it
  // Return the result of that evaluation
  var evaluateFormula = function (instance, activeCells, formula) {

/*
var evalFormula = function (instance, formula) {
  var instance = instance;
  var orgformula;
  var tokens = [];
}
*/




  //
  // Give us a the coordinated from a string reference.
  // The coordinates are 0-based!!!
  // A1 gives the row=0 (from the '1') and col=0 (from the 'A')
  //
  var getRC = function (cellRef) {

    var row = 0;
    var col = 0;
    var radix = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;
    var moff = "A".charCodeAt(0);

    var res = { "type": "coord", "colAbsolute": false, "rowAbsolute": false };
    var referenceError = { "type": 'error', error: i18n.t("table.formula.error.bad-reference"), next: null };
    var circularError = { "type": 'error', error: i18n.t("table.formula.error.circular-reference"), next: null };
    var state = 0;
    var dollars = 0;

    for (ii = 0; ii < cellRef.length; ii++) {
      var c = cellRef[ii];
      if (c == '$') {
        dollars++;
        if(state == 0) {
          res.colAbsolute = true;
        }
        else if(state == 1) {
          res.rowAbsolute = true;
        }
        continue;
      }
      if (state < 2 && c >= 'A' && c <= 'Z') {
        state = 1;
        //col = col * radix + c.charCodeAt(0) - moff;
        col +=  (c.charCodeAt(0) - moff + 1) * Math.pow(26, ii-dollars);
      }
      else if (state >= 1 && state <= 2 && c >= '0' && c <= '9') {
        state = 2;
        row = row * 10 + c.charCodeAt(0) - "0".charCodeAt(0);
      }
      else {
        return referenceError;
      }
    }

    if(state < 2 || row-1 < 0 || col-1 < 0 || row-1 > instance.countRows()-1 || col-1 > instance.countCols()-1) {
      return referenceError;
    }
    for(var ii = 0; ii < activeCells.length; ii++) {
      if(row-1 === activeCells[ii].row && col-1 === activeCells[ii].col) {
        return circularError;
      }
    }
    
    res.row = row-1;
    res.col = col-1;
    return res;
  };




  //
  // Get the value from row and col variables
  // Row and col is 0-based
  //
  var getData = function (row, col) {
    var c;
    var val;
    var res = { "type": "", token: null, next: null };

    try {
      val = instance.getData()[row][col];
    }
    catch(err) {
      return { "type": 'error', error: i18n.t("table.formula.error.bad-reference"), next: null };
    }
    if (val == null || val == '')
      return res;
    
    if (typeof val === 'number')
        val = val.toString();
    
    c = val[0];
    if (c == "'") {
      res.type = 'text';
      res.token = val.substring(1) + '';
      return res;
    }
    if (c == "=") {
      activeCells.push({"row": row, "col": col})
      return evaluateFormula(instance, activeCells, val.substring(1));
    }
    // xxx stefanc
    //if (c == '-' || c == '+' || c == '.'|| c == ',' || (c >= '0' && c <= '9')) {  // Numeric constant
    if (c == '-' || c == '+' || c == '.'|| c == ',' || Handsontable.helper.isNumeric(val)) {	// Numeric constant
      res.type = 'number';
      res.token = (val * 1.0);
      return res;
    }
    // Else, we treat it as text anyway
    res.type = 'text';
    res.token = val + '';
    return res;
  };



  //
  // Get the value of a cell, referenced by a string as A1 or ABD3092
  // Returns a token with the result, or an error if we cannot comply
  //
  var getCell = function (cellRef) {
    var thiserr;
    var coord = getRC(cellRef);

    if (coord.type == 'error') {
      thiserr = coord.error != null && coord.error != '' ? coord.error : i18n.t("table.formula.error.bad-reference");
      return { "type": 'error', error: thiserr, next: null };
    }
    return getData(coord.row, coord.col);
  };




  //
  // Take the partial formula in the string
  // and give us the next token from it
  // swallowing the charcters of that token
  // in the process
  //
  var nextToken = function (formulaString) {	// split the textstring into tokens one at a time
    var result = { "type": 'empty', "token": null, "next": null};
    var i;
    var c;
    var l;

    if (formulaString == null || formulaString == '') {
      return result;
    }
    while (formulaString.length > 0 && formulaString[0] == ' ') {
      formulaString = formulaString.substring(1);
    }
    if (formulaString == null || formulaString == '') {
      return result;
    }
    
    l = formulaString.length;
    c = formulaString[0].toUpperCase();
    if (c == '-' || c == '+' || c == '*' || c == '/') {
      result = { "type": "operator", token: c, next: formulaString.substring(1) };
    }
    else if (c == '(' || c == ')') {
      result = { "type": "paranthes", token: c, next: formulaString.substring(1) };
    }
    else if (c == ':') {
      result = { "type": "range", token: c, next: formulaString.substring(1) };
    }
    // XXX stefanc
    //else if (c == ';' || c == ',' ) {
    else if (c == ';' ) {
      result = { "type": "param", token: c, next: formulaString.substring(1) };
    }
    // XXX stefanc
    // else if ((c >= '0' && c <= '9') || c == '.') {
    else if ((c >= '0' && c <= '9' && Handsontable.helper.isNumeric(c)) || c == '.' || c == ',') {
      var val = 0.0;
      var part = 0.0;
      var state = 0;
      var div = 1.0;
      // XXX stefanc
      // for (i = 0; i < formulaString.length && ((formulaString[i] >= '0' && formulaString[i] <= '9') || formulaString[i] == '.'); i++) {
      for (i = 0; i < formulaString.length && ((formulaString[i] >= '0' && formulaString[i] <= '9' && Handsontable.helper.isNumeric(formulaString[i])) || formulaString[i] == '.' || formulaString[i] == ','); i++) {
        c = formulaString[i];
        // XXX stefanc
        // if (state == 0 && c == '.') {
        if (state == 0 && (c == '.' || c == ','))  {
          state = 1;
        }
        else if (state == 0) {
          val = val * 10 + formulaString.charCodeAt(i) - "0".charCodeAt(0);
        }
        // XXX stefanc
        // else if (state == 0 && c == '.') {
        else if (state == 0 && (c == '.' || c == ',')) {
          return { "type": 'error', error: i18n.t("table.formula.error.bad-number"), next: null };
        }
        else if (state == 1) {
          div /= 10.0;
          part = part + (formulaString.charCodeAt(i) - "0".charCodeAt(0)) * div;
        }
      }

      result = { "type": "number", token: val + part, next: formulaString.substring(i) };
    }
    else if (c == '$' || (c >= 'A' && c <= 'Z')) {  // See if it is a cell reference
      var ref = '';
      for (i = 0; i < formulaString.length && (formulaString[i] == '$' || (formulaString[i] >= '0' && formulaString[i] <= '9') || (formulaString[i].toUpperCase() >= 'A' && formulaString[i].toUpperCase() <= 'Z')); i++) {
        c = formulaString[i].toUpperCase();
        ref = ref + c;
      }
      if (i < formulaString.length && formulaString[i] == '(') {
        ref = ref.toLowerCase();	// Reformat the function names to lower case!!!!!
        result.type = 'func';
      }
      else {
        result.type = 'cell';
      }
      result.token = ref;		// NOTE: Keep the upper case for cell references!!!!!
      result.next = formulaString.substring(i);
    }
    else if (c == '=' || c == '<' || c == '>') {  // See if it is a relation that produces a boolean
      var c2 = null;

      if (l == 1) {
        result = { "type": "relation", token: c, next: formulaString.substring(1) };
      }
      else {
        c2 = formulaString[1];
        if (c2 == '=' || c2 == '<' || c2 == '>') {
          result = { "type": "relation", token: c+c2, next: formulaString.substring(2) };
        }
        else {
          result = { "type": "relation", token: c, next: formulaString.substring(1) };
        }
      }
    }
    else if (c == '"') {
      var str = ''
      var i;
      for (i = 1; i < formulaString.length && formulaString[i] != '"'; i++) {
        c = formulaString[i];
        if (c == '\\') {
          i++;
          c = formulaString[i];
        }
        str = str + c;
      }
      if (i == formulaString.length || formulaString[i] != '"') {
        return { "type": 'error', error: i18n.t("table.formula.error.unbalanced-string"), next: null };
      }
      result = { "type": "text", token: str, next: formulaString.substring(i+1) };
    }
    else { // Error or unknown token
      result.type = 'error';
      result.error = i18n.t("table.formula.error.bad-token") + ": " + c;
    }

    return result;
  };



  //
  // When all parameters that uses the cell name are done in a function,
  // We comes here and evaluates all the rest of the parameters,
  // Giving all the values after each other in the array.
  // This makes it possible to handle the array as a collection of values
  // as all cells, functions and operators have been dealt with.
  //
  var fixParams = function (tokens) {
    var i;
    var s = 0;
    var res = {};

    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].type == 'param') {
        if (s == i) {			// A null parameter.
	  tokens[i].type = '';
	  tokens[i].token = null;
	  s++;
	  continue;
	}
	res = evaluateTokens(tokens.slice(s,i));
	tokens.splice(s,i-s+1,res);
	s++;
	i = s - 1;
      }
    }
    if (s < tokens.length) {
      res = evaluateTokens(tokens.slice(s,i));
      tokens.splice(s,i-s+1,res);
    }
    return tokens;
  }





  //
  //
  //  The function block
  // Here we have all the functions that can be used within the formulas.
  // They need to be in lowercase as the formula give us the names that way.
  //



  //
  // Sums all the parameters as well as all the ranges within
  //
  //
  var funcSum = function (tokens) {
    var i;
    var sum = 0.0;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	sum = 0.0;
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean')
	      sum += (res.token * 1.0);
	  }
	tokens.splice(i-1,3,{ "type": 'number', token: sum, next: null});
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    sum = 0.0;
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean')
        sum += (tokens[i].token * 1.0);
    return { "type": 'number', token: sum, next: null };
  };



  //
  // Count all parameters that have a value as well as all ranges
  //
  var funcCount = function (tokens) {
    var i;
    var count = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (count == null)
	        count = 0;
	      count++;
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (count == null)
	  count = 0;
        count++;
      }
    return { "type": count == null ? '' : 'number', token: count, next: null };
  }



  //
  // Find the average of all parameters that have a value as well as all ranges
  // If we have no values, this function gives 'NULL', ie blank box
  //
  var funcAvg = function (tokens) {
    var i;
    var count = null;
    var sum = null;
    var myavg = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (count == null) {
	        count = 0;
		sum = 0.0;
	      }
	      count++;
	      sum += (res.token * 1.0);
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (count == null) {
	  count = 0;
	  sum = 0.0;
	}
        count++;
	sum += (tokens[i].token * 1.0);
      }
    if (count > 0)
      myavg = (sum * 1.0) / count;
    return { "type": myavg == null ? '' : 'number', token: myavg, next: null };
  }



  //
  // Find Minimum among all parameters that have a value as well as all ranges
  //
  var funcMin = function (tokens) {
    var i;
    var mymin = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (mymin == null)
	        mymin = res.token;
	      if (mymin > res.token)
	        mymin = res.token;
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (mymin == null)
	  mymin = tokens[i].token;
        if (mymin > tokens[i].token)
	  mymin = tokens[i].token;
      }
    return { "type": mymin == null ? '' : 'number', token: mymin, next: null };
  }



  //
  // Find Maximum among all parameters that have a value as well as all ranges
  //
  var funcMax = function (tokens) {
    var i;
    var mymax = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (mymax == null)
	        mymax = res.token;
	      if (mymax < res.token)
	        mymax = res.token;
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (mymax == null)
	  mymax = tokens[i].token;
        if (mymax < tokens[i].token)
	  mymax = tokens[i].token;
      }
    return { "type": mymax == null ? '' : 'number', token: mymax, next: null };
  }



  //
  // Logical AND among all parameters that have a value as well as all ranges
  //
  var funcAnd = function (tokens) {
    var i;
    var mycond = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (mycond == null)
	        mycond = !!res.token;
	      mycond = (mycond && !!res.token);
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (mycond == null)
	  mycond = !!tokens[i].token;
	mycond = (mycond && !!tokens[i].token);
      }
    return { "type": mycond == null ? '' : 'boolean', token: mycond, next: null };
  }



  //
  // Logical OR among all parameters that have a value as well as all ranges
  //
  var funcOr = function (tokens) {
    var i;
    var mycond = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (mycond == null)
	        mycond = !!res.token;
	      mycond = (mycond || !!res.token);
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (mycond == null)
	  mycond = !!tokens[i].token;
	mycond = (mycond || !!tokens[i].token);
      }
    return { "type": mycond == null ? '' : 'boolean', token: mycond, next: null };
  }



  //
  // Logical XOR among all parameters that have a value as well as all ranges
  //
  var funcXor = function (tokens) {
    var i;
    var mycond = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      if (mycond == null)
	        mycond = 0;
	      mycond = !!(mycond ^ !!res.token);
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
        if (mycond == null)
	  mycond = 0;
	mycond = !!(mycond ^ !!tokens[i].token);
      }
    return { "type": mycond == null ? '' : 'boolean', token: mycond, next: null };
  }



  //
  // Logical NOT among all parameters that have a value as well as all ranges
  //
  var funcNot = function (tokens) {
    var i;
    var mycond = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == 'number' || res.type == 'boolean') {
	      mycond = !res.token;
	    }
	  }
	tokens.splice(i-1,3);		// Remove range itself as we have just counted all within
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'number' || tokens[i].type == 'boolean') {
	mycond = !tokens[i].token;
      }
    return { "type": mycond == null ? '' : 'boolean', token: mycond, next: null };
  }




  //
  // IF have two or three parameters. First must evaluate to a boolean,
  // The second is evaluated if the first is true.
  // If the third exists, it is evaluated if the first is false.
  //
  var funcIf = function (tokens) {
    var res = {};

    tokens = fixParams(tokens);			// evaluate all parameters
    if (tokens.length < 2)
      return { "type": 'error', error: i18n.t("table.formula.error.if-too-few-parameters"), next: null };
    res = tokens[0];
    if (!(res.type == 'boolean' || res.type == 'number')) {
      return { "type": 'error', error: i18n.t("table.formula.error.if-bad-first-parameter"), next: null };
    }
    if (!!res.token)
      return tokens[1];
    else
      if (tokens.length < 3)
	return { "type": '', token: null, next: null };
      else
        return tokens[2];
  }



  //
  // Concatenate all parameters that have a value as well as all ranges
  // The result is a text or null.
  //
  var funcConcat = function (tokens) {
    var i;
    var tempstr = null;
    var res = {};

    for (i = 0; i < tokens.length; i++)
      if (tokens[i].type == 'range') {
        var topleft, bottomright;
	var r, c;
	var tempstr = null;

	if (i == 0 || i == tokens.length - 1) {	// Range error
	  return { "type": 'error', error: i18n.t("table.formula.error.bad-range"), next: null };
	}
	topleft = getRC(tokens[i-1].token);
	bottomright = getRC(tokens[i+1].token);
	for (r = topleft.row; r <= bottomright.row; r++)
	  for (c = topleft.col; c <= bottomright.col; c++) {
	    res = getData(r,c);
	    if (res.type == 'error')
	      return res;
	    if (res.type == '' || res.token == null)
	      continue;
	    if (tempstr == null)
	      tempstr = '';
	    tempstr = tempstr + res.token + '';
	  }
	res = { "type": tempstr == null ? '' : 'text', token: tempstr, next: null };
	tokens.splice(i-1,3,res);		// Remove range itself and place the concated string there
	i = i - 2;
	continue;
      }
    tokens = fixParams(tokens);			// evaluate all parameters
    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].type == '' || tokens[i].token == null)
	continue;
      if (tempstr == null)
        tempstr = '';
      tempstr = tempstr  + tokens[i].token + '';
    }
    return { "type": tempstr == null ? '' : 'text', token: tempstr, next: null };
  }






  //
  // NOTE: All function names are in lower case!!!!!
  //
  var funcs = [
  	{ func: 'sum', cb: funcSum }
	,{ func: 'count', cb: funcCount }
	,{ func: 'if', cb: funcIf }
	,{ func: 'avg', cb: funcAvg }
	,{ func: 'min', cb: funcMin }
	,{ func: 'max', cb: funcMax }
	,{ func: 'and', cb: funcAnd }
	,{ func: 'or', cb: funcOr }
	,{ func: 'xor', cb: funcXor }
	,{ func: 'not', cb: funcNot }
	,{ func: 'concat', cb: funcConcat }
  ];
  var evaluateFunc = function (tokens) {
    var i;

    for (i = 0; i < funcs.length; i++)
      if (funcs[i].func == tokens[0].token)
        return funcs[i].cb(tokens.slice(2, tokens.length));
    return { "type": 'error', error: i18n.t("table.formula.error.no-such-function") + ": " + tokens[0].token, next: null };
  };




  //
  // Some support functions to evalTokens:
  // fixBoolean: makes boolean value forcefully either numeric 0 or 1.
  //		 A null value is treated as a 0
  //
  // fixText: if the first token is a text and the other a number,
  //	      see if the text has digits as first chars. If so,
  //	      make the text a number, else make the number a text
  //
  var fixBoolean = function(tokens, col) {
    if (tokens[col].type == '' || tokens[col].type == 'boolean') {
      var term = tokens[col].token;

      tokens[col].type = 'number';
      if (typeof term === 'undefined' || term == null || term == '')
        tokens[col].token = 0.0;
    }
  };

  var fixOneCol = function (tokens, col) {
    var term = tokens[col].token;
    if (typeof term === 'undefined' || term == null || term == '') {
      tokens[col].type = 'number';
      tokens[col].token = 0.0;
    }
    else {
      var c = term[0];
      // xxx stefanc
      // if (c == '-' || c == '+' || (c >= '0' && c <= '9')) {
      if (c == '-' || c == '+' || Handsontable.helper.isNumeric(term)) {
        tokens[col].type = 'number';
        tokens[col].token = (1.0 * term);
      }
    }
  };

  var fixText = function (tokens, col1, col2) {
    if (tokens[col1].type == 'text' && tokens[col2].type == 'number')
      fixOneCol(tokens,col1);
    else if (tokens[col2].type == 'text' && tokens[col1].type == 'number')
      fixOneCol(tokens,col2);
  };



  //
  // Make a recursive loop through the array of tokens
  // to evaluate it by collapse the array when we find something to evaluate.
  // The result is at the first index of the collapsed array
  //
  // () and functions have the highest priority.
  //    that mean that the parameters to the function isn't neseccary evaluated fully
  //    we need to have it that way so that we can evaluate 'range' and functions
  //    that use the cell references not the values they point to. For instance
  //    COLUMN(A3) should give '3' as result and ROW(A3) should give '1'.
  //    but SUM(A1:B2) should iterate all indicated cells to sum the values of them.
  //    The above gives A1, A2, B1, B2 as cells to sum the values from.
  //    If any of them contails a formula, it is reevaluated on the spot, returning
  //    the result of that formula before the 'SUM' continues.
  //
  // A2 When all paranthesis and functions have been evaluated,
  //    the rest of the cell references are evaluated and exchanged for their values.
  //    If any value is a formula, it is reevaluated here to give the current value
  //    of that formula.
  //
  //	Note that we can have a deadlock!!!!!! formulas are not marked as evaluated
  //	this sequence, so be careful.
  //
  // * / comes next in priority
  // -   Unary minus is evaluated next. Also unary '+' goes here.
  // + - Have the lowest priority
  //
  var evaluateTokens = function (tokens) {
    var i, j;
    var found = 0;

    for (i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].type == 'paranthes' && tokens[i].token == '(') {
        for (j = i; j < tokens.length; j++) {
          if (tokens[j].type == 'paranthes' && tokens[j].token == ')') {
            var res;
            if (i > 0 && tokens[i-1].type == 'func') {
              i--;
              res = evaluateFunc(tokens.slice(i,j));		// Evaluate function
            }
            else {
              res = evaluateTokens(tokens.slice(i+1,j));	// Evaluate formula within ()
            }
            tokens.splice(i,j-i+1,res);
            found = 1;
            break;
          }
        }
        if (!found) {
          return { "type": 'error', error: i18n.t("table.formula.error.unbalanced-paranthesis"), next: null };
        }

        i = tokens.length;	// Restart search for paranthesis
        found = 0;
        continue;
      }
    }
    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].type == 'cell') {
        var res = getCell(tokens[i].token);		// Replace reference with the value
        tokens.splice(i,1,res);
      }
    }

    for (i = 1; i < tokens.length - 1; i++) {		// Evaluate * /
      if (tokens[i].type == 'operator' && (tokens[i].token == '*' || tokens[i].token == '/')) {
        if (tokens[i-1].type == 'error') {
          return tokens[i-1];
        }
        if (tokens[i+1].type == 'error') {
          return tokens[i+1];
        }
        var res = { "type": 'number', "token": 0.0, "next": null };

        fixBoolean(tokens, i-1);
        fixBoolean(tokens, i+1);
        fixText(tokens, i-1, i+1);
        if (tokens[i-1].type != 'number' || tokens[i+1].type != 'number') {
          return { "type": 'error', "error": i18n.t("table.formula.error.bad-formula"), "next": null };
        }
      	if (tokens[i].token == '*') {
          res.token = tokens[i-1].token * tokens[i+1].token;
        }
        else {
          res.token = tokens[i-1].token / tokens[i+1].token;
        }

        tokens.splice(i-1,3,res);
        i = i - 2;
        continue;
      }
    }

    // Unary + and -
    if (tokens[0].type == 'operator' && (tokens[0].token == '-' || tokens[0].token == '+')) {
      if (tokens[1].type == 'error') {
        return tokens[1];
      }
    
      var res = { "type": 'number', "token": 0.0, "next": null };

      if (tokens.length > 1) {
        fixBoolean(tokens, 1);
        if (tokens[1].type == 'text') {
          fixOneCol(tokens,1);
        }
      }
    	if (tokens.length > 1 && tokens[1].type != 'number') {
        return { "type": 'error', "error": i18n.t("table.formula.error.bad-formula"), "next": null };
      }
      if (tokens[0].token == '-') {
        res.token = -tokens[1].token;
      }
      else {
        res.token = tokens[1].token;
      }

      tokens.splice(0,2,res);
    }

    for (i = 1; i < tokens.length - 1; i++)	{ // almost lastly evaluate + -
      if (tokens[i].type == 'operator' && (tokens[i].token == '-' || tokens[i].token == '+')) {
        if (tokens[i-1].type == 'error') {
          return tokens[i-1];
        }
        if (tokens[i+1].type == 'error') {
          return tokens[i+1];
        }
        
        var res = { "type": 'number', "token": 0.0, "next": null };

        fixBoolean(tokens, i-1);
        fixBoolean(tokens, i+1);
        fixText(tokens, i-1, i+1);
        if (tokens[i-1].type != 'number' || tokens[i+1].type != 'number') {
          return { "type": 'error', "error": i18n.t("table.formula.error.bad-formula"), "next": null };
        }
        if (tokens[i].token == '+') {
          res.token = tokens[i-1].token + tokens[i+1].token;
        }
        else {
          res.token = tokens[i-1].token - tokens[i+1].token;
        }

        tokens.splice(i-1,3,res);
        i = i - 2;
        continue;
      }
    }
    for (i = 1; i < tokens.length - 1; i++)	{ // lastly evaluate relation = > < <> <= >=
      if (tokens[i].type == 'relation') {
        if (tokens[i-1].type == 'error') {
          return tokens[i-1];
        }
        if (tokens[i+1].type == 'error') {
          return tokens[i+1];
        }
        
        var res = { "type": 'boolean', "token": 0, "next": null };

        fixBoolean(tokens,i-1);
        fixBoolean(tokens,i+1);
        fixText(tokens,i-1,i+1);
        if (tokens[i-1].type != tokens[i+1].type || tokens[i].token == '==') {
          return { "type": 'error', "error": i18n.t("table.formula.error.bad-formula"), "next": null };
        }

        var term1 = tokens[i-1].token;
        var term2 = tokens[i+1].token;
        var relation = tokens[i].token;

        if (relation == '=') {
          res.token = (term1 == term2);
        }
        else if (relation == '<>' || relation == '><') {
          res.token = (term1 != term2);
        }
        else if (relation == '>=' || relation == '=>') {
          res.token = (term1 >= term2);
        }
        else if (relation == '<=' || relation == '=<') {
          res.token = (term1 <= term2);
        }
        else if (relation == '<') {
          res.token = (term1 < term2);
        }
        else if (relation == '>') {
          res.token = (term1 > term2);
        }

        tokens.splice(i-1,3,res);
        i = i - 2;
        continue;
      }
    }
    if (tokens.length == 1)	{ // If we just have one value, say it's ok and continue
      return tokens[0];
    }
    return { "type": 'error', "error": i18n.t("table.formula.error.bad-formula"), "next": null };
  }



    //
    // Body of evaluateFormula
    //

    var theToken = {};
    var tokens = [];

    theToken = nextToken(formula);
    while (theToken.type != 'error' && theToken.next != '' && theToken.next != null) {
      tokens.push(theToken);
      theToken = nextToken(theToken.next);
    }
    if (theToken.type == 'error') {
      return theToken;
    }
    tokens.push(theToken);
    return evaluateTokens(tokens);
  };


function initExcelCell() {
  var instance = this
     ,settings = instance.getSettings()
     ,orgtextcellrender
     ,orgcelltypestxt;

  if (!settings.useFormula)
    return;

  orgcelltypestxt = Handsontable.cellTypes.text;
  Handsontable.cellTypes.text = Handsontable._TextCell;

  orgtextcellrender = Handsontable.TextCell.renderer;
  Handsontable.TextCell.renderer = Handsontable.renderers.ExcelRenderer;
}

/**
  * original TextCell
Handsontable.TextCell = {
  renderer: Handsontable.TextRenderer,
  editor: Handsontable.TextEditor
};
*/

Handsontable._TextCell = {
  renderer: Handsontable.renderers.TextRenderer,
  editor: Handsontable.editors.TextEditor
};


/**
  * original cellTypes
//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  autocomplete: Handsontable.AutocompleteCell,
  checkbox: Handsontable.CheckboxCell,
  text: Handsontable.TextCell,
  numeric: Handsontable.NumericCell,
  date: Handsontable.DateCell
}
*/



//
// rewrite old numericrenderer so that it takes account for more different formats
//

var numericRenderer = Handsontable.renderers.NumericRenderer;
/*Handsontable.renderers.NumericRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var myformat;
  if (typeof value === 'number') {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language)
    } 
    if (value == 0)
      myformat = cellProperties.zeroformat;
    else if (value < 0)
      myformat = cellProperties.negativeformat;
    else
      myformat = cellProperties.format;
    td.innerHTML = numeral(value).format(myformat || '0'); //docs: http://numeraljs.com/
    td.className = 'htNumeric';
  } 
  else {
    Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
  } 
};*/
// XXX stefanc
Handsontable.renderers.NumericRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var myformat;
  
  var valueToTest = (typeof value === "string") ? value.replace(",",".") : value;
  if (Handsontable.helper.isNumeric(valueToTest)) {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language)
    } 
    
    if(cellProperties.snteExplicitType === 'numeric') {
      myformat = cellProperties.snteFormats['numericExplicit'];
    }
    else {
      myformat = cellProperties.snteFormats['numericImplicit'];
    }

    value = numeral(valueToTest).format(myformat || '0');
  }
  
  Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
};
Handsontable.NumericCell.renderer = Handsontable.renderers.NumericRenderer;

// XXX stefanc
Handsontable.helper.isNumeric = function (n) {
    var t = typeof n;
    return t == 'number' ? !isNaN(n) && isFinite(n) :
           t == 'string' ? !n.length ? false :
           n.length == 1 ? /\d/.test(n) :
           /^\s*[+-]?\s*(?:(?:\d+(?:[.,]\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) :
           t == 'object' ? !!n && typeof n.valueOf() == "number" && !(n instanceof Date) : false;
};

Handsontable.renderers.ExcelRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var c;
  var newValue = value;

  if (typeof value === 'undefined' || value === null || value == '') {
    cellProperties.snteFormula = void 0;
    cellProperties.snteImplicitType = "text";
    Handsontable._TextCell.renderer.apply(this, arguments);
    return "";
  }
  
  if (typeof value === 'number') {
    value = value.toString();
  }
  
  c = value[0];
  cellProperties.snteFormula = void 0;
  if (c == "'") {		// force value to a string, even things like numeric or formula
    cellProperties.snteImplicitType = "text";

    newValue = value.substring(1);
    
    Handsontable._TextCell.renderer.apply(this, [ instance, td, row, col, prop, newValue, cellProperties ]);
  }
  else if (c == "=") {  // Hmm, now we are cooked, boiled and fried. Trying to evaluate a formula
    cellProperties.snteFormula = value.substring(1);

    var theToken = evaluateFormula(instance, [{"row": row, "col": col}], value.substring(1));

    if (theToken.type == 'error') {
      cellProperties.snteImplicitType = "error";
      newValue = theToken.error;
      
      Handsontable.renderers.HtmlRenderer(instance, td, row, col, prop, "<span class=\"snte-formula-error glyphicon glyphicon-exclamation-sign\" data-toggle=\"tooltip\" data-placement=\"bottom\" title=\""+newValue+"\"></span>", cellProperties);
      //Handsontable._TextCell.renderer.apply(this, [ instance, td, row, col, prop, newValue, cellProperties ]);
    }
    else if (theToken.type == 'number') {
      cellProperties.snteImplicitType = "numeric";
      newValue = theToken.token;
      
      Handsontable.NumericCell.renderer.apply(this, [ instance, td, row, col, prop, newValue, cellProperties ]);
    }
    else if (theToken.type == 'text') {
      cellProperties.snteImplicitType = "text";
      newValue = theToken.token;
      
      Handsontable._TextCell.renderer.apply(this, [ instance, td, row, col, prop, newValue, cellProperties ]);
    }
    else if (theToken.type == 'boolean') {
      cellProperties.snteImplicitType = "text";
      newValue = theToken.token ? i18n.t("datatypes.boolean.true") : i18n.t("datatypes.boolean.false");
      
      Handsontable._TextCell.renderer.apply(this, [ instance, td, row, col, prop, newValue, cellProperties ]);
    }
    else {
      cellProperties.snteImplicitType = "text";
      newValue = theToken.token;
      
      Handsontable._TextCell.renderer.apply(this, [ instance, td, row, col, prop, newValue, cellProperties ]);
    }
  }
  else if (c == '-' || c == '+' || c == '.' || c == ',' || (c >= '0' && c <= '9' && Handsontable.helper.isNumeric(value))) {	// Numeric constant
    cellProperties.snteFormula = void 0;
    cellProperties.snteImplicitType = "numeric";
    
    Handsontable.NumericCell.renderer.apply(this, arguments);
  }
  else {					// else probably a string
    cellProperties.snteFormula = void 0;
    cellProperties.snteImplicitType = "text";
    
    Handsontable._TextCell.renderer.apply(this, arguments);
  }

  cellProperties.snteRendered = ""+newValue;

  return newValue;
};

var ExcelEditor = Handsontable.editors.TextEditor.prototype.extend();

ExcelEditor.prototype.beginEditing = function () {
  //Call the original beginEditing method
  Handsontable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);

  var onBeginEditing = this.instance.getSettings().onBeginEditing;
  if (onBeginEditing) {
    onBeginEditing();
  }
};
ExcelEditor.prototype.finishEditing = function () {
  //Call the original finishEditing method
  Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);

  var onFinishEditing = this.instance.getSettings().onFinishEditing;
  if (onFinishEditing) {
    onFinishEditing();
  }
};
ExcelEditor.prototype.putCellReference = function (cellReference) {
  var caret = this.wtDom.getCaretPosition(this.TEXTAREA);
  var origValue = this.TEXTAREA.value;

  this.TEXTAREA.value = origValue.substring(0, caret)+cellReference+origValue.substring(caret);
  this.focus();
  this.wtDom.setCaretPosition(this.TEXTAREA, caret+cellReference.length);
  this.refreshDimensions();
};

Handsontable.editors.ExcelEditor = ExcelEditor;
Handsontable.editors.registerEditor('excel', ExcelEditor);

Handsontable.ExcelCell = {
  renderer: Handsontable.renderers.ExcelRenderer,
  editor: Handsontable.editors.ExcelEditor,
  dataType: 'excel'
};

// Add mapping of our type
Handsontable.cellTypes['excel'] = Handsontable.ExcelCell;

Handsontable.PluginHooks.add('afterInit', initExcelCell);

})(jQuery);