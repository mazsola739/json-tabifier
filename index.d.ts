export interface FormatOptions {
    /**
     * Keys longer than this are not aligned and don't widen the column.
     * `0` means no limit.
     * @default 0
     */
    maxKeyLength?: number
    /**
     * Spaces per nesting level (1-10), or `"tab"` to indent with tabs.
     * @default 2
     */
    indent?: number | 'tab'
}

/**
 * Formats JSON text so that the values of every object line up in a column.
 * Values are kept exactly as written; a byte order mark and CRLF line endings
 * are preserved, and the result always ends with a newline.
 *
 * @throws {SyntaxError} if `text` is not valid JSON
 * @throws {TypeError} if an option is invalid
 */
export function format(text: string, options?: FormatOptions): string
