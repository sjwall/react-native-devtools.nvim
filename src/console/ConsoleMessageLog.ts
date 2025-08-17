import {Runtime} from 'react-native-devtools-frontend'
import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ConsoleMessage} from './ConsoleMessage'
import {ExpandableRef} from './ConsoleObject'
import {renderRemoteObjects} from './renderer'

export class ConsoleMessageLog implements ConsoleMessage {
  #type: Runtime.ConsoleAPICalledEventType
  #timestamp: Runtime.Timestamp
  #parts: Runtime.RemoteObject[]
  #ns: number

  constructor(event: Runtime.ConsoleAPICalledEvent, namespace: number) {
    this.#ns = namespace
    this.#type = event.type
    this.#timestamp = event.timestamp
    this.#parts = event.args.filter(
      ({type, value}) =>
        type !== 'string' ||
        !value.includes(
          'You are using an unsupported debugging client. Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools.',
        ),
    )
  }

  render = (): [string[], BufferHighlight[], ExpandableRef[]] => {
    const lines: string[] = []
    const expandables: ExpandableRef[] = []
    let currentLine = ''
    const highlights: BufferHighlight[] = []

    const type = `${this.#type[0].toUpperCase()}${this.#type.substring(1)}`
    const timestamp = new Date(this.#timestamp).toLocaleTimeString()

    currentLine = this.#appendHighlightGroup(
      currentLine,
      timestamp,
      lines,
      highlights,
      'ReactNativeDevtoolsTimestamp',
    )
    currentLine = this.#appendHighlightGroup(
      currentLine,
      type,
      lines,
      highlights,
      `ReactNativeDevtools${type}Title`,
    )

    const [partLines, partHighlights, partExpandables] = renderRemoteObjects(
      currentLine,
      this.#parts,
      this.#ns,
    )

    return [
      partLines,
      [...highlights, ...partHighlights],
      [...expandables, ...partExpandables],
    ]
  }

  #appendHighlightGroup = (
    currentValue: string,
    value: string,
    lines: string[],
    highlights: BufferHighlight[],
    hlGroup: string,
  ) => {
    const join = currentValue === '' ? '' : ' '
    highlights.push({
      hlGroup,
      line: lines.length,
      colStart: currentValue.length + join.length,
      // FIXME why no - 1?
      colEnd: currentValue.length + join.length + value.length,
      srcId: this.#ns,
    })
    return currentValue + join + value
  }
}
