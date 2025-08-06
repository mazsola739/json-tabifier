# JSON Formatter CLI

A CLI tool to format package.json file with customizable key alignment and indentation.

## Features

- Aligns package.json keys for better readability.
- Supports nested objects.
- Allows customization based on  json-tabifier.json config file

default:
```
{
  "onlyPackageJson": true,
  "maxKeyLength"   : 0
  "excludes"       : ["node_modules"]
}

```
    - onlyPackageJson - boolean
        - true: only formatting package.json
        - false: resursivle from current dir formatting all json files
    - maxKeyLength - number
        - 0: no max key length set
        - other number: The maximum length of keys to align. Keys longer than this will not be aligned.
    - excluded - array of string
        - default: ['node_modules']
        - if you want to exclude some json files, choose a substring that will match the fullPath to that file and it / those files will be not formatted.
            - example: ['node_modules', 'result', 'dist'] 
            if the string is part of the full path for a file they will get excluded, even if that's a folder's name or the file's name.

## Installation

To install the CLI tool, run:

```bash
npm install json-tabifier
```

```bash
yarn add json-tabifier
```

```bash
pnpm add json-tabifier
```

## Usage

Run the formatter on a JSON file:

```bash
tabify
```

Example:

```bash
tabify
```

This will format the `package.json` file in the current directory, aligning keys up with no limit.


## Example Input

```json
{
  "name": "example",
  "version": "1.0.0",
  "description": "An example JSON file"
}
```

## Example Output

```json
{
  "name"        : "example",
  "version"     : "1.0.0",
  "description" : "An example JSON file"
}
```

## Author

Created by **Rika**.

## License

This project is licensed under the MIT License.
