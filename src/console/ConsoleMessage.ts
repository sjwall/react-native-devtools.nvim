import {BufferHighlight} from 'neovim/lib/api/Buffer'

export type ConsoleMessage = {
  render(): [string[], BufferHighlight[]]
}
