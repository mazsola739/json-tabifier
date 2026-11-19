'use strict'

const fs = require('fs')
const path = require('path')
const { normalizeOptions } = require('./format')

const CONFIG_FILE = 'json-tabifier.json'

const DEFAULTS = Object.freeze({
    onlyPackageJson: true,
    maxKeyLength   : 0,
    indent         : 2,
    excludes       : ['node_modules', 'package-lock.json']
})

class ConfigError extends Error {}

function validate(config, file) {
    const fail = (message) => {
        throw new ConfigError(`${file}: ${message}`)
    }

    if (typeof config !== 'object' || config === null || Array.isArray(config)) fail('expected a JSON object')

    const warnings = Object.keys(config)
        .filter(key => !(key in DEFAULTS) && key !== '$schema')
        .map(key => `${file}: unknown option "${key}" (ignored)`)

    if ('onlyPackageJson' in config && typeof config.onlyPackageJson !== 'boolean') fail('"onlyPackageJson" must be true or false')

    try {
        normalizeOptions(config)
    } catch (err) {
        fail(err.message)
    }

    if ('excludes' in config) {
        if (!Array.isArray(config.excludes) || !config.excludes.every(item => typeof item === 'string')) {
            fail('"excludes" must be an array of strings')
        }
        for (const pattern of config.excludes) {
            try {
                new RegExp(pattern)
            } catch (err) {
                fail(`"excludes" contains an invalid pattern: ${err.message}`)
            }
        }
    }

    return warnings
}

/**
 * Loads json-tabifier.json from `cwd` (or the file given with --config) on top of the defaults.
 * Throws ConfigError when the file is unreadable or invalid.
 */
function loadConfig({ cwd = process.cwd(), configPath } = {}) {
    const file = path.resolve(cwd, configPath || CONFIG_FILE)
    const label = path.relative(cwd, file) || file
    const compile = (config) => ({ ...config, excludes: config.excludes.map(pattern => new RegExp(pattern)) })

    if (!fs.existsSync(file)) {
        if (configPath) throw new ConfigError(`config file not found: ${label}`)
        return { config: compile(DEFAULTS), file: null, warnings: [] }
    }

    let local
    try {
        local = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (err) {
        throw new ConfigError(`${label}: ${err.message}`)
    }

    const warnings = validate(local, label)
    return { config: compile({ ...DEFAULTS, ...local }), file, warnings }
}

module.exports = { loadConfig, ConfigError, DEFAULTS, CONFIG_FILE }
