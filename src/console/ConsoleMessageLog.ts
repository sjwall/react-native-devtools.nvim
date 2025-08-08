import {Runtime} from 'react-native-devtools-frontend'
import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ConsoleMessage} from './ConsoleMessage'
import {ConsoleObject, Expandable} from './ConsoleObject'
import {renderConsoleObject} from './renderConsoleObject'

export class ConsoleMessageLog implements ConsoleMessage {
  #type: Runtime.ConsoleAPICalledEventType
  #timestamp: Runtime.Timestamp
  #parts: ConsoleObject[]
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

  render = (): [string[], BufferHighlight[], Expandable[]] => {
    const lines: string[] = []
    const expandables: Expandable[] = []
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
      let [partLines, partHighlights, partExpandables] = renderConsoleObject(
        item,
        this.#ns,
      )
      if (partLines[0] === 'force-new-line') {
        partLines = partLines.slice(1)
        lines.push(currentLine)
        currentLine = ''
      }
      if (partLines.length === 1) {
        const join = currentLine === '' ? '' : ' '
        highlights.push(
          ...partHighlights.map(({colStart, colEnd, ...highlight}) => ({
            ...highlight,
            colStart: currentLine.length + join.length,
            colEnd: currentLine.length + join.length + partLines[0].length,
            line: lines.length,
          })),
        )
        expandables.push(
          ...partExpandables.map((expandable) => ({
            line: expandable.line + lines.length,
            colStart: currentLine.length + join.length + expandable.colStart,
            colEnd: currentLine.length + join.length + expandable.colEnd,
            item: expandable.item,
          })),
        )
        currentLine += join + partLines[0]
      } else {
        if (currentLine != '') {
          lines.push(currentLine)
          currentLine = ''
        }
        highlights.push(
          ...partHighlights.map(({line, ...rest}) => ({
            ...rest,
            line: (line ?? 0) + lines.length,
          })),
        )
        expandables.push(
          ...partExpandables.map((expandable) => ({
            line: expandable.line + lines.length,
            colStart: expandable.colStart,
            colEnd: expandable.colEnd,
            item: expandable.item,
          })),
        )
        lines.push(...partLines)
      }
    })
    if (currentLine != '') {
      lines.push(currentLine)
    }
    return [lines, highlights, expandables]
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
