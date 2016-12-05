ace.define("ace/mode/pastel_highlight_rules", [
    "require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"
], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var pastelHighlightRules = function() {

        var builtinFunctions = ('define memoize lambda if');

        var keywords = ('');

        var buildinConstants = ("true false nil");

        var keywordMapper = this.createKeywordMapper({
            "keyword": keywords,
            "constant.language": buildinConstants,
            "support.function": builtinFunctions
        }, "identifier", false, " ");

        this.$rules = {
            "start": [
                {
                    token: "comment",
                    regex: "#.*$"
                }, {
                    token: "keyword", //parens
                    regex: "[\\(|\\)]"
                }, {
                    token: "keyword", //lists
                    regex: "[\\'\\(]"
                }, {
                    token: "keyword", //vectors
                    regex: "[\\[|\\]]"
                }, {
                    token: "keyword", //sets and maps
                    regex: "[\\{|\\}|\\#\\{|\\#\\}]"
                }, {
                    token: "keyword", // ampersands
                    regex: '[\\&]'
                }, {
                    token: "keyword", // metadata
                    regex: '[\\#\\^\\{]'
                }, {
                    token: "keyword", // anonymous fn syntactic sugar
                    regex: '[\\%]'
                }, {
                    token: "keyword", // deref reader macro
                    regex: '[@]'
                }, {
                    token: "constant.numeric", // hex
                    regex: "0[xX][0-9a-fA-F]+\\b"
                }, {
                    token: "constant.numeric", // float
                    regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
                }, {
                    token: keywordMapper,
                    regex: "[a-zA-Z_$][a-zA-Z0-9_$\\-]*\\b"
                }, {
                    token: "string", // single line
                    regex: '"',
                    next: "string"
                }, {
                    token: "constant", // symbol
                    regex: /:[^()\[\]{}'"\^%`,;\s]+/
                }, {
                    token: "string.regexp", //Regular Expressions
                    regex: '/#"(?:\\.|(?:\\")|[^""\n])*"/g'
                }

            ],
            "string": [
                {
                    token: "constant.language.escape",
                    regex: "\\\\.|\\\\$"
                }, {
                    token: "string",
                    regex: '[^"\\\\]+'
                }, {
                    token: "string",
                    regex: '"',
                    next: "start"
                }
            ]
        };
    };

    oop.inherits(pastelHighlightRules, TextHighlightRules);

    exports.pastelHighlightRules = pastelHighlightRules;
});

ace.define("ace/mode/matching_parens_outdent", [
    "require", "exports", "module", "ace/range"
], function(require, exports, module) {
    "use strict";

    var Range = require("../range").Range;

    var MatchingParensOutdent = function() {};

    (function() {

        this.checkOutdent = function(line, input) {
            if (!/^\s+$/.test(line))
                return false;

            return /^\s*\)/.test(input);
        };

        this.autoOutdent = function(doc, row) {
            var line = doc.getLine(row);
            var match = line.match(/^(\s*\))/);

            if (!match)
                return 0;

            var column = match[1].length;
            var openBracePos = doc.findMatchingBracket({row: row, column: column});

            if (!openBracePos || openBracePos.row == row)
                return 0;

            var indent = this.$getIndent(doc.getLine(openBracePos.row));
            doc.replace(new Range(row, 0, row, column - 1), indent);
        };

        this.$getIndent = function(line) {
            var match = line.match(/^(\s+)/);
            if (match) {
                return match[1];
            }

            return "";
        };

    }).call(MatchingParensOutdent.prototype);

    exports.MatchingParensOutdent = MatchingParensOutdent;
});

ace.define("ace/mode/pastel", [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text",
    "ace/mode/pastel_highlight_rules",
    "ace/mode/matching_parens_outdent"
], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var pastelHighlightRules = require("./pastel_highlight_rules").pastelHighlightRules;
    var MatchingParensOutdent = require("./matching_parens_outdent").MatchingParensOutdent;

    var Mode = function() {
        this.HighlightRules = pastelHighlightRules;
        this.$outdent = new MatchingParensOutdent();
    };
    oop.inherits(Mode, TextMode);

    (function() {

        this.lineCommentStart = ";";
        this.minorIndentFunctions = [
            "defn",
            "defn-",
            "defmacro",
            "def",
            "deftest",
            "testing"
        ];

        this.$toIndent = function(str) {
            return str.split('').map(function(ch) {
                if (/\s/.exec(ch)) {
                    return ch;
                } else {
                    return ' ';
                }
            }).join('');
        };

        this.$calculateIndent = function(line, tab) {
            var baseIndent = this.$getIndent(line);
            var delta = 0;
            var isParen,
                ch;
            for (var i = line.length - 1; i >= 0; i--) {
                ch = line[i];
                if (ch === '(') {
                    delta--;
                    isParen = true;
                } else if (ch === '(' || ch === '[' || ch === '{') {
                    delta--;
                    isParen = false;
                } else if (ch === ')' || ch === ']' || ch === '}') {
                    delta++;
                }
                if (delta < 0) {
                    break;
                }
            }
            if (delta < 0 && isParen) {
                i += 1;
                var iBefore = i;
                var fn = '';
                while (true) {
                    ch = line[i];
                    if (ch === ' ' || ch === '\t') {
                        if (this.minorIndentFunctions.indexOf(fn) !== -1) {
                            return this.$toIndent(line.substring(0, iBefore - 1) + tab);
                        } else {
                            return this.$toIndent(line.substring(0, i + 1));
                        }
                    } else if (ch === undefined) {
                        return this.$toIndent(line.substring(0, iBefore - 1) + tab);
                    }
                    fn += line[i];
                    i++;
                }
            } else if (delta < 0 && !isParen) {
                return this.$toIndent(line.substring(0, i + 1));
            } else if (delta > 0) {
                baseIndent = baseIndent.substring(0, baseIndent.length - tab.length);
                return baseIndent;
            } else {
                return baseIndent;
            }
        };

        this.getNextLineIndent = function(state, line, tab) {
            return this.$calculateIndent(line, tab);
        };

        this.checkOutdent = function(state, line, input) {
            return this.$outdent.checkOutdent(line, input);
        };

        this.autoOutdent = function(state, doc, row) {
            this.$outdent.autoOutdent(doc, row);
        };

        this.$id = "ace/mode/pastel";
    }).call(Mode.prototype);

    var y = Mode.prototype;
    y.HighlightRules = pastelHighlightRules;
    y.lineCommentStart = '#';

    exports.Mode = Mode;
});
