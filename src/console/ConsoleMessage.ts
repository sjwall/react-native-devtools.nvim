import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {Expandable} from './ConsoleObject'

export type ConsoleMessage = {
  render(): [string[], BufferHighlight[], Expandable[]]
}
