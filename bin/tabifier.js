#!/usr/bin/env node
'use strict'

const { run } = require('../lib/cli')

process.exitCode = run()
