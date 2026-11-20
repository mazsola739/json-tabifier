# json-tabifier

[![npm version](https://img.shields.io/npm/v/json-tabifier)](https://www.npmjs.com/package/json-tabifier)
[![CI](https://github.com/mazsola739/json-tabifier/actions/workflows/ci.yml/badge.svg)](https://github.com/mazsola739/json-tabifier/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/json-tabifier)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/json-tabifier)](LICENSE)

Formats `package.json` and other JSON files so that the values line up in a neat column.

**[Try it in your browser →](https://mazsola739.github.io/json-tabifier/#playground)**

**Before**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "Something useful",
  "keywords": [
    "cli",
    "json"
  ],
  "license": "MIT",
  "scripts": {
    "build": "tsc",
    "test": "node --test"
  }
}
```

**After** `npx json-tabifier`

```json
{
  "name"       : "my-app",
  "version"    : "1.0.0",
  "description": "Something useful",
  "keywords"   : ["cli","json"],
  "license"    : "MIT",
  "scripts": {
    "build": "tsc",
    "test" : "node --test"
  }
}
```

- **Zero dependencies**, a few kilobytes.
- **Lossless:** values are written exactly as they were. Big numbers, `1.50`, `1e3` and escaped characters stay untouched.
- **Safe:** files that aren't valid JSON are reported and left alone. Files that are already formatted are not rewritten.
- Keeps Windows line endings and a byte order mark.
- `--check` mode for CI, plus a small API with TypeScript types.

## Installation

Run it once without installing:

```bash
npx json-tabifier        # npm
pnpm dlx json-tabifier   # pnpm
yarn dlx json-tabifier   # Yarn 2+ (on Yarn 1, use npx)
bunx json-tabifier       # Bun
```

Or add it to your project:

```bash
npm install --save-dev json-tabifier
pnpm add -D json-tabifier
yarn add -D json-tabifier
bun add -d json-tabifier
```

## Usage

The examples use `npx`. With other package managers, run `pnpm exec tabify`, `yarn tabify` or `bunx tabify` instead.

```bash
npx tabify                        # formats ./package.json
npx tabify .                      # every .json file under the current directory
npx tabify tsconfig.json config/  # the given files, and .json files in the given directories
npx tabify --check                # changes nothing; exit code 1 if a file needs formatting
```

| Option            | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `-c`, `--check`   | Don't write anything; exit with 1 if a file needs formatting   |
| `--config <file>` | Read options from `<file>` instead of `./json-tabifier.json`   |
| `-q`, `--quiet`   | Only print errors                                              |
| `-h`, `--help`    | Show the help                                                  |
| `-v`, `--version` | Show the version number                                        |

Exit codes: `0` everything is fine, `1` files need formatting (with `--check`), `2` an error occurred (invalid JSON, missing file, invalid config).

> **Tip:** `npm install <package>` rewrites `package.json` with plain indentation, so the alignment is lost after adding a dependency. Add a script and run it again, or use `tabify --check` in CI:
>
> ```json
> "scripts": {
>   "format:json": "tabify"
> }
> ```

## Configuration

Put a `json-tabifier.json` file in the directory you run `tabify` from. Every option is optional. These are the defaults:

```json
{
  "onlyPackageJson": true,
  "maxKeyLength"   : 0,
  "indent"         : 2,
  "excludes"       : ["node_modules","package-lock.json"]
}
```

| Option            | Default                                  | Description |
| ----------------- | ---------------------------------------- | ----------- |
| `onlyPackageJson` | `true`                                   | When no paths are given: `true` formats only `./package.json`, `false` formats every `.json` file under the current directory. |
| `maxKeyLength`    | `0`                                      | Keys longer than this many characters are not aligned and don't widen the column. `0` means no limit. |
| `indent`          | `2`                                      | Spaces per nesting level (1-10), or `"tab"`. |
| `excludes`        | `["node_modules", "package-lock.json"]` | Skip paths while searching directories. Each entry is a regular expression, so a plain word matches anywhere in the path. Paths are relative to the current directory and use `/`, for example `config/app.json`. Setting this replaces the default list, so keep `"node_modules"` in it. |

`.git` directories are always skipped. Files you name on the command line are always formatted, even if they match `excludes`.

For example, `"maxKeyLength": 10` keeps one long key from pushing every value far to the right:

```json
{
  "name"   : "x",
  "a-really-very-long-key-name": true,
  "version": "1.0.0"
}
```

## Formatting rules

- Every object puts one key on each line and lines up its values in a column.
- Nested objects, and arrays that contain objects or arrays, open on the key's line and are formatted the same way inside. Their keys are not part of the column, so a long `"devDependencies": {` doesn't push the other values to the right.
- Arrays of plain values stay on one line: `["cli","json"]`.
- Empty objects and arrays are written as `{}` and `[]`.
- Key widths are measured as they appear on screen, so Chinese, Japanese and Korean characters and emoji (two columns wide) line up as well.
- The file always ends with a newline.
- Comments are not valid JSON, so files such as a `tsconfig.json` with comments are reported and left unchanged. Add them to `excludes` to skip them quietly.

## API

```js
const { format } = require('json-tabifier')
// or: import { format } from 'json-tabifier'

format('{"a":1,"bbb":2}')
// '{\n  "a"  : 1,\n  "bbb": 2\n}\n'

format(text, { maxKeyLength: 20, indent: 4 })
```

`format(text, options?)` takes JSON text and returns the formatted text. It throws a `SyntaxError` if the text is not valid JSON. The options are `maxKeyLength` and `indent`, the same as in the config file.

## Upgrading from 1.x

- Only keys with single-line values set the width of the column. In 1.x, a long key such as `"devDependencies"` pushed every value to the right even though its own value starts on the next line.
- Arrays of objects are now spread over several lines instead of one long line, and empty objects are written as `{}`.
- Files end with a newline.
- `excludes` patterns are matched against the path relative to the current directory (with `/`) instead of the absolute path, and `package-lock.json` is excluded by default.
- `require('json-tabifier')` no longer runs the formatter; it returns the API above.
- An invalid file no longer stops the run, and the output is much shorter.
- Requires Node.js 18.3 or newer.

See the [changelog](https://github.com/mazsola739/json-tabifier/blob/main/CHANGELOG.md) for details.

## License

[MIT](LICENSE) © Rika
