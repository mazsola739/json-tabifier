'use strict'

const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { run } = require('../lib/cli')

const UGLY = '{"a":1,"bbb":2}'
const PRETTY = '{\n  "a"  : 1,\n  "bbb": 2\n}\n'

let dir

// Creates files below the temp dir: write({ 'sub/x.json': '...' })
const write = (files) => {
    for (const [name, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
        fs.writeFileSync(path.join(dir, name), content)
    }
}
const read = (name) => fs.readFileSync(path.join(dir, name), 'utf8')

const tabify = (...args) => {
    let stdout = ''
    let stderr = ''
    const code = run(args, {
        cwd   : dir,
        stdout: { write: (text) => { stdout += text } },
        stderr: { write: (text) => { stderr += text } }
    })
    return { code, stdout, stderr }
}

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-tabifier-'))
})

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('tabify', () => {
    it('formats ./package.json by default and nothing else', () => {
        write({ 'package.json': UGLY, 'other.json': UGLY })
        const { code, stdout } = tabify()
        assert.equal(code, 0)
        assert.equal(read('package.json'), PRETTY)
        assert.equal(read('other.json'), UGLY)
        assert.match(stdout, /formatted {2}package\.json/)
        assert.match(stdout, /1 file formatted, 0 already tidy\./)
    })

    it('leaves files that are already formatted untouched', () => {
        write({ 'package.json': PRETTY })
        const before = fs.statSync(path.join(dir, 'package.json')).mtimeMs
        const { code, stdout } = tabify()
        assert.equal(code, 0)
        assert.equal(fs.statSync(path.join(dir, 'package.json')).mtimeMs, before)
        assert.match(stdout, /0 files formatted, 1 already tidy\./)
    })

    it('formats every .json file when onlyPackageJson is false, honouring excludes', () => {
        write({
            'json-tabifier.json'         : '{"onlyPackageJson": false, "excludes": ["node_modules", "^dist/"]}',
            'package.json'               : UGLY,
            'config/app.json'            : UGLY,
            'notes.txt'                  : UGLY,
            'node_modules/pkg/index.json': UGLY,
            'dist/out.json'              : UGLY,
            'src/dist/keep.json'         : UGLY
        })
        const { code } = tabify()
        assert.equal(code, 0)
        assert.equal(read('package.json'), PRETTY)
        assert.equal(read('config/app.json'), PRETTY)
        assert.equal(read('src/dist/keep.json'), PRETTY)
        assert.equal(read('notes.txt'), UGLY)
        assert.equal(read('node_modules/pkg/index.json'), UGLY)
        assert.equal(read('dist/out.json'), UGLY)
    })

    it('skips package-lock.json by default', () => {
        write({ 'package-lock.json': UGLY, 'a.json': UGLY })
        assert.equal(tabify('.').code, 0)
        assert.equal(read('package-lock.json'), UGLY)
        assert.equal(read('a.json'), PRETTY)
    })

    it('formats the files and directories given on the command line', () => {
        write({ 'package.json': UGLY, 'a.json': UGLY, '.babelrc': UGLY, 'sub/b.json': UGLY })
        const { code } = tabify('.babelrc', 'sub')
        assert.equal(code, 0)
        assert.equal(read('.babelrc'), PRETTY)
        assert.equal(read('sub/b.json'), PRETTY)
        assert.equal(read('package.json'), UGLY)
        assert.equal(read('a.json'), UGLY)
    })

    it('applies maxKeyLength and indent from the config', () => {
        write({ 'json-tabifier.json': '{"maxKeyLength": 2, "indent": 4}', 'package.json': UGLY })
        tabify()
        assert.equal(read('package.json'), '{\n    "a": 1,\n    "bbb": 2\n}\n')
    })

    it('--check reports unformatted files without writing them', () => {
        write({ 'package.json': UGLY })
        const { code, stdout } = tabify('--check')
        assert.equal(code, 1)
        assert.equal(read('package.json'), UGLY)
        assert.match(stdout, /needs formatting {2}package\.json/)

        write({ 'package.json': PRETTY })
        assert.equal(tabify('-c').code, 0)
    })

    it('reports invalid JSON, keeps going and exits with 2', () => {
        write({ 'bad.json': '{\n  // comment\n  "a": 1\n}', 'good.json': UGLY })
        const { code, stderr } = tabify('.')
        assert.equal(code, 2)
        assert.equal(read('good.json'), PRETTY)
        assert.equal(read('bad.json'), '{\n  // comment\n  "a": 1\n}')
        assert.match(stderr, /bad\.json: invalid JSON/)
        assert.match(stderr, /comments are not valid JSON/)
    })

    it('explains a missing package.json', () => {
        const { code, stderr } = tabify()
        assert.equal(code, 2)
        assert.match(stderr, /package\.json: no such file or directory/)
        assert.match(stderr, /onlyPackageJson/)
    })

    it('rejects an invalid config file', () => {
        write({ 'package.json': UGLY, 'json-tabifier.json': '{"maxKeyLength": "long"}' })
        const { code, stderr } = tabify()
        assert.equal(code, 2)
        assert.match(stderr, /invalid config: json-tabifier\.json: maxKeyLength/)
        assert.equal(read('package.json'), UGLY)
    })

    it('warns about unknown config options', () => {
        write({ 'package.json': UGLY, 'json-tabifier.json': '{"maxKeyLenght": 3}' })
        const { code, stderr } = tabify()
        assert.equal(code, 0)
        assert.match(stderr, /unknown option "maxKeyLenght"/)
    })

    it('reads the config from --config', () => {
        write({ 'tabify.config.json': '{"indent": "tab"}', 'package.json': UGLY })
        assert.equal(tabify('--config', 'tabify.config.json').code, 0)
        assert.equal(read('package.json'), '{\n\t"a"  : 1,\n\t"bbb": 2\n}\n')
        assert.equal(tabify('--config', 'missing.json').code, 2)
    })

    it('--quiet only prints errors', () => {
        write({ 'package.json': UGLY })
        const { code, stdout } = tabify('--quiet')
        assert.equal(code, 0)
        assert.equal(stdout, '')
    })

    it('rejects unknown options', () => {
        const { code, stderr } = tabify('--nope')
        assert.equal(code, 2)
        assert.match(stderr, /--help/)
    })

    it('prints help and version', () => {
        assert.match(tabify('--help').stdout, /Usage: tabify/)
        assert.equal(tabify('-v').stdout.trim(), require('../package.json').version)
    })

    it('runs as an executable', () => {
        write({ 'package.json': UGLY })
        const bin = path.join(__dirname, '..', 'bin', 'tabifier.js')
        const stdout = execFileSync(process.execPath, [bin], { cwd: dir, encoding: 'utf8' })
        assert.match(stdout, /formatted/)
        assert.equal(read('package.json'), PRETTY)
    })
})
