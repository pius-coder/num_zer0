/**
 * Transport Interface
 *
 * Transports receive structured log entries and write them somewhere:
 * console, files, external API, etc.
 *
 * Each transport declares which log streams it handles.
 */

import type { StructuredLogEntry } from './schema'
import type { LogLevel } from './types'

export interface Transport {
  /** Human-readable name for debugging */
  name: string

  /** Minimum level this transport will accept */
  minLevel: LogLevel

  /** Which streams this transport handles. Empty = all streams. */
  streams?: Array<'app' | 'error' | 'access' | 'audit'>

  /** Write a single log entry */
  write(entry: StructuredLogEntry): void

  /** Flush any buffered entries (optional) */
  flush?(): Promise<void>

  /** Cleanup on shutdown (optional) */
  close?(): Promise<void>
}
