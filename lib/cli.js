'use strict'

const fs = require('fs')
const path = require('path')
const { parseArgs } = require('util')
const { format } = require('./format')
const { loadConfig, ConfigError, CONFIG_FILE } = require('./config')
const { version } = require('../package.json')

const HELP = `Usage: tabify [options] [paths...]

Formats JSON files so that the values of every object line up in a column.

With no paths, formats ./package.json, or every .json file under the current
directory when "onlyPackageJson" is false in ${CONFIG_FILE}.
Directories are searched recursively for .json files, skipping paths that
match "excludes". Files named explicitly are always formatted.

Options:
  -c, --check          Don't write anything; exit with 1 if a file needs formatting
      --config <file>  Read options from <file> instead of ./${CONFIG_FILE}
  -q, --quiet          Only print errors
  -h, --help           Show this help
  -v, --version        Show the version number

Exit codes: 0 = ok, 1 = files need formatting (--check), 2 = error`

const OPTIONS = {
    check  : { type: 'boolean', short: 'c' },
    config : { type: 'string' },
    quiet  : { type: 'boolean', short: 'q' },
    help   : { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' }
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

function collectJsonFiles(dir, cwd, excludes, files) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        // Excludes are matched against the path relative to the working directory, with "/" separators.
        const relativePath = path.relative(cwd, fullPath).split(path.sep).join('/')
        if (excludes.some(pattern => pattern.test(relativePath))) continue

        // Symlinks are not followed: no loops, and no writing outside the tree.
        if (entry.isDirectory()) {
            if (entry.name !== '.git') collectJsonFiles(fullPath, cwd, excludes, files)
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath)
        }
    }
    return files
}

function describeError(err, input) {
    if (!(err instanceof SyntaxError)) return err.message

    const source = (input || '').replace(/^﻿/, '')
    const position = /position (\d+)/.exec(err.message)
    const offending = position ? source[Number(position[1])] : (/Unexpected token '(.)'/.exec(err.message) || [])[1]
    const hint = offending === '/' ? ' (comments are not valid JSON; add this file to "excludes" to skip it)' : ''
    return `invalid JSON: ${err.message}${hint}`
}

/**
 * Runs the CLI and returns the exit code. `io` lets tests swap the working directory and output streams.
 */
function run(argv = process.argv.slice(2), io = {}) {
    const { cwd = process.cwd(), stdout = process.stdout, stderr = process.stderr } = io
    const print = (line) => stdout.write(`${line}\n`)
    const printError = (line) => stderr.write(`${line}\n`)

    let flags, positionals
    try {
        ({ values: flags, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true }))
    } catch (err) {
        printError(`tabify: ${err.message}\nRun "tabify --help" for usage.`)
        return 2
    }

    if (flags.help) {
        print(HELP)
        return 0
    }
    if (flags.version) {
        print(version)
        return 0
    }

    let config
    try {
        const loaded = loadConfig({ cwd, configPath: flags.config })
        loaded.warnings.forEach(warning => printError(`warning: ${warning}`))
        config = loaded.config
    } catch (err) {
        if (!(err instanceof ConfigError)) throw err
        printError(`tabify: invalid config: ${err.message}`)
        return 2
    }

    const log = flags.quiet ? () => {} : print
    const displayName = (file) => path.relative(cwd, file) || file
    let failed = 0

    const targets = positionals.length ? positionals : [config.onlyPackageJson ? 'package.json' : '.']
    let files = []
    for (const target of targets) {
        const fullPath = path.resolve(cwd, target)
        let stat
        try {
            stat = fs.statSync(fullPath)
        } catch {
            const hint = positionals.length ? '' : ` (pass the files to format, or set "onlyPackageJson": false in ${CONFIG_FILE})`
            printError(`error: ${target}: no such file or directory${hint}`)
            failed++
            continue
        }
        if (stat.isDirectory()) collectJsonFiles(fullPath, cwd, config.excludes, files)
        else files.push(fullPath)
    }
    files = [...new Set(files)]

    if (!files.length && !failed) {
        log('No JSON files found.')
        return 0
    }

    let changed = 0
    let tidy = 0
    for (const file of files) {
        let input
        let output
        try {
            input = fs.readFileSync(file, 'utf8')
            output = format(input, config)
            if (output !== input && !flags.check) fs.writeFileSync(file, output, 'utf8')
        } catch (err) {
            printError(`error: ${displayName(file)}: ${describeError(err, input)}`)
            failed++
            continue
        }
        if (output === input) {
            tidy++
            continue
        }
        changed++
        log(`${flags.check ? 'needs formatting' : 'formatted'}  ${displayName(file)}`)
    }

    const summary = [
        flags.check ? `${plural(changed, 'file')} need${changed === 1 ? 's' : ''} formatting` : `${plural(changed, 'file')} formatted`,
        `${tidy} already tidy`,
        failed ? `${failed} failed` : ''
    ]
    log(summary.filter(Boolean).join(', ') + '.')

    if (failed) return 2
    return flags.check && changed ? 1 : 0
}

module.exports = { run, HELP }
