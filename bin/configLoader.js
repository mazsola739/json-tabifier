const fs = require('fs')
const path = require('path')
const sep = path.sep

function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) return {}
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(content)
    } catch (err) {
        console.error(`Error parsing config file at ${filePath}:`, err.message)
        return {}
    }
}

function loadConfig() {
    try {
        const defaultConfigPath = path.resolve(__dirname, `..${sep}config${sep}json-tabifier.json`)
        const localConfigPath = path.resolve(__dirname, `..${sep}json-tabifier.json`)

        const defaultConfig = loadJSON(defaultConfigPath)
        const localConfig = loadJSON(localConfigPath)

        console.log('default config')
        console.log(__dirname)
        console.log(defaultConfigPath)
        console.log(defaultConfig)
        console.log('~ ~ ~')

        console.log('local config')
        console.log(localConfigPath)
        console.log(localConfig)
        console.log('~ ~ ~')

        // Merge configs: local > home > default
        const conf = {
            ...defaultConfig,
            ...localConfig
        }
        console.log('Effective config:', JSON.stringify(conf, null, 2))

        return conf
    } catch (e) {
        console.warn('could not load config correctly.')
        console.warn(e)
    }

}


module.exports = loadConfig
