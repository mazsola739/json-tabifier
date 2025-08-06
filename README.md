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
}
```
    - onlyPackageJson - boolean
        - true: only formatting package.json
        - false: resursivle from current dir formatting all json files
    - maxKeyLength - number
        - 0: no max key length set
        - other number: The maximum length of keys to align. Keys longer than this will not be aligned.

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
