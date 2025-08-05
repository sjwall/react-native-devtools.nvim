import {Runtime} from 'react-native-devtools-frontend'
import {BufferHighlight} from 'neovim/lib/api/Buffer'

export class ConsoleMessage {
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

  render = (): [string[], BufferHighlight[]] => {
    const lines: string[] = []
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

    this.#parts.forEach((item) => {
      // TODO use preview
      if (item.type === 'string') {
        currentLine = this.#appendHighlightGroup(
          currentLine,
          item.value.replaceAll('\n', '\\n'),
          lines,
          highlights,
          `ReactNativeDevtoolsConsoleItem${item.type}`,
        )
      } else if (item.type === 'number') {
        currentLine = this.#appendHighlightGroup(
          currentLine,
          String(item.value),
          lines,
          highlights,
          `ReactNativeDevtoolsConsoleItem${item.type}`,
        )
      } else {
        lines.push(currentLine)
        currentLine = ''
        lines.push(JSON.stringify(item))
      }
    })
    if (currentLine != '') {
      lines.push(currentLine)
    }
    return [lines, highlights]
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
      colEnd: currentValue.length + join.length + value.length,
      srcId: this.#ns,
    })
    return currentValue + join + value
  }
}
