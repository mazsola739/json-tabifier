'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { format } = require('..')

const lines = (...rows) => rows.join('\n') + '\n'

describe('format', () => {
    it('lines up the values of an object', () => {
        assert.equal(format('{"name":"example","version":"1.0.0","description":"An example JSON file"}'), lines(
            '{',
            '  "name"       : "example",',
            '  "version"    : "1.0.0",',
            '  "description": "An example JSON file"',
            '}'
        ))
    })

    it('opens nested objects right after their key and aligns them on their own', () => {
        assert.equal(format('{"name":"x","bin":{"tabify":"./bin/tabifier.js","t":"y"},"license":"MIT"}'), lines(
            '{',
            '  "name"   : "x",',
            '  "bin": {',
            '    "tabify": "./bin/tabifier.js",',
            '    "t"     : "y"',
            '  },',
            '  "license": "MIT"',
            '}'
        ))
    })

    it('keeps arrays of plain values on one line', () => {
        assert.equal(format('{"keywords": ["json", "cli"], "n": [1, 2.50, null]}'), lines(
            '{',
            '  "keywords": ["json","cli"],',
            '  "n"       : [1,2.50,null]',
            '}'
        ))
    })

    it('expands arrays that contain objects or arrays', () => {
        assert.equal(format('{"rules":[{"name":"x","level":"error"},[1,2]],"a":1}'), lines(
            '{',
            '  "rules": [',
            '    {',
            '      "name" : "x",',
            '      "level": "error"',
            '    },',
            '    [1,2]',
            '  ],',
            '  "a": 1',
            '}'
        ))
    })

    it('does not let keys with multi-line values widen the column', () => {
        assert.equal(format('{"name":"x","version":"1.0.0","devDependencies":{"a":"^1.0.0"},"empty":{}}'), lines(
            '{',
            '  "name"   : "x",',
            '  "version": "1.0.0",',
            '  "devDependencies": {',
            '    "a": "^1.0.0"',
            '  },',
            '  "empty"  : {}',
            '}'
        ))
    })

    it('writes empty objects and arrays inline', () => {
        assert.equal(format('{"empty":{},"list":[]}'), lines(
            '{',
            '  "empty": {},',
            '  "list" : []',
            '}'
        ))
        assert.equal(format('{}'), '{}\n')
        assert.equal(format('  [ ]  '), '[]\n')
    })

    it('keeps top-level arrays and plain values as they are', () => {
        assert.equal(format('[1,{"a":1}]'), lines('[', '  1,', '  {', '    "a": 1', '  }', ']'))
        assert.equal(format('"just a string"'), '"just a string"\n')
        assert.equal(format('42'), '42\n')
    })

    it('never changes a value', () => {
        const input = '{"big":12345678901234567890,"price":1.50,"exp":1E+3,"neg":-0.0,"e":"\\u00e9","slash":"a\\/b","q\\"k":true}'
        assert.equal(format(input), lines(
            '{',
            '  "big"  : 12345678901234567890,',
            '  "price": 1.50,',
            '  "exp"  : 1E+3,',
            '  "neg"  : -0.0,',
            '  "e"    : "\\u00e9",',
            '  "slash": "a\\/b",',
            '  "q\\"k" : true',
            '}'
        ))
        assert.deepEqual(JSON.parse(format(input)), JSON.parse(input))
    })

    it('keeps duplicate keys', () => {
        assert.equal(format('{"a":1,"a":2}'), lines('{', '  "a": 1,', '  "a": 2', '}'))
    })

    it('measures keys by their width on screen', () => {
        // CJK characters and emoji are two columns wide, combining accents take none.
        assert.equal(format('{"名前":1,"id":2,"🙂":3,"é":4}'), lines(
            '{',
            '  "名前": 1,',
            '  "id"  : 2,',
            '  "🙂"  : 3,',
            '  "é"   : 4',
            '}'
        ))
        assert.equal(format('{"é":1,"ab":2}'), lines('{', '  "é" : 1,', '  "ab": 2', '}'))
    })

    it('does not align keys longer than maxKeyLength', () => {
        assert.equal(format('{"a":1,"bb":2,"a-very-long-key":3}', { maxKeyLength: 5 }), lines(
            '{',
            '  "a" : 1,',
            '  "bb": 2,',
            '  "a-very-long-key": 3',
            '}'
        ))
    })

    it('supports other indent widths and tabs', () => {
        assert.equal(format('{"a":{"bb":1}}', { indent: 4 }), lines('{', '    "a": {', '        "bb": 1', '    }', '}'))
        assert.equal(format('{"a":{"bb":1}}', { indent: 'tab' }), lines('{', '\t"a": {', '\t\t"bb": 1', '\t}', '}'))
    })

    it('preserves a byte order mark and CRLF line endings', () => {
        assert.equal(format('﻿{\r\n"a":1,"bb":2}'), '﻿{\r\n  "a" : 1,\r\n  "bb": 2\r\n}\r\n')
    })

    it('is idempotent', () => {
        const once = format('{"a":[{"b":{"c":[1,[2]]}}],"dd":{},"e":"x"}')
        assert.equal(format(once), once)
    })

    it('rejects invalid JSON', () => {
        assert.throws(() => format('{"a":1,}'), SyntaxError)
        assert.throws(() => format('{"a": 1} // comment'), SyntaxError)
        assert.throws(() => format(''), SyntaxError)
    })

    it('rejects invalid options', () => {
        assert.throws(() => format('{}', { maxKeyLength: -1 }), TypeError)
        assert.throws(() => format('{}', { indent: 0 }), TypeError)
        assert.throws(() => format('{}', { indent: 'spaces' }), TypeError)
        assert.throws(() => format({}), TypeError)
    })

    it('keeps the 1.x output when the longest key has a single-line value', () => {
        // Produced by json-tabifier 1.1.1 (which wrote no final newline).
        const v1 = [
            '{',
            '  "name"       : "json-tabifier",',
            '  "version"    : "1.1.1",',
            '  "description": "A CLI tool",',
            '  "keywords"   : ["json","formatter","cli"],',
            '  "private"    : false,',
            '  "bin": {',
            '    "tabify": "./bin/tabifier.js"',
            '  },',
            '  "repository": {',
            '    "type": "git",',
            '    "url" : "https://github.com/mazsola739/json-tabifier.git"',
            '  }',
            '}'
        ].join('\n')
        assert.equal(format(JSON.stringify(JSON.parse(v1), null, 2)), v1 + '\n')
    })
})
