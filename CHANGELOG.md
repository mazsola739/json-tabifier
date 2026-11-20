# Changelog

## Unreleased

- `author` field and README link to the author's portfolio.

## 2.0.3 (2026-11-20)

- README: install and run commands for pnpm, Yarn and Bun.

## 2.0.2 (2026-11-19)

- `homepage` points to the new project page with a live playground: https://mazsola739.github.io/json-tabifier/

## 2.0.1 (2026-11-19)

- README: reworded a sentence that the npm website displayed incorrectly.

## 2.0.0 (2026-11-19)

A rewrite that keeps the 1.x look, with the changes listed below.

### Fixed

- Top-level arrays and plain values were turned into objects (`[1,2]` became `{"0": 1, "1": 2}`).
- Keys containing `"` or `\` were written without escaping, which produced invalid JSON.
- Values were re-serialized, so large numbers lost precision (`12345678901234567890` became `12345678901234567000`), `1.50` became `1.5` and escape sequences were replaced. Values are now copied exactly as written.
- One invalid file (for example a `tsconfig.json` with comments) stopped the whole run. It is now reported and the other files are still formatted.
- `excludes` were matched against the absolute path, so a parent folder such as `~/dist-projects/` could exclude a whole project. They are now matched against the path relative to the current directory, with `/` separators.
- Symbolic links to directories were followed, which could loop forever.
- Published files had Windows line endings, including the `#!/usr/bin/env node` line.
- `require('json-tabifier')` ran the formatter on the current directory.

### Changed

- Only keys with single-line values set the width of the column. Keys that open a nested object or array, such as `"devDependencies": {`, no longer push the other values to the right.
- Arrays that contain objects or arrays are spread over several lines, and their objects are aligned too. Arrays of plain values stay on one line.
- Empty objects are written as `{}` instead of an empty block.
- Files end with a newline, and Windows line endings and a byte order mark are kept.
- Keys are measured by their width on screen, so CJK characters and emoji line up.
- Files are only written when their formatting changes.
- Much shorter output: no config dump and no timings.
- `package-lock.json` is excluded by default, and `.git` directories are always skipped.
- An invalid `json-tabifier.json` is an error instead of being ignored silently, and unknown options produce a warning.
- Requires Node.js 18.3 or newer.

### Added

- Paths on the command line: `tabify config/ tsconfig.base.json`.
- `--check` for CI, plus `--config`, `--quiet`, `--help` and `--version`.
- Exit codes: `1` when `--check` finds unformatted files, `2` on errors.
- `indent` option (number of spaces or `"tab"`).
- API: `require('json-tabifier').format(text, options)`, with TypeScript types.
- Tests and CI on Linux, macOS and Windows.

## 1.1.1 (2025-08-06)

- `excludes` option, default `["node_modules"]`.
- Fixed loading the config file; less console output. (Thanks to sylwolveryn.)

## 1.1.0 (2025-08-06)

- `json-tabifier.json` config file with `maxKeyLength` and `onlyPackageJson`. With `"onlyPackageJson": false`, every `.json` file under the current directory is formatted. (Thanks to sylwolveryn.)

## 1.0.0 – 1.0.3 (2025-03-25)

- First release: `tabify` aligns the keys of `package.json`.
