#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const formatPackageJson = (filePath, maxKeyLength) => {
  const rawData = fs.readFileSync(filePath, 'utf-8')
  const jsonData = JSON.parse(rawData)

  const formatObject = (obj, maxKeyLength, indent = 0) => {
    const keys = Object.keys(obj)
    const filteredKeys = maxKeyLength ? keys.filter(key => key.length <= maxKeyLength) : keys
    const longestKeyLength = filteredKeys.reduce((max, key) => Math.max(max, key.length), 0)

    return Object.entries(obj)
      .map(([key, value]) => {
        const padding = ' '.repeat(indent)
        if (maxKeyLength && key.length > maxKeyLength) {
          return `${padding}"${key}": ${JSON.stringify(value)}`
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const formattedSubObject = formatObject(value, maxKeyLength, indent + 2)
          return `${padding}"${key}": {\n${formattedSubObject}\n${padding}}`
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
}

const packageJsonPath = path.join(process.cwd(), 'package.json')
const maxKeyLength = process.argv[2] ? parseInt(process.argv[2], 10) : undefined
formatPackageJson(packageJsonPath, maxKeyLength)