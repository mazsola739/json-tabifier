# JSON Formatter CLI

A CLI tool to format package.json file with customizable key alignment and indentation.

## Features

- Aligns package.json keys for better readability.
- Supports nested objects.
- Allows customization of maximum key length for alignment.

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
tabify <maxKeyLength>
```

- `<maxKeyLength>` (optional): The maximum length of keys to align. Keys longer than this will not be aligned.

Example:

```bash
tabify 20
```

This will format the `package.json` file in the current directory, aligning keys up to 20 characters long.

## Fix for `maxKeyLength` with Nested Objects

Previously, when the `maxKeyLength` parameter was specified, the tool skipped formatting nested objects and returned them as a single line. This issue has been fixed. Now, even if a key exceeds the `maxKeyLength`, its value (if it's an object) will still be formatted recursively.

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
