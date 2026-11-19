'use strict'

const WHITESPACE = ' \t\n\r'
const VALUE_END = ' \t\n\r,]}'

/**
 * Parses JSON text into a lossless tree. Strings and numbers keep their exact
 * source text, so formatting never changes a value (no lost precision on big
 * numbers, no rewritten escape sequences, duplicate keys survive).
 *
 *   { type: 'object',  entries: [{ key: '"raw key"', value: node }] }
 *   { type: 'array',   items: [node] }
 *   { type: 'literal', raw: '1.50' }
 */
function parse(text) {
    // JSON.parse is the authority on validity (and gives good error messages),
    // so the scanner below only ever sees well-formed input.
    JSON.parse(text)

    let i = 0
    const skipWhitespace = () => {
        while (i < text.length && WHITESPACE.includes(text[i])) i++
    }
    const readString = () => {
        const start = i++
        while (text[i] !== '"') i += text[i] === '\\' ? 2 : 1
        return text.slice(start, ++i)
    }
    const readValue = () => {
        skipWhitespace()
        const char = text[i]

        if (char === '{') {
            i++
            const entries = []
            skipWhitespace()
            if (text[i] === '}') {
                i++
                return { type: 'object', entries }
            }
            for (;;) {
                skipWhitespace()
                const key = readString()
                skipWhitespace()
                i++ // ':'
                entries.push({ key, value: readValue() })
                skipWhitespace()
                if (text[i++] === '}') return { type: 'object', entries }
            }
        }

        if (char === '[') {
            i++
            const items = []
            skipWhitespace()
            if (text[i] === ']') {
                i++
                return { type: 'array', items }
            }
            for (;;) {
                items.push(readValue())
                skipWhitespace()
                if (text[i++] === ']') return { type: 'array', items }
            }
        }

        if (char === '"') return { type: 'literal', raw: readString() }

        const start = i
        while (i < text.length && !VALUE_END.includes(text[i])) i++
        return { type: 'literal', raw: text.slice(start, i) }
    }

    return readValue()
}

function normalizeOptions(options = {}) {
    const { maxKeyLength = 0, indent = 2 } = options

    if (!Number.isInteger(maxKeyLength) || maxKeyLength < 0) {
        throw new TypeError(`maxKeyLength must be a whole number >= 0 (0 = no limit), got ${JSON.stringify(maxKeyLength)}`)
    }

    let unit
    if (indent === 'tab' || indent === '\t') unit = '\t'
    else if (Number.isInteger(indent) && indent >= 1 && indent <= 10) unit = ' '.repeat(indent)
    else throw new TypeError(`indent must be a number of spaces (1-10) or "tab", got ${JSON.stringify(indent)}`)

    return { maxKeyLength, unit }
}

// East Asian wide characters and emoji take two columns in a monospace font.
const isWide = (code) =>
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) || // CJK radicals ... Yi
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK compatibility ideographs
    (code >= 0xfe30 && code <= 0xfe4f) || // CJK compatibility forms
    (code >= 0xff00 && code <= 0xff60) || // fullwidth forms
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x1f300 && code <= 0x1faff) || // emoji and pictographs
    (code >= 0x20000 && code <= 0x3fffd) // CJK extensions

// How many columns a key takes up on screen, so the values line up visually.
const width = (text) => {
    let columns = 0
    for (const char of text) {
        const code = char.codePointAt(0)
        const isZeroWidth = (code >= 0x300 && code <= 0x36f) || code === 0x200d || (code >= 0xfe00 && code <= 0xfe0f)
        if (!isZeroWidth) columns += isWide(code) ? 2 : 1
    }
    return columns
}

// Containers that are written on a single line: {} , [] and arrays of plain values.
const isInline = (node) => {
    if (node.type === 'literal') return true
    if (node.type === 'object') return node.entries.length === 0
    return node.items.every(item => item.type === 'literal')
}

function render(node, padding, ctx) {
    if (node.type === 'literal') return node.raw
    if (node.type === 'object' && node.entries.length === 0) return '{}'
    if (node.type === 'array' && isInline(node)) return `[${node.items.map(item => item.raw).join(',')}]`

    const { unit, eol, maxKeyLength } = ctx
    const inner = padding + unit

    if (node.type === 'array') {
        const lines = node.items.map(item => inner + render(item, inner, ctx))
        return `[${eol}${lines.join(`,${eol}`)}${eol}${padding}]`
    }

    // Only single-line values line up; multi-line values open their block right after the key.
    // Keys longer than maxKeyLength are not aligned either. Neither kind widens the column.
    const isAligned = ({ key, value }) => isInline(value) && (!maxKeyLength || width(key) - 2 <= maxKeyLength)
    const column = node.entries.reduce((max, entry) => (isAligned(entry) ? Math.max(max, width(entry.key)) : max), 0)

    const lines = node.entries.map((entry) => {
        const { key, value } = entry
        const label = isAligned(entry) ? key + ' '.repeat(column - width(key)) : key
        return `${inner}${label}: ${render(value, inner, ctx)}`
    })
    return `{${eol}${lines.join(`,${eol}`)}${eol}${padding}}`
}

/**
 * Formats JSON text so that the values of every object line up in a column.
 * A byte order mark and CRLF line endings are preserved; the result always ends
 * with a newline.
 *
 * @param {string} text JSON source
 * @param {{ maxKeyLength?: number, indent?: number | 'tab' }} [options]
 * @returns {string}
 * @throws {SyntaxError} if `text` is not valid JSON
 */
function format(text, options) {
    if (typeof text !== 'string') throw new TypeError('format() expects the JSON text as a string')

    const { maxKeyLength, unit } = normalizeOptions(options)
    const bom = text.charCodeAt(0) === 0xfeff ? '﻿' : ''
    const source = bom ? text.slice(1) : text
    const eol = source.includes('\r\n') ? '\r\n' : '\n'

    return bom + render(parse(source), '', { unit, eol, maxKeyLength }) + eol
}

module.exports = { format, normalizeOptions }
