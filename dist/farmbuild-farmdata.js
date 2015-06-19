!function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else {
        var n;
        "undefined" != typeof window ? n = window : "undefined" != typeof global ? n = global : "undefined" != typeof self && (n = self), 
        n.geojsonhint = e();
    }
}(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    throw new Error("Cannot find module '" + o + "'");
                }
                var f = n[o] = {
                    exports: {}
                };
                t[o][0].call(f.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, f, f.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }({
        1: [ function(_dereq_, module, exports) {
            var jsonlint = _dereq_("jsonlint-lines");
            function hint(str) {
                var errors = [], gj;
                function root(_) {
                    if (!_.type) {
                        errors.push({
                            message: "The type property is required and was not found",
                            line: _.__line__
                        });
                    } else if (!types[_.type]) {
                        errors.push({
                            message: "The type " + _.type + " is unknown",
                            line: _.__line__
                        });
                    } else if (_) {
                        types[_.type](_);
                    }
                }
                function everyIs(_, type) {
                    return _.every(function(x) {
                        return x !== null && typeof x === type;
                    });
                }
                function requiredProperty(_, name, type) {
                    if (typeof _[name] == "undefined") {
                        return errors.push({
                            message: '"' + name + '" property required',
                            line: _.__line__
                        });
                    } else if (type === "array") {
                        if (!Array.isArray(_[name])) {
                            return errors.push({
                                message: '"' + name + '" property should be an array, but is an ' + typeof _[name] + " instead",
                                line: _.__line__
                            });
                        }
                    } else if (type && typeof _[name] !== type) {
                        return errors.push({
                            message: '"' + name + '" property should be ' + type + ", but is an " + typeof _[name] + " instead",
                            line: _.__line__
                        });
                    }
                }
                function FeatureCollection(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "features", "array")) {
                        if (!everyIs(_.features, "object")) {
                            return errors.push({
                                message: "Every feature must be an object",
                                line: _.__line__
                            });
                        }
                        _.features.forEach(Feature);
                    }
                }
                function position(_, line) {
                    if (!Array.isArray(_)) {
                        return errors.push({
                            message: "position should be an array, is a " + typeof _ + " instead",
                            line: _.__line__ || line
                        });
                    } else {
                        if (_.length < 2) {
                            return errors.push({
                                message: "position must have 2 or more elements",
                                line: _.__line__ || line
                            });
                        }
                        if (!everyIs(_, "number")) {
                            return errors.push({
                                message: "each element in a position must be a number",
                                line: _.__line__ || line
                            });
                        }
                    }
                }
                function positionArray(coords, type, depth, line) {
                    if (line === undefined && coords.__line__ !== undefined) {
                        line = coords.__line__;
                    }
                    if (depth === 0) {
                        return position(coords, line);
                    } else {
                        if (depth === 1 && type) {
                            if (type === "LinearRing") {
                                if (!Array.isArray(coords[coords.length - 1])) {
                                    return errors.push({
                                        message: "a number was found where a coordinate array should have been found: this needs to be nested more deeply",
                                        line: line
                                    });
                                }
                                if (coords.length < 4) {
                                    errors.push({
                                        message: "a LinearRing of coordinates needs to have four or more positions",
                                        line: line
                                    });
                                }
                                if (coords.length && (coords[coords.length - 1].length !== coords[0].length || !coords[coords.length - 1].every(function(position, index) {
                                    return coords[0][index] === position;
                                }))) {
                                    errors.push({
                                        message: "the first and last positions in a LinearRing of coordinates must be the same",
                                        line: line
                                    });
                                }
                            } else if (type === "Line" && coords.length < 2) {
                                errors.push({
                                    message: "a line needs to have two or more coordinates to be valid",
                                    line: line
                                });
                            }
                        }
                        if (!Array.isArray(coords)) {
                            return errors.push({
                                message: "coordinates must be list of positions",
                                line: line
                            });
                        }
                        coords.forEach(function(c) {
                            positionArray(c, type, depth - 1, c.__line__ || line);
                        });
                    }
                }
                function crs(_) {
                    if (!_.crs) return;
                    if (typeof _.crs === "object") {
                        var strErr = requiredProperty(_.crs, "type", "string"), propErr = requiredProperty(_.crs, "properties", "object");
                        if (!strErr && !propErr) {
                            if (_.crs.type == "name") {
                                requiredProperty(_.crs.properties, "name", "string");
                            } else if (_.crs.type == "link") {
                                requiredProperty(_.crs.properties, "href", "string");
                            }
                        }
                    } else {
                        errors.push({
                            message: "the value of the crs property must be an object, not a " + typeof _.crs,
                            line: _.__line__
                        });
                    }
                }
                function bbox(_) {
                    if (!_.bbox) return;
                    if (Array.isArray(_.bbox)) {
                        if (!everyIs(_.bbox, "number")) {
                            return errors.push({
                                message: "each element in a bbox property must be a number",
                                line: _.bbox.__line__
                            });
                        }
                    } else {
                        errors.push({
                            message: "bbox property must be an array of numbers, but is a " + typeof _.bbox,
                            line: _.__line__
                        });
                    }
                }
                function Point(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "coordinates", "array")) {
                        position(_.coordinates);
                    }
                }
                function Polygon(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "coordinates", "array")) {
                        positionArray(_.coordinates, "LinearRing", 2);
                    }
                }
                function MultiPolygon(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "coordinates", "array")) {
                        positionArray(_.coordinates, "LinearRing", 3);
                    }
                }
                function LineString(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "coordinates", "array")) {
                        positionArray(_.coordinates, "Line", 1);
                    }
                }
                function MultiLineString(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "coordinates", "array")) {
                        positionArray(_.coordinates, "Line", 2);
                    }
                }
                function MultiPoint(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "coordinates", "array")) {
                        positionArray(_.coordinates, "", 1);
                    }
                }
                function GeometryCollection(_) {
                    crs(_);
                    bbox(_);
                    if (!requiredProperty(_, "geometries", "array")) {
                        _.geometries.forEach(function(geometry) {
                            if (geometry) root(geometry);
                        });
                    }
                }
                function Feature(_) {
                    crs(_);
                    bbox(_);
                    if (_.id !== undefined && typeof _.id !== "string" && typeof _.id !== "number") {
                        errors.push({
                            message: 'Feature "id" property must have a string or number value',
                            line: _.__line__
                        });
                    }
                    if (_.type !== "Feature") {
                        errors.push({
                            message: "GeoJSON features must have a type=feature property",
                            line: _.__line__
                        });
                    }
                    requiredProperty(_, "properties", "object");
                    if (!requiredProperty(_, "geometry", "object")) {
                        if (_.geometry) root(_.geometry);
                    }
                }
                var types = {
                    Point: Point,
                    Feature: Feature,
                    MultiPoint: MultiPoint,
                    LineString: LineString,
                    MultiLineString: MultiLineString,
                    FeatureCollection: FeatureCollection,
                    GeometryCollection: GeometryCollection,
                    Polygon: Polygon,
                    MultiPolygon: MultiPolygon
                };
                if (typeof str !== "string") {
                    return [ {
                        message: "Expected string input",
                        line: 0
                    } ];
                }
                try {
                    gj = jsonlint.parse(str);
                } catch (e) {
                    var match = e.message.match(/line (\d+)/), lineNumber = 0;
                    if (match) lineNumber = parseInt(match[1], 10);
                    return [ {
                        line: lineNumber - 1,
                        message: e.message,
                        error: e
                    } ];
                }
                if (typeof gj !== "object" || gj === null || gj === undefined) {
                    errors.push({
                        message: "The root of a GeoJSON object must be an object.",
                        line: 0
                    });
                    return errors;
                }
                root(gj);
                return errors;
            }
            module.exports.hint = hint;
        }, {
            "jsonlint-lines": 2
        } ],
        2: [ function(_dereq_, module, exports) {
            (function(process) {
                var jsonlint = function() {
                    var parser = {
                        trace: function trace() {},
                        yy: {},
                        symbols_: {
                            error: 2,
                            JSONString: 3,
                            STRING: 4,
                            JSONNumber: 5,
                            NUMBER: 6,
                            JSONNullLiteral: 7,
                            NULL: 8,
                            JSONBooleanLiteral: 9,
                            TRUE: 10,
                            FALSE: 11,
                            JSONText: 12,
                            JSONValue: 13,
                            EOF: 14,
                            JSONObject: 15,
                            JSONArray: 16,
                            "{": 17,
                            "}": 18,
                            JSONMemberList: 19,
                            JSONMember: 20,
                            ":": 21,
                            ",": 22,
                            "[": 23,
                            "]": 24,
                            JSONElementList: 25,
                            $accept: 0,
                            $end: 1
                        },
                        terminals_: {
                            2: "error",
                            4: "STRING",
                            6: "NUMBER",
                            8: "NULL",
                            10: "TRUE",
                            11: "FALSE",
                            14: "EOF",
                            17: "{",
                            18: "}",
                            21: ":",
                            22: ",",
                            23: "[",
                            24: "]"
                        },
                        productions_: [ 0, [ 3, 1 ], [ 5, 1 ], [ 7, 1 ], [ 9, 1 ], [ 9, 1 ], [ 12, 2 ], [ 13, 1 ], [ 13, 1 ], [ 13, 1 ], [ 13, 1 ], [ 13, 1 ], [ 13, 1 ], [ 15, 2 ], [ 15, 3 ], [ 20, 3 ], [ 19, 1 ], [ 19, 3 ], [ 16, 2 ], [ 16, 3 ], [ 25, 1 ], [ 25, 3 ] ],
                        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
                            var $0 = $$.length - 1;
                            switch (yystate) {
                              case 1:
                                this.$ = yytext.replace(/\\(\\|")/g, "$" + "1").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "	").replace(/\\v/g, "").replace(/\\f/g, "\f").replace(/\\b/g, "\b");
                                break;

                              case 2:
                                this.$ = Number(yytext);
                                break;

                              case 3:
                                this.$ = null;
                                break;

                              case 4:
                                this.$ = true;
                                break;

                              case 5:
                                this.$ = false;
                                break;

                              case 6:
                                return this.$ = $$[$0 - 1];
                                break;

                              case 13:
                                this.$ = {};
                                Object.defineProperty(this.$, "__line__", {
                                    value: this._$.first_line,
                                    enumerable: false
                                });
                                break;

                              case 14:
                                this.$ = $$[$0 - 1];
                                Object.defineProperty(this.$, "__line__", {
                                    value: this._$.first_line,
                                    enumerable: false
                                });
                                break;

                              case 15:
                                this.$ = [ $$[$0 - 2], $$[$0] ];
                                break;

                              case 16:
                                this.$ = {};
                                this.$[$$[$0][0]] = $$[$0][1];
                                break;

                              case 17:
                                this.$ = $$[$0 - 2];
                                $$[$0 - 2][$$[$0][0]] = $$[$0][1];
                                break;

                              case 18:
                                this.$ = [];
                                Object.defineProperty(this.$, "__line__", {
                                    value: this._$.first_line,
                                    enumerable: false
                                });
                                break;

                              case 19:
                                this.$ = $$[$0 - 1];
                                Object.defineProperty(this.$, "__line__", {
                                    value: this._$.first_line,
                                    enumerable: false
                                });
                                break;

                              case 20:
                                this.$ = [ $$[$0] ];
                                break;

                              case 21:
                                this.$ = $$[$0 - 2];
                                $$[$0 - 2].push($$[$0]);
                                break;
                            }
                        },
                        table: [ {
                            3: 5,
                            4: [ 1, 12 ],
                            5: 6,
                            6: [ 1, 13 ],
                            7: 3,
                            8: [ 1, 9 ],
                            9: 4,
                            10: [ 1, 10 ],
                            11: [ 1, 11 ],
                            12: 1,
                            13: 2,
                            15: 7,
                            16: 8,
                            17: [ 1, 14 ],
                            23: [ 1, 15 ]
                        }, {
                            1: [ 3 ]
                        }, {
                            14: [ 1, 16 ]
                        }, {
                            14: [ 2, 7 ],
                            18: [ 2, 7 ],
                            22: [ 2, 7 ],
                            24: [ 2, 7 ]
                        }, {
                            14: [ 2, 8 ],
                            18: [ 2, 8 ],
                            22: [ 2, 8 ],
                            24: [ 2, 8 ]
                        }, {
                            14: [ 2, 9 ],
                            18: [ 2, 9 ],
                            22: [ 2, 9 ],
                            24: [ 2, 9 ]
                        }, {
                            14: [ 2, 10 ],
                            18: [ 2, 10 ],
                            22: [ 2, 10 ],
                            24: [ 2, 10 ]
                        }, {
                            14: [ 2, 11 ],
                            18: [ 2, 11 ],
                            22: [ 2, 11 ],
                            24: [ 2, 11 ]
                        }, {
                            14: [ 2, 12 ],
                            18: [ 2, 12 ],
                            22: [ 2, 12 ],
                            24: [ 2, 12 ]
                        }, {
                            14: [ 2, 3 ],
                            18: [ 2, 3 ],
                            22: [ 2, 3 ],
                            24: [ 2, 3 ]
                        }, {
                            14: [ 2, 4 ],
                            18: [ 2, 4 ],
                            22: [ 2, 4 ],
                            24: [ 2, 4 ]
                        }, {
                            14: [ 2, 5 ],
                            18: [ 2, 5 ],
                            22: [ 2, 5 ],
                            24: [ 2, 5 ]
                        }, {
                            14: [ 2, 1 ],
                            18: [ 2, 1 ],
                            21: [ 2, 1 ],
                            22: [ 2, 1 ],
                            24: [ 2, 1 ]
                        }, {
                            14: [ 2, 2 ],
                            18: [ 2, 2 ],
                            22: [ 2, 2 ],
                            24: [ 2, 2 ]
                        }, {
                            3: 20,
                            4: [ 1, 12 ],
                            18: [ 1, 17 ],
                            19: 18,
                            20: 19
                        }, {
                            3: 5,
                            4: [ 1, 12 ],
                            5: 6,
                            6: [ 1, 13 ],
                            7: 3,
                            8: [ 1, 9 ],
                            9: 4,
                            10: [ 1, 10 ],
                            11: [ 1, 11 ],
                            13: 23,
                            15: 7,
                            16: 8,
                            17: [ 1, 14 ],
                            23: [ 1, 15 ],
                            24: [ 1, 21 ],
                            25: 22
                        }, {
                            1: [ 2, 6 ]
                        }, {
                            14: [ 2, 13 ],
                            18: [ 2, 13 ],
                            22: [ 2, 13 ],
                            24: [ 2, 13 ]
                        }, {
                            18: [ 1, 24 ],
                            22: [ 1, 25 ]
                        }, {
                            18: [ 2, 16 ],
                            22: [ 2, 16 ]
                        }, {
                            21: [ 1, 26 ]
                        }, {
                            14: [ 2, 18 ],
                            18: [ 2, 18 ],
                            22: [ 2, 18 ],
                            24: [ 2, 18 ]
                        }, {
                            22: [ 1, 28 ],
                            24: [ 1, 27 ]
                        }, {
                            22: [ 2, 20 ],
                            24: [ 2, 20 ]
                        }, {
                            14: [ 2, 14 ],
                            18: [ 2, 14 ],
                            22: [ 2, 14 ],
                            24: [ 2, 14 ]
                        }, {
                            3: 20,
                            4: [ 1, 12 ],
                            20: 29
                        }, {
                            3: 5,
                            4: [ 1, 12 ],
                            5: 6,
                            6: [ 1, 13 ],
                            7: 3,
                            8: [ 1, 9 ],
                            9: 4,
                            10: [ 1, 10 ],
                            11: [ 1, 11 ],
                            13: 30,
                            15: 7,
                            16: 8,
                            17: [ 1, 14 ],
                            23: [ 1, 15 ]
                        }, {
                            14: [ 2, 19 ],
                            18: [ 2, 19 ],
                            22: [ 2, 19 ],
                            24: [ 2, 19 ]
                        }, {
                            3: 5,
                            4: [ 1, 12 ],
                            5: 6,
                            6: [ 1, 13 ],
                            7: 3,
                            8: [ 1, 9 ],
                            9: 4,
                            10: [ 1, 10 ],
                            11: [ 1, 11 ],
                            13: 31,
                            15: 7,
                            16: 8,
                            17: [ 1, 14 ],
                            23: [ 1, 15 ]
                        }, {
                            18: [ 2, 17 ],
                            22: [ 2, 17 ]
                        }, {
                            18: [ 2, 15 ],
                            22: [ 2, 15 ]
                        }, {
                            22: [ 2, 21 ],
                            24: [ 2, 21 ]
                        } ],
                        defaultActions: {
                            16: [ 2, 6 ]
                        },
                        parseError: function parseError(str, hash) {
                            if (hash.recoverable) {
                                this.trace(str);
                            } else {
                                throw new Error(str);
                            }
                        },
                        parse: function parse(input) {
                            var self = this, stack = [ 0 ], vstack = [ null ], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
                            this.lexer.setInput(input);
                            this.lexer.yy = this.yy;
                            this.yy.lexer = this.lexer;
                            this.yy.parser = this;
                            if (typeof this.lexer.yylloc == "undefined") {
                                this.lexer.yylloc = {};
                            }
                            var yyloc = this.lexer.yylloc;
                            lstack.push(yyloc);
                            var ranges = this.lexer.options && this.lexer.options.ranges;
                            if (typeof this.yy.parseError === "function") {
                                this.parseError = this.yy.parseError;
                            } else {
                                this.parseError = Object.getPrototypeOf(this).parseError;
                            }
                            function popStack(n) {
                                stack.length = stack.length - 2 * n;
                                vstack.length = vstack.length - n;
                                lstack.length = lstack.length - n;
                            }
                            function lex() {
                                var token;
                                token = self.lexer.lex() || EOF;
                                if (typeof token !== "number") {
                                    token = self.symbols_[token] || token;
                                }
                                return token;
                            }
                            var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
                            while (true) {
                                state = stack[stack.length - 1];
                                if (this.defaultActions[state]) {
                                    action = this.defaultActions[state];
                                } else {
                                    if (symbol === null || typeof symbol == "undefined") {
                                        symbol = lex();
                                    }
                                    action = table[state] && table[state][symbol];
                                }
                                if (typeof action === "undefined" || !action.length || !action[0]) {
                                    var errStr = "";
                                    expected = [];
                                    for (p in table[state]) {
                                        if (this.terminals_[p] && p > TERROR) {
                                            expected.push("'" + this.terminals_[p] + "'");
                                        }
                                    }
                                    if (this.lexer.showPosition) {
                                        errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                                    } else {
                                        errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == EOF ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                                    }
                                    this.parseError(errStr, {
                                        text: this.lexer.match,
                                        token: this.terminals_[symbol] || symbol,
                                        line: this.lexer.yylineno,
                                        loc: yyloc,
                                        expected: expected
                                    });
                                }
                                if (action[0] instanceof Array && action.length > 1) {
                                    throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                                }
                                switch (action[0]) {
                                  case 1:
                                    stack.push(symbol);
                                    vstack.push(this.lexer.yytext);
                                    lstack.push(this.lexer.yylloc);
                                    stack.push(action[1]);
                                    symbol = null;
                                    if (!preErrorSymbol) {
                                        yyleng = this.lexer.yyleng;
                                        yytext = this.lexer.yytext;
                                        yylineno = this.lexer.yylineno;
                                        yyloc = this.lexer.yylloc;
                                        if (recovering > 0) {
                                            recovering--;
                                        }
                                    } else {
                                        symbol = preErrorSymbol;
                                        preErrorSymbol = null;
                                    }
                                    break;

                                  case 2:
                                    len = this.productions_[action[1]][1];
                                    yyval.$ = vstack[vstack.length - len];
                                    yyval._$ = {
                                        first_line: lstack[lstack.length - (len || 1)].first_line,
                                        last_line: lstack[lstack.length - 1].last_line,
                                        first_column: lstack[lstack.length - (len || 1)].first_column,
                                        last_column: lstack[lstack.length - 1].last_column
                                    };
                                    if (ranges) {
                                        yyval._$.range = [ lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1] ];
                                    }
                                    r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                                    if (typeof r !== "undefined") {
                                        return r;
                                    }
                                    if (len) {
                                        stack = stack.slice(0, -1 * len * 2);
                                        vstack = vstack.slice(0, -1 * len);
                                        lstack = lstack.slice(0, -1 * len);
                                    }
                                    stack.push(this.productions_[action[1]][0]);
                                    vstack.push(yyval.$);
                                    lstack.push(yyval._$);
                                    newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                                    stack.push(newState);
                                    break;

                                  case 3:
                                    return true;
                                }
                            }
                            return true;
                        }
                    };
                    var lexer = function() {
                        var lexer = {
                            EOF: 1,
                            parseError: function parseError(str, hash) {
                                if (this.yy.parser) {
                                    this.yy.parser.parseError(str, hash);
                                } else {
                                    throw new Error(str);
                                }
                            },
                            setInput: function(input) {
                                this._input = input;
                                this._more = this._backtrack = this.done = false;
                                this.yylineno = this.yyleng = 0;
                                this.yytext = this.matched = this.match = "";
                                this.conditionStack = [ "INITIAL" ];
                                this.yylloc = {
                                    first_line: 1,
                                    first_column: 0,
                                    last_line: 1,
                                    last_column: 0
                                };
                                if (this.options.ranges) {
                                    this.yylloc.range = [ 0, 0 ];
                                }
                                this.offset = 0;
                                return this;
                            },
                            input: function() {
                                var ch = this._input[0];
                                this.yytext += ch;
                                this.yyleng++;
                                this.offset++;
                                this.match += ch;
                                this.matched += ch;
                                var lines = ch.match(/(?:\r\n?|\n).*/g);
                                if (lines) {
                                    this.yylineno++;
                                    this.yylloc.last_line++;
                                } else {
                                    this.yylloc.last_column++;
                                }
                                if (this.options.ranges) {
                                    this.yylloc.range[1]++;
                                }
                                this._input = this._input.slice(1);
                                return ch;
                            },
                            unput: function(ch) {
                                var len = ch.length;
                                var lines = ch.split(/(?:\r\n?|\n)/g);
                                this._input = ch + this._input;
                                this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                                this.offset -= len;
                                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                                this.match = this.match.substr(0, this.match.length - 1);
                                this.matched = this.matched.substr(0, this.matched.length - 1);
                                if (lines.length - 1) {
                                    this.yylineno -= lines.length - 1;
                                }
                                var r = this.yylloc.range;
                                this.yylloc = {
                                    first_line: this.yylloc.first_line,
                                    last_line: this.yylineno + 1,
                                    first_column: this.yylloc.first_column,
                                    last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                                };
                                if (this.options.ranges) {
                                    this.yylloc.range = [ r[0], r[0] + this.yyleng - len ];
                                }
                                this.yyleng = this.yytext.length;
                                return this;
                            },
                            more: function() {
                                this._more = true;
                                return this;
                            },
                            reject: function() {
                                if (this.options.backtrack_lexer) {
                                    this._backtrack = true;
                                } else {
                                    return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n" + this.showPosition(), {
                                        text: "",
                                        token: null,
                                        line: this.yylineno
                                    });
                                }
                                return this;
                            },
                            less: function(n) {
                                this.unput(this.match.slice(n));
                            },
                            pastInput: function() {
                                var past = this.matched.substr(0, this.matched.length - this.match.length);
                                return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
                            },
                            upcomingInput: function() {
                                var next = this.match;
                                if (next.length < 20) {
                                    next += this._input.substr(0, 20 - next.length);
                                }
                                return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
                            },
                            showPosition: function() {
                                var pre = this.pastInput();
                                var c = new Array(pre.length + 1).join("-");
                                return pre + this.upcomingInput() + "\n" + c + "^";
                            },
                            test_match: function(match, indexed_rule) {
                                var token, lines, backup;
                                if (this.options.backtrack_lexer) {
                                    backup = {
                                        yylineno: this.yylineno,
                                        yylloc: {
                                            first_line: this.yylloc.first_line,
                                            last_line: this.last_line,
                                            first_column: this.yylloc.first_column,
                                            last_column: this.yylloc.last_column
                                        },
                                        yytext: this.yytext,
                                        match: this.match,
                                        matches: this.matches,
                                        matched: this.matched,
                                        yyleng: this.yyleng,
                                        offset: this.offset,
                                        _more: this._more,
                                        _input: this._input,
                                        yy: this.yy,
                                        conditionStack: this.conditionStack.slice(0),
                                        done: this.done
                                    };
                                    if (this.options.ranges) {
                                        backup.yylloc.range = this.yylloc.range.slice(0);
                                    }
                                }
                                lines = match[0].match(/(?:\r\n?|\n).*/g);
                                if (lines) {
                                    this.yylineno += lines.length;
                                }
                                this.yylloc = {
                                    first_line: this.yylloc.last_line,
                                    last_line: this.yylineno + 1,
                                    first_column: this.yylloc.last_column,
                                    last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
                                };
                                this.yytext += match[0];
                                this.match += match[0];
                                this.matches = match;
                                this.yyleng = this.yytext.length;
                                if (this.options.ranges) {
                                    this.yylloc.range = [ this.offset, this.offset += this.yyleng ];
                                }
                                this._more = false;
                                this._backtrack = false;
                                this._input = this._input.slice(match[0].length);
                                this.matched += match[0];
                                token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
                                if (this.done && this._input) {
                                    this.done = false;
                                }
                                if (token) {
                                    return token;
                                } else if (this._backtrack) {
                                    for (var k in backup) {
                                        this[k] = backup[k];
                                    }
                                    return false;
                                }
                                return false;
                            },
                            next: function() {
                                if (this.done) {
                                    return this.EOF;
                                }
                                if (!this._input) {
                                    this.done = true;
                                }
                                var token, match, tempMatch, index;
                                if (!this._more) {
                                    this.yytext = "";
                                    this.match = "";
                                }
                                var rules = this._currentRules();
                                for (var i = 0; i < rules.length; i++) {
                                    tempMatch = this._input.match(this.rules[rules[i]]);
                                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                                        match = tempMatch;
                                        index = i;
                                        if (this.options.backtrack_lexer) {
                                            token = this.test_match(tempMatch, rules[i]);
                                            if (token !== false) {
                                                return token;
                                            } else if (this._backtrack) {
                                                match = false;
                                                continue;
                                            } else {
                                                return false;
                                            }
                                        } else if (!this.options.flex) {
                                            break;
                                        }
                                    }
                                }
                                if (match) {
                                    token = this.test_match(match, rules[index]);
                                    if (token !== false) {
                                        return token;
                                    }
                                    return false;
                                }
                                if (this._input === "") {
                                    return this.EOF;
                                } else {
                                    return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
                                        text: "",
                                        token: null,
                                        line: this.yylineno
                                    });
                                }
                            },
                            lex: function lex() {
                                var r = this.next();
                                if (r) {
                                    return r;
                                } else {
                                    return this.lex();
                                }
                            },
                            begin: function begin(condition) {
                                this.conditionStack.push(condition);
                            },
                            popState: function popState() {
                                var n = this.conditionStack.length - 1;
                                if (n > 0) {
                                    return this.conditionStack.pop();
                                } else {
                                    return this.conditionStack[0];
                                }
                            },
                            _currentRules: function _currentRules() {
                                if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
                                    return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
                                } else {
                                    return this.conditions["INITIAL"].rules;
                                }
                            },
                            topState: function topState(n) {
                                n = this.conditionStack.length - 1 - Math.abs(n || 0);
                                if (n >= 0) {
                                    return this.conditionStack[n];
                                } else {
                                    return "INITIAL";
                                }
                            },
                            pushState: function pushState(condition) {
                                this.begin(condition);
                            },
                            stateStackSize: function stateStackSize() {
                                return this.conditionStack.length;
                            },
                            options: {},
                            performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
                                var YYSTATE = YY_START;
                                switch ($avoiding_name_collisions) {
                                  case 0:
                                    break;

                                  case 1:
                                    return 6;
                                    break;

                                  case 2:
                                    yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2);
                                    return 4;
                                    break;

                                  case 3:
                                    return 17;
                                    break;

                                  case 4:
                                    return 18;
                                    break;

                                  case 5:
                                    return 23;
                                    break;

                                  case 6:
                                    return 24;
                                    break;

                                  case 7:
                                    return 22;
                                    break;

                                  case 8:
                                    return 21;
                                    break;

                                  case 9:
                                    return 10;
                                    break;

                                  case 10:
                                    return 11;
                                    break;

                                  case 11:
                                    return 8;
                                    break;

                                  case 12:
                                    return 14;
                                    break;

                                  case 13:
                                    return "INVALID";
                                    break;
                                }
                            },
                            rules: [ /^(?:\s+)/, /^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/, /^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/, /^(?:\{)/, /^(?:\})/, /^(?:\[)/, /^(?:\])/, /^(?:,)/, /^(?::)/, /^(?:true\b)/, /^(?:false\b)/, /^(?:null\b)/, /^(?:$)/, /^(?:.)/ ],
                            conditions: {
                                INITIAL: {
                                    rules: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ],
                                    inclusive: true
                                }
                            }
                        };
                        return lexer;
                    }();
                    parser.lexer = lexer;
                    function Parser() {
                        this.yy = {};
                    }
                    Parser.prototype = parser;
                    parser.Parser = Parser;
                    return new Parser();
                }();
                if (typeof _dereq_ !== "undefined" && typeof exports !== "undefined") {
                    exports.parser = jsonlint;
                    exports.Parser = jsonlint.Parser;
                    exports.parse = function() {
                        return jsonlint.parse.apply(jsonlint, arguments);
                    };
                    exports.main = function commonjsMain(args) {
                        if (!args[1]) {
                            console.log("Usage: " + args[0] + " FILE");
                            process.exit(1);
                        }
                        var source = _dereq_("fs").readFileSync(_dereq_("path").normalize(args[1]), "utf8");
                        return exports.parser.parse(source);
                    };
                    if (typeof module !== "undefined" && _dereq_.main === module) {
                        exports.main(process.argv.slice(1));
                    }
                }
            }).call(this, _dereq_("UPikzY"));
        }, {
            UPikzY: 5,
            fs: 3,
            path: 4
        } ],
        3: [ function(_dereq_, module, exports) {}, {} ],
        4: [ function(_dereq_, module, exports) {
            (function(process) {
                function normalizeArray(parts, allowAboveRoot) {
                    var up = 0;
                    for (var i = parts.length - 1; i >= 0; i--) {
                        var last = parts[i];
                        if (last === ".") {
                            parts.splice(i, 1);
                        } else if (last === "..") {
                            parts.splice(i, 1);
                            up++;
                        } else if (up) {
                            parts.splice(i, 1);
                            up--;
                        }
                    }
                    if (allowAboveRoot) {
                        for (;up--; up) {
                            parts.unshift("..");
                        }
                    }
                    return parts;
                }
                var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                var splitPath = function(filename) {
                    return splitPathRe.exec(filename).slice(1);
                };
                exports.resolve = function() {
                    var resolvedPath = "", resolvedAbsolute = false;
                    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                        var path = i >= 0 ? arguments[i] : process.cwd();
                        if (typeof path !== "string") {
                            throw new TypeError("Arguments to path.resolve must be strings");
                        } else if (!path) {
                            continue;
                        }
                        resolvedPath = path + "/" + resolvedPath;
                        resolvedAbsolute = path.charAt(0) === "/";
                    }
                    resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function(p) {
                        return !!p;
                    }), !resolvedAbsolute).join("/");
                    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
                };
                exports.normalize = function(path) {
                    var isAbsolute = exports.isAbsolute(path), trailingSlash = substr(path, -1) === "/";
                    path = normalizeArray(filter(path.split("/"), function(p) {
                        return !!p;
                    }), !isAbsolute).join("/");
                    if (!path && !isAbsolute) {
                        path = ".";
                    }
                    if (path && trailingSlash) {
                        path += "/";
                    }
                    return (isAbsolute ? "/" : "") + path;
                };
                exports.isAbsolute = function(path) {
                    return path.charAt(0) === "/";
                };
                exports.join = function() {
                    var paths = Array.prototype.slice.call(arguments, 0);
                    return exports.normalize(filter(paths, function(p, index) {
                        if (typeof p !== "string") {
                            throw new TypeError("Arguments to path.join must be strings");
                        }
                        return p;
                    }).join("/"));
                };
                exports.relative = function(from, to) {
                    from = exports.resolve(from).substr(1);
                    to = exports.resolve(to).substr(1);
                    function trim(arr) {
                        var start = 0;
                        for (;start < arr.length; start++) {
                            if (arr[start] !== "") break;
                        }
                        var end = arr.length - 1;
                        for (;end >= 0; end--) {
                            if (arr[end] !== "") break;
                        }
                        if (start > end) return [];
                        return arr.slice(start, end - start + 1);
                    }
                    var fromParts = trim(from.split("/"));
                    var toParts = trim(to.split("/"));
                    var length = Math.min(fromParts.length, toParts.length);
                    var samePartsLength = length;
                    for (var i = 0; i < length; i++) {
                        if (fromParts[i] !== toParts[i]) {
                            samePartsLength = i;
                            break;
                        }
                    }
                    var outputParts = [];
                    for (var i = samePartsLength; i < fromParts.length; i++) {
                        outputParts.push("..");
                    }
                    outputParts = outputParts.concat(toParts.slice(samePartsLength));
                    return outputParts.join("/");
                };
                exports.sep = "/";
                exports.delimiter = ":";
                exports.dirname = function(path) {
                    var result = splitPath(path), root = result[0], dir = result[1];
                    if (!root && !dir) {
                        return ".";
                    }
                    if (dir) {
                        dir = dir.substr(0, dir.length - 1);
                    }
                    return root + dir;
                };
                exports.basename = function(path, ext) {
                    var f = splitPath(path)[2];
                    if (ext && f.substr(-1 * ext.length) === ext) {
                        f = f.substr(0, f.length - ext.length);
                    }
                    return f;
                };
                exports.extname = function(path) {
                    return splitPath(path)[3];
                };
                function filter(xs, f) {
                    if (xs.filter) return xs.filter(f);
                    var res = [];
                    for (var i = 0; i < xs.length; i++) {
                        if (f(xs[i], i, xs)) res.push(xs[i]);
                    }
                    return res;
                }
                var substr = "ab".substr(-1) === "b" ? function(str, start, len) {
                    return str.substr(start, len);
                } : function(str, start, len) {
                    if (start < 0) start = str.length + start;
                    return str.substr(start, len);
                };
            }).call(this, _dereq_("UPikzY"));
        }, {
            UPikzY: 5
        } ],
        5: [ function(_dereq_, module, exports) {
            var process = module.exports = {};
            process.nextTick = function() {
                var canSetImmediate = typeof window !== "undefined" && window.setImmediate;
                var canPost = typeof window !== "undefined" && window.postMessage && window.addEventListener;
                if (canSetImmediate) {
                    return function(f) {
                        return window.setImmediate(f);
                    };
                }
                if (canPost) {
                    var queue = [];
                    window.addEventListener("message", function(ev) {
                        var source = ev.source;
                        if ((source === window || source === null) && ev.data === "process-tick") {
                            ev.stopPropagation();
                            if (queue.length > 0) {
                                var fn = queue.shift();
                                fn();
                            }
                        }
                    }, true);
                    return function nextTick(fn) {
                        queue.push(fn);
                        window.postMessage("process-tick", "*");
                    };
                }
                return function nextTick(fn) {
                    setTimeout(fn, 0);
                };
            }();
            process.title = "browser";
            process.browser = true;
            process.env = {};
            process.argv = [];
            function noop() {}
            process.on = noop;
            process.addListener = noop;
            process.once = noop;
            process.off = noop;
            process.removeListener = noop;
            process.removeAllListeners = noop;
            process.emit = noop;
            process.binding = function(name) {
                throw new Error("process.binding is not supported");
            };
            process.cwd = function() {
                return "/";
            };
            process.chdir = function(dir) {
                throw new Error("process.chdir is not supported");
            };
        }, {} ]
    }, {}, [ 1 ])(1);
});

(function() {
    var _global = this;
    var _rng;
    if (typeof _global.require == "function") {
        try {
            var _rb = _global.require("crypto").randomBytes;
            _rng = _rb && function() {
                return _rb(16);
            };
        } catch (e) {}
    }
    if (!_rng && _global.crypto && crypto.getRandomValues) {
        var _rnds8 = new Uint8Array(16);
        _rng = function whatwgRNG() {
            crypto.getRandomValues(_rnds8);
            return _rnds8;
        };
    }
    if (!_rng) {
        var _rnds = new Array(16);
        _rng = function() {
            for (var i = 0, r; i < 16; i++) {
                if ((i & 3) === 0) r = Math.random() * 4294967296;
                _rnds[i] = r >>> ((i & 3) << 3) & 255;
            }
            return _rnds;
        };
    }
    var BufferClass = typeof _global.Buffer == "function" ? _global.Buffer : Array;
    var _byteToHex = [];
    var _hexToByte = {};
    for (var i = 0; i < 256; i++) {
        _byteToHex[i] = (i + 256).toString(16).substr(1);
        _hexToByte[_byteToHex[i]] = i;
    }
    function parse(s, buf, offset) {
        var i = buf && offset || 0, ii = 0;
        buf = buf || [];
        s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
            if (ii < 16) {
                buf[i + ii++] = _hexToByte[oct];
            }
        });
        while (ii < 16) {
            buf[i + ii++] = 0;
        }
        return buf;
    }
    function unparse(buf, offset) {
        var i = offset || 0, bth = _byteToHex;
        return bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]];
    }
    var _seedBytes = _rng();
    var _nodeId = [ _seedBytes[0] | 1, _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5] ];
    var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 16383;
    var _lastMSecs = 0, _lastNSecs = 0;
    function v1(options, buf, offset) {
        var i = buf && offset || 0;
        var b = buf || [];
        options = options || {};
        var clockseq = options.clockseq != null ? options.clockseq : _clockseq;
        var msecs = options.msecs != null ? options.msecs : new Date().getTime();
        var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;
        var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
        if (dt < 0 && options.clockseq == null) {
            clockseq = clockseq + 1 & 16383;
        }
        if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
            nsecs = 0;
        }
        if (nsecs >= 1e4) {
            throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
        }
        _lastMSecs = msecs;
        _lastNSecs = nsecs;
        _clockseq = clockseq;
        msecs += 122192928e5;
        var tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
        b[i++] = tl >>> 24 & 255;
        b[i++] = tl >>> 16 & 255;
        b[i++] = tl >>> 8 & 255;
        b[i++] = tl & 255;
        var tmh = msecs / 4294967296 * 1e4 & 268435455;
        b[i++] = tmh >>> 8 & 255;
        b[i++] = tmh & 255;
        b[i++] = tmh >>> 24 & 15 | 16;
        b[i++] = tmh >>> 16 & 255;
        b[i++] = clockseq >>> 8 | 128;
        b[i++] = clockseq & 255;
        var node = options.node || _nodeId;
        for (var n = 0; n < 6; n++) {
            b[i + n] = node[n];
        }
        return buf ? buf : unparse(b);
    }
    function v4(options, buf, offset) {
        var i = buf && offset || 0;
        if (typeof options == "string") {
            buf = options == "binary" ? new BufferClass(16) : null;
            options = null;
        }
        options = options || {};
        var rnds = options.random || (options.rng || _rng)();
        rnds[6] = rnds[6] & 15 | 64;
        rnds[8] = rnds[8] & 63 | 128;
        if (buf) {
            for (var ii = 0; ii < 16; ii++) {
                buf[i + ii] = rnds[ii];
            }
        }
        return buf || unparse(rnds);
    }
    var uuid = v4;
    uuid.v1 = v1;
    uuid.v4 = v4;
    uuid.parse = parse;
    uuid.unparse = unparse;
    uuid.BufferClass = BufferClass;
    if (typeof define === "function" && define.amd) {
        define(function() {
            return uuid;
        });
    } else if (typeof module != "undefined" && module.exports) {
        module.exports = uuid;
    } else {
        var _previousRoot = _global.uuid;
        uuid.noConflict = function() {
            _global.uuid = _previousRoot;
            return uuid;
        };
        _global.uuid = uuid;
    }
}).call(this);

(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f();
    } else if (typeof define === "function" && define.amd) {
        define([], f);
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window;
        } else if (typeof global !== "undefined") {
            g = global;
        } else if (typeof self !== "undefined") {
            g = self;
        } else {
            g = this;
        }
        g.tokml = f();
    }
})(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f;
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }({
        1: [ function(require, module, exports) {
            var strxml = require("strxml"), tag = strxml.tag, encode = strxml.encode;
            module.exports = function tokml(geojson, options) {
                options = options || {
                    documentName: undefined,
                    documentDescription: undefined,
                    name: "name",
                    description: "description",
                    simplestyle: false,
                    timestamp: "timestamp"
                };
                return '<?xml version="1.0" encoding="UTF-8"?>' + tag("kml", tag("Document", documentName(options) + documentDescription(options) + root(geojson, options)), [ [ "xmlns", "http://www.opengis.net/kml/2.2" ] ]);
            };
            function feature(options) {
                return function(_) {
                    var styleDefinition = "", styleReference = "";
                    if (options.simplestyle && hasStyle(_.properties)) {
                        styleDefinition = iconstyle(_.properties);
                        styleReference = tag("styleUrl", "#" + iconHash(_.properties));
                    }
                    if (!_.properties || !geometry.valid(_.geometry)) return "";
                    var geometryString = geometry.any(_.geometry);
                    if (!geometryString) return "";
                    return styleDefinition + tag("Placemark", name(_.properties, options) + description(_.properties, options) + extendeddata(_.properties) + timestamp(_.properties, options) + geometryString + styleReference);
                };
            }
            function root(_, options) {
                if (!_.type) return "";
                switch (_.type) {
                  case "FeatureCollection":
                    if (!_.features) return "";
                    return _.features.map(feature(options)).join("");

                  case "Feature":
                    return feature(options)(_);

                  default:
                    return feature(options)({
                        type: "Feature",
                        geometry: _,
                        properties: {}
                    });
                }
            }
            function documentName(options) {
                return options.documentName !== undefined ? tag("name", options.documentName) : "";
            }
            function documentDescription(options) {
                return options.documentDescription !== undefined ? tag("description", options.documentDescription) : "";
            }
            function name(_, options) {
                return _[options.name] ? tag("name", encode(_[options.name])) : "";
            }
            function description(_, options) {
                return _[options.description] ? tag("description", encode(_[options.description])) : "";
            }
            function timestamp(_, options) {
                return _[options.timestamp] ? tag("TimeStamp", tag("when", encode(_[options.timestamp]))) : "";
            }
            var geometry = {
                Point: function(_) {
                    return tag("Point", tag("coordinates", _.coordinates.join(",")));
                },
                LineString: function(_) {
                    return tag("LineString", tag("coordinates", linearring(_.coordinates)));
                },
                Polygon: function(_) {
                    if (!_.coordinates.length) return "";
                    var outer = _.coordinates[0], inner = _.coordinates.slice(1), outerRing = tag("outerBoundaryIs", tag("LinearRing", tag("coordinates", linearring(outer)))), innerRings = inner.map(function(i) {
                        return tag("innerBoundaryIs", tag("LinearRing", tag("coordinates", linearring(i))));
                    }).join("");
                    return tag("Polygon", outerRing + innerRings);
                },
                MultiPoint: function(_) {
                    if (!_.coordinates.length) return "";
                    return tag("MultiGeometry", _.coordinates.map(function(c) {
                        return geometry.Point({
                            coordinates: c
                        });
                    }).join(""));
                },
                MultiPolygon: function(_) {
                    if (!_.coordinates.length) return "";
                    return tag("MultiGeometry", _.coordinates.map(function(c) {
                        return geometry.Polygon({
                            coordinates: c
                        });
                    }).join(""));
                },
                MultiLineString: function(_) {
                    if (!_.coordinates.length) return "";
                    return tag("MultiGeometry", _.coordinates.map(function(c) {
                        return geometry.LineString({
                            coordinates: c
                        });
                    }).join(""));
                },
                GeometryCollection: function(_) {
                    return tag("MultiGeometry", _.geometries.map(geometry.any).join(""));
                },
                valid: function(_) {
                    return _ && _.type && (_.coordinates || _.type === "GeometryCollection" && _.geometries.every(geometry.valid));
                },
                any: function(_) {
                    if (geometry[_.type]) {
                        return geometry[_.type](_);
                    } else {
                        return "";
                    }
                }
            };
            function linearring(_) {
                return _.map(function(cds) {
                    return cds.join(",");
                }).join(" ");
            }
            function extendeddata(_) {
                return tag("ExtendedData", pairs(_).map(data).join(""));
            }
            function data(_) {
                return tag("Data", tag("value", encode(_[1])), [ [ "name", encode(_[0]) ] ]);
            }
            function iconstyle(_) {
                return tag("Style", tag("IconStyle", tag("Icon", tag("href", iconUrl(_)))) + iconSize(_), [ [ "id", iconHash(_) ] ]);
            }
            function iconUrl(_) {
                var size = _["marker-size"] || "medium", symbol = _["marker-symbol"] ? "-" + _["marker-symbol"] : "", color = (_["marker-color"] || "7e7e7e").replace("#", "");
                return "https://api.tiles.mapbox.com/v3/marker/" + "pin-" + size.charAt(0) + symbol + "+" + color + ".png";
            }
            function iconSize(_) {
                return tag("hotSpot", "", [ [ "xunits", "fraction" ], [ "yunits", "fraction" ], [ "x", .5 ], [ "y", .5 ] ]);
            }
            function hasStyle(_) {
                return !!(_["marker-size"] || _["marker-symbol"] || _["marker-color"]);
            }
            function iconHash(_) {
                return (_["marker-symbol"] || "") + (_["marker-color"] || "").replace("#", "") + (_["marker-size"] || "");
            }
            function pairs(_) {
                var o = [];
                for (var i in _) o.push([ i, _[i] ]);
                return o;
            }
        }, {
            strxml: 2
        } ],
        2: [ function(require, module, exports) {
            module.exports.attr = attr;
            module.exports.tagClose = tagClose;
            module.exports.tag = tag;
            module.exports.encode = encode;
            function attr(_) {
                return _ && _.length ? " " + _.map(function(a) {
                    return a[0] + '="' + a[1] + '"';
                }).join(" ") : "";
            }
            function tagClose(el, attributes) {
                return "<" + el + attr(attributes) + "/>";
            }
            function tag(el, contents, attributes) {
                return "<" + el + attr(attributes) + ">" + contents + "</" + el + ">";
            }
            function encode(_) {
                return (_ === null ? "" : _.toString()).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
            }
        }, {} ]
    }, {}, [ 1 ])(1);
});

"use strict";

angular.module("farmbuild.farmdata", [ "farmbuild.core" ]);

window.farmbuild.farmdata = {};

angular.injector([ "ng", "farmbuild.farmdata" ]);

"use strict";

angular.module("farmbuild.farmdata").factory("farmdataConverter", function(validations, $log, $filter, farmdataValidator) {
    var _isDefined = validations.isDefined, farmdataConverter = {};
    function createFeatureCollection(geometry) {}
    function convertToGeoJsonGeometry(geometry, crs) {
        geometry.crs = {
            type: "name",
            properties: {
                name: crs
            }
        };
        return geometry;
    }
    function convertToFarmDataGeometry(geometry) {
        geometry.crs = geometry.crs.properties.name;
        return geometry;
    }
    farmdataConverter.convertToFarmDataGeometry = convertToFarmDataGeometry;
    function createFeature(geoJsonGeometry, name, id, type, comment, area, group) {
        var properties;
        if (_isDefined(type) || _isDefined(comment) || _isDefined(area) || _isDefined(group)) {
            properties = {
                name: name,
                _id: id,
                type: type,
                comment: comment,
                area: area,
                group: group
            };
        } else {
            properties = {
                name: name,
                _id: id
            };
        }
        return {
            type: "Feature",
            geometry: angular.copy(geoJsonGeometry),
            properties: properties
        };
    }
    farmdataConverter.createFeature = createFeature;
    function toGeoJsons(farmData) {
        $log.info("Extracting farm and paddocks geometry from farmData ...");
        var copied = angular.copy(farmData);
        var farmGeometry = copied.geometry, paddocks = [];
        copied.paddocks.forEach(function(paddock) {
            paddocks.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock._id, paddock.type, paddock.comment, paddock.area, paddock.group));
        });
        return {
            farm: {
                type: "FeatureCollection",
                features: [ createFeature(convertToGeoJsonGeometry(farmGeometry, farmGeometry.crs), copied.name) ]
            },
            paddocks: {
                type: "FeatureCollection",
                features: paddocks
            }
        };
    }
    farmdataConverter.toGeoJsons = toGeoJsons;
    function toGeoJson(farmData) {
        $log.info("Extracting farm and paddocks geometry from farmData ...");
        var copied = angular.copy(farmData);
        if (!farmdataValidator.validate(copied)) {
            return undefined;
        }
        var farmGeometry = copied.geometry, features = [];
        features.push(createFeature(convertToGeoJsonGeometry(farmGeometry, farmGeometry.crs), copied.name, copied.id));
        copied.paddocks.forEach(function(paddock) {
            features.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock._id, paddock.type, paddock.comment, paddock.area, paddock.group));
        });
        return {
            type: "FeatureCollection",
            features: features
        };
    }
    farmdataConverter.toGeoJson = toGeoJson;
    function exportGeoJson(document, farmData) {
        var a = document.createElement("a"), name = "farmdata-" + farmData.name.replace(/\W+/g, "") + "-" + $filter("date")(new Date(), "yyyyMMddHHmmss") + ".json";
        a.id = "downloadFarmData123456";
        document.body.appendChild(a);
        angular.element(a).attr({
            download: name,
            href: "data:application/json;charset=utf8," + encodeURIComponent(JSON.stringify(toGeoJson(farmData), undefined, 2))
        });
        a.click();
    }
    farmdataConverter.exportGeoJson = exportGeoJson;
    function toKml(farmData) {
        $log.info("Extracting farm and paddocks geometry from farmData ...");
        var copied = angular.copy(farmData);
        if (!farmdataValidator.validate(copied)) {
            return undefined;
        }
        var farmGeometry = copied.geometry, features = [];
        features.push(createFeature(convertToGeoJsonGeometry(farmGeometry, farmGeometry.crs), copied.name, copied.id));
        copied.paddocks.forEach(function(paddock) {
            features.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock._id, paddock.type, paddock.comment, paddock.area, paddock.group));
        });
        return tokml(JSON.parse(JSON.stringify({
            type: "FeatureCollection",
            features: features
        })));
    }
    farmdataConverter.toKml = toKml;
    function exportKml(document, farmData) {
        var a = document.createElement("a"), name = "farmdata-" + farmData.name.replace(/\W+/g, "") + "-" + $filter("date")(new Date(), "yyyyMMddHHmmss") + ".kml";
        a.id = "downloadFarmData123456";
        document.body.appendChild(a);
        angular.element(a).attr({
            download: name,
            href: "data:application/vnd.google-earth.kml+xml;charset=utf8," + toKml(farmData)
        });
        a.click();
    }
    farmdataConverter.exportKml = exportKml;
    function toFarmData(farmData, geoJsons) {
        $log.info("Converting geoJsons.farm.features[0] and paddocks geojson to farmData ...");
        var farmFeature = geoJsons.farm.features[0];
        farmData.geometry = convertToFarmDataGeometry(farmFeature.geometry);
        farmData = farmdataPaddocks.merge(farmData, geoJsons);
        return farmData;
    }
    farmdataConverter.toFarmData = toFarmData;
    return farmdataConverter;
});

"use strict";

angular.module("farmbuild.farmdata").factory("farmdata", function($log, farmdataSession, farmdataValidator, farmdataPaddocks, crsSupported, validations) {
    var farmdata = {
        session: farmdataSession,
        validator: farmdataValidator,
        crsSupported: crsSupported
    }, isEmpty = validations.isEmpty, defaults = {
        id: "" + new Date().getTime(),
        name: "My new farm",
        geometry: {
            type: "Polygon",
            crs: crsSupported[0].name,
            coordinates: []
        }
    }, geometry = function(projectionName) {
        var g = angular.copy(defaults.geometry);
        g.crs = !isEmpty(projectionName) ? projectionName : g.crs;
        return g;
    }, create = function(name, id, projectionName) {
        return {
            version: 1,
            dateCreated: new Date(),
            dateLastUpdated: new Date(),
            id: isEmpty(id) ? defaults.id : id,
            name: isEmpty(name) ? defaults.name : name,
            geometry: geometry(projectionName),
            paddocks: [],
            area: 0,
            areaUnit: "hectare"
        };
    };
    farmdata.defaultValues = function() {
        return angular.copy(defaults);
    };
    farmdata.isFarmData = function(farmData) {
        return farmdataValidator.validate(farmData);
    };
    farmdata.validate = function(farmData) {
        return farmdataValidator.validate(farmData);
    };
    farmdata.create = create;
    farmdata.load = farmdataSession.load;
    farmdata.find = farmdataSession.find;
    farmdata.save = function(farmData) {
        return farmdataSession.save(farmData).find();
    };
    farmdata.update = function(farmData) {
        return farmdataSession.update(farmData).find();
    };
    farmdata.merge = function(farmData, geoJsons) {
        var merged = farmdataSession.merge(farmData, geoJsons);
        if (merged) {
            return merged.find();
        } else {
            return farmData;
        }
    };
    window.farmbuild.farmdata = farmdata;
    return farmdata;
});

"use strict";

angular.module("farmbuild.farmdata").factory("farmdataPaddocks", function($log, collections, validations, farmdataPaddockValidator, farmdataConverter) {
    var farmdataPaddocks = {}, _isDefined = validations.isDefined;
    function createName() {
        return "Paddock " + new Date().getTime();
    }
    function generateId() {
        return new Date().getTime();
    }
    function createPaddockFeature(geoJsonGeometry) {
        return farmdataConverter.createFeature(geoJsonGeometry, createName());
    }
    farmdataPaddocks.createPaddockFeature = createPaddockFeature;
    function createPaddock(paddockFeature, paddocksExisting, paddocksMerged) {
        var name = paddockFeature.properties.name, id = paddockFeature.properties._id;
        name = _isDefined(name) ? name : createName();
        id = _isDefined(id) ? id : generateId();
        if (!farmdataPaddockValidator.validateFeature(paddockFeature, paddocksExisting) || !farmdataPaddockValidator.validateFeature(paddockFeature, paddocksMerged)) {
            $log.error("creating new paddock failed, paddock data is invalid", paddockFeature);
            return;
        }
        return {
            name: name,
            _id: id,
            comment: paddockFeature.properties.comment,
            type: paddockFeature.properties.type,
            area: paddockFeature.properties.area,
            group: paddockFeature.properties.group,
            geometry: farmdataConverter.convertToFarmDataGeometry(paddockFeature.geometry),
            dateLastUpdated: new Date()
        };
    }
    farmdataPaddocks.createPaddock = createPaddock;
    function findPaddock(paddock, paddocks) {
        var found;
        if (!paddock.properties._id) {
            return;
        }
        paddocks.forEach(function(p) {
            if (paddock.properties._id === p._id) {
                found = p;
            }
        });
        return found;
    }
    farmdataPaddocks.findPaddock = findPaddock;
    function updatePaddock(paddockFeature, paddocksExisting, paddocksMerged) {
        var toUpdate = angular.copy(findPaddock(paddockFeature, paddocksExisting));
        if (!farmdataPaddockValidator.validateFeature(paddockFeature, paddocksExisting) || !farmdataPaddockValidator.validateFeature(paddockFeature, paddocksMerged)) {
            $log.error("updating paddock failed, paddock data is invalid", paddockFeature);
            return;
        }
        toUpdate.name = paddockFeature.properties.name;
        toUpdate.comment = paddockFeature.properties.comment;
        toUpdate.type = paddockFeature.properties.type;
        toUpdate.area = paddockFeature.properties.area;
        toUpdate.group = paddockFeature.properties.group;
        toUpdate.geometry = farmdataConverter.convertToFarmDataGeometry(paddockFeature.geometry);
        toUpdate.dateLastUpdated = new Date();
        return toUpdate;
    }
    farmdataPaddocks.updatePaddock = updatePaddock;
    function isNew(paddockFeature) {
        return !_isDefined(paddockFeature.properties._id);
    }
    function merge(paddockFeature, paddocksExisting, paddocksMerged) {
        if (isNew(paddockFeature)) {
            return createPaddock(paddockFeature, paddocksExisting, paddocksMerged);
        }
        return updatePaddock(paddockFeature, paddocksExisting, paddocksMerged);
    }
    function createPaddockGroup(name) {
        return {
            name: name,
            paddocks: []
        };
    }
    function findPaddockGroup(name, paddockGroups) {
        var found;
        paddockGroups.forEach(function(paddockGroup) {
            if (paddockGroup.name === name) {
                found = paddockGroup;
            }
        });
        return found;
    }
    farmdataPaddocks.merge = function(farmData, geoJsons) {
        var paddockFeatures = geoJsons.paddocks, paddocksExisting = farmData.paddocks, paddocksMerged = [], paddockGroups = [], failed = false;
        paddockFeatures.features.forEach(function(paddockFeature, i) {
            var merged = merge(paddockFeature, paddocksExisting, paddocksMerged);
            if (!_isDefined(merged)) {
                $log.error("merging paddocks failed, paddocks data is invalid", paddockFeature, paddocksExisting);
                failed = true;
            }
            paddocksMerged.push(merged);
            if (paddockFeature.properties.group) {
                var paddockGroup = findPaddockGroup(paddockFeature.properties.group, paddockGroups);
                if (!_isDefined(paddockGroup)) {
                    paddockGroup = createPaddockGroup(paddockFeature.properties.group);
                    paddockGroups.push(paddockGroup);
                }
                paddockGroup.paddocks.push(paddockFeature.properties.name);
            }
        });
        farmData.paddocks = paddocksMerged;
        farmData.paddockGroups = paddockGroups;
        if (!failed) {
            return farmData;
        }
    };
    return farmdataPaddocks;
});

"use strict";

angular.module("farmbuild.farmdata").factory("farmdataPaddockValidator", function(validations, $log) {
    var farmdataPaddockValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty;
    function _validateFeature(paddock, paddocksExisting) {
        $log.info("validating paddock...", paddock);
        if (!_isDefined(paddock) || !_isDefined(paddock.properties) || !_isDefined(paddock.properties.name) || !_isDefined(paddock.geometry)) {
            $log.error("invalid paddock, must have name and geometry: %j", paddock);
            return false;
        }
        if (!checkName(paddock.properties.name, paddock.properties._id, paddocksExisting)) {
            return false;
        }
        return true;
    }
    function _validate(paddock, paddocksExisting) {
        $log.info("validating paddock...", paddock);
        if (!_isDefined(paddock) || !_isDefined(paddock.name) || !_isDefined(paddock.geometry)) {
            $log.error("invalid paddock, must have name and geometry: %j", paddock);
            return false;
        }
        if (!checkName(paddock.name, paddock._id, paddocksExisting)) {
            return false;
        }
        return true;
    }
    function checkName(name, id, paddocksExisting) {
        $log.info("checking paddock for duplicate name...", name);
        var result = true;
        paddocksExisting.forEach(function(paddockExisting) {
            if (name === paddockExisting.name && id !== paddockExisting._id) {
                $log.error("invalid paddock, name already exist: %s, %s, %j", name, id, paddockExisting);
                result = false;
            }
        });
        return result;
    }
    farmdataPaddockValidator.validateFeature = _validateFeature;
    farmdataPaddockValidator.validate = _validate;
    farmdataPaddockValidator.validateAll = function(items) {
        if (!_isArray(items) || _isEmpty(items)) {
            return false;
        }
        var i = 0;
        for (i; i < items.length; i++) {
            var item = items[i];
            if (!_validate(item)) {
                $log.error("validator invalid at %s: %j", i, item);
                return false;
            }
        }
        return true;
    };
    return farmdataPaddockValidator;
});

angular.module("farmbuild.farmdata").constant("crsSupported", [ {
    label: "GDA 94 Geographics: EPSG:4283",
    name: "EPSG:4283",
    projection: "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs"
}, {
    label: "WGS 84 Geographics: EPSG:4326",
    name: "EPSG:4326",
    projection: "+proj=longlat +datum=WGS84 +no_defs"
}, {
    label: "Web Mercator: EPSG:3857",
    name: "EPSG:3857",
    projection: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"
}, {
    label: "VicGrid 94: EPSG:3111",
    name: "EPSG:3111",
    projection: "+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
}, {
    label: "NSW Lamberts: EPSG:3308",
    name: "EPSG:3308",
    projection: "+proj=lcc +lat_1=-30.75 +lat_2=-35.75 +lat_0=-33.25 +lon_0=147 +x_0=9300000 +y_0=4500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
}, {
    label: "SA Lamberts: EPSG:3107",
    name: "EPSG:3107",
    projection: "+proj=lcc +lat_1=-28 +lat_2=-36 +lat_0=-32 +lon_0=135 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
}, {
    label: "Australian Albers: EPSG:3577",
    name: "EPSG:3577",
    projection: "+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=132 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
} ]);

"use strict";

angular.module("farmbuild.farmdata").factory("farmdataSession", function($log, $filter, farmdataValidator, farmdataConverter, farmdataPaddocks, validations) {
    var farmdataSession = {}, isDefined = validations.isDefined;
    function merge(farmData, geoJsons) {
        $log.info("Merging geoJsons.farm.features[0] and paddocks geojson to farmData ...");
        var farmFeature = geoJsons.farm.features[0], paddocks = geoJsons.paddocks;
        farmData.geometry = farmdataConverter.convertToFarmDataGeometry(farmFeature.geometry);
        var farmDataMerged = farmdataPaddocks.merge(farmData, geoJsons);
        if (farmDataMerged) {
            return farmdataSession.update(farmDataMerged);
        }
    }
    farmdataSession.merge = merge;
    farmdataSession.clear = function() {
        sessionStorage.clear();
        return farmdataSession;
    };
    farmdataSession.save = function(farmData) {
        $log.info("saving farmData");
        if (!farmdataValidator.validate(farmData)) {
            $log.error("Unable to save farmData... it is invalid");
            return farmdataSession;
        }
        sessionStorage.setItem("farmData", angular.toJson(farmData));
        return farmdataSession;
    };
    farmdataSession.update = function(farmData) {
        $log.info("update farmData");
        farmData.dateLastUpdated = new Date();
        farmdataSession.save(farmData);
        return farmdataSession;
    };
    farmdataSession.find = function() {
        var json = sessionStorage.getItem("farmData");
        if (json === null) {
            return undefined;
        }
        return angular.fromJson(json);
    };
    farmdataSession.load = function(farmData) {
        if (!farmdataValidator.validate(farmData)) {
            $log.error("Unable to load farmData... it is invalid");
            return undefined;
        }
        return farmdataSession.save(farmData).find();
    };
    farmdataSession.export = function(document, farmData) {
        var a = document.createElement("a"), name = "farmdata-" + farmData.name.replace(/\W+/g, "") + "-" + $filter("date")(new Date(), "yyyyMMddHHmmss") + ".json";
        a.id = "downloadFarmData123456";
        document.body.appendChild(a);
        angular.element(a).attr({
            download: name,
            href: "data:application/json;charset=utf8," + encodeURIComponent(JSON.stringify(farmData, undefined, 2))
        });
        a.click();
    };
    farmdataSession.isLoadFlagSet = function(location) {
        var load = false;
        if (location.href.split("?").length > 1 && location.href.split("?")[1].indexOf("load") === 0) {
            load = location.href.split("?")[1].split("=")[1].indexOf("true") > -1;
        }
        return load;
    };
    farmdataSession.setLoadFlag = function(location) {
        var path = farmdataSession.clearLoadFlag(location);
        return path + "?load=true";
    };
    farmdataSession.clearLoadFlag = function(location) {
        var path = location.href.toString(), path = path.substring(0, path.indexOf("?"));
        return path;
    };
    return farmdataSession;
});

"use strict";

"use strict";

angular.module("farmbuild.farmdata").factory("geoJsonValidator", function(validations, $log) {
    var geoJsonValidator = {
        geojsonhint: geojsonhint
    }, _isDefined = validations.isDefined, _isArray = validations.isArray, _isPositiveNumber = validations.isPositiveNumber, _isEmpty = validations.isEmpty;
    if (!_isDefined(geojsonhint)) {
        throw Error("geojsonhint must be available!");
    }
    function isGeoJsons(geoJsons) {
        var errors = geojsonhint.hint(typeof geoJsons === "string" ? geoJsons : angular.toJson(geoJsons)), isGeoJson = errors.length === 0;
        if (!isGeoJson) {
            $log.error("isGeoJsons errors: ", errors);
        }
        return isGeoJson;
    }
    geoJsonValidator.isGeoJsons = isGeoJsons;
    function _validate(farmData) {
        $log.info("validating farmData...", farmData);
        if (!_isDefined(farmData) || !_isDefined(farmData.geometry) || !_isDefined(farmData.geometry.crs) || !_isDefined(farmData.paddocks)) {
            $log.error("farmData must have geometry, geometry.crs, paddocks");
            return false;
        }
        return true;
    }
    geoJsonValidator.validate = _validate;
    return geoJsonValidator;
});

"use strict";

angular.module("farmbuild.core").factory("farmdataValidator", function(validations, $log, geoJsonValidator, farmdataPaddockValidator) {
    var farmdataValidator = {
        isGeoJsons: geoJsonValidator.isGeoJsons
    }, _isDefined = validations.isDefined, _isArray = validations.isArray, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isObject = validations.isObject, _isString = validations.isString, areaUnitDefault = "hectare";
    function errorLog() {}
    function _validate(farmData) {
        var hasInvalidPaddock = false;
        $log.info("validating farmData...");
        if (!_isDefined(farmData)) {
            $log.error("farmData is undefined.");
            return false;
        }
        if (!_isObject(farmData)) {
            $log.error("farmData must be a javascript Object.");
            return false;
        }
        if (!farmData.hasOwnProperty("name") || !_isString(farmData.name) || _isEmpty(farmData.name) || !_isDefined(farmData.area) || !_isPositiveNumberOrZero(farmData.area) || !angular.equals(farmData.areaUnit, areaUnitDefault)) {
            $log.error("farmData must have name, area (positve number or zero) and areaUnit (must be " + areaUnitDefault + "): %j", farmData);
            return false;
        }
        farmData.paddocks.forEach(function(paddock) {
            if (!farmdataPaddockValidator.validate(paddock, farmData.paddocks)) {
                $log.error("found invalid paddock in farmData", paddock);
                hasInvalidPaddock = true;
            }
        });
        if (!hasInvalidPaddock) {
            return geoJsonValidator.validate(farmData);
        } else {
            return false;
        }
    }
    farmdataValidator.validate = _validate;
    return farmdataValidator;
});