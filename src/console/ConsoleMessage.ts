import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ExpandableRef} from './ConsoleObject'

export type ConsoleMessage = {
  render(): [string[], BufferHighlight[], ExpandableRef[]]
}
