import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ConsoleMessage} from './ConsoleMessage'
import {Expandable} from './ConsoleObject'

export class ConsoleMessageStatic implements ConsoleMessage {
  #lines: string[]
  #highlights: BufferHighlight[]

  constructor(lines: string[] | string, highlights: BufferHighlight[] = []) {
    this.#lines = typeof lines === 'string' ? [lines] : lines
    this.#highlights = highlights
  }

  render = (): [string[], BufferHighlight[], Expandable[]] => {
    return [this.#lines, this.#highlights, []]
  }
}
