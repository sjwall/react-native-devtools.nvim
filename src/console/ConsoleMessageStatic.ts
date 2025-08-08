import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ConsoleMessage} from './ConsoleMessage'

export class ConsoleMessageStatic implements ConsoleMessage {
  #lines: string[]
  #highlights: BufferHighlight[]

  constructor(lines: string[] | string, highlights: BufferHighlight[] = []) {
    this.#lines = typeof lines === 'string' ? [lines] : lines
    this.#highlights = highlights
  }

  render = (): [string[], BufferHighlight[]] => {
    return [this.#lines, this.#highlights]
  }
}
