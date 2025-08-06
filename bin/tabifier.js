#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const loadConfig = require('./configLoader')
const config = loadConfig()

const formatJson = (filePath) => {
    console.time(`Formatting ${filePath}`)
    const { maxKeyLength } = config
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(rawData)

    const formatObject = (obj, maxKeyLength, indent = 0) => {
        const keys = Object.keys(obj)
        const filteredKeys = maxKeyLength ? keys.filter(key => key.length <= maxKeyLength) : keys
        const longestKeyLength = filteredKeys.reduce((max, key) => Math.max(max, key.length), 0)

        return Object.entries(obj)
            .map(([key, value]) => {
                const padding = ' '.repeat(indent)
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const formattedSubObject = formatObject(value, maxKeyLength, indent + 2)
                    return `${padding}"${key}": {\n${formattedSubObject}\n${padding}}`
                }

                if (maxKeyLength && key.length > maxKeyLength) {
                    return `${padding}"${key}": ${JSON.stringify(value)}`
                }

                const paddedKey = `"${key}"`.padEnd(longestKeyLength + 2, ' ')
                return `${padding}${paddedKey}: ${JSON.stringify(value)}`
            })
            .join(',\n')
    }

    const formattedJson = formatObject(jsonData, maxKeyLength, 2)

    const finalOutput = `{\n${formattedJson}\n}`

    fs.writeFileSync(filePath, finalOutput, 'utf-8')
    console.log(`Formatted ${filePath} successfully.`)
    console.timeEnd(`Formatting ${filePath}`)
}

function collectJsonFiles(dir) {
    let results = []

    const list = fs.readdirSync(dir)
    for (const file of list) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat && stat.isDirectory()) {
            results = results.concat(collectJsonFiles(fullPath))
        } else if (file.endsWith('.json')) {
            results.push(fullPath)
        }
    }

    return results
}


if (config.onlyPackageJson) {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    formatJson(packageJsonPath)
} else {
    console.time('Format all json files')
    console.time('Collecting all json files')
    const jsonFiles = collectJsonFiles(process.cwd())
    console.timeEnd('Collecting all json files')
    console.log(jsonFiles)

    jsonFiles.forEach(jsonFile => {
        formatJson(jsonFile)
    })
    console.timeEnd('Format all json files')
}
