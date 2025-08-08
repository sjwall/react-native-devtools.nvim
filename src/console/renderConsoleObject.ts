import {Runtime} from 'react-native-devtools-frontend'
import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ConsoleObject} from './ConsoleObject'

export function renderConsoleObject(
  item: ConsoleObject,
  srcId: number,
  indent: '' | '  ' = '',
): [string[], BufferHighlight[]] {
  const lines: string[] = []
  const highlights: BufferHighlight[] = []
  const value = (item as Runtime.RemoteObject).value ?? item.description

  if (item.type === 'string') {
    const newLineIndex = value.indexOf('\n')
    if (newLineIndex > -1) {
      const [firstLine, ...rest] = value.split('\n')
      if (item.expanded) {
        lines.push(`▲${firstLine}`)
        lines.push(...rest)
      } else {
        lines.push(`▼${firstLine}`)
      }
      lines.forEach((line, index) => {
        highlights.push({
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: index,
          colStart: 0,
          colEnd: line.length,
          srcId,
        })
      })
    } else {
      highlights.push({
        hlGroup: 'ReactNativeDevtoolsConsoleItemString',
        line: lines.length,
        colStart: 0,
        colEnd: value.length,
        srcId,
      })
      lines.push(value)
    }
  } else if (item.type === 'number') {
    lines.push(String(value))
    highlights.push({
      hlGroup: 'ReactNativeDevtoolsConsoleItemNumber',
      line: lines.length,
      colStart: 0,
      colEnd: lines[0].length,
      srcId,
    })
  } else if (item.type === 'object') {
    let description = 'unknown'
    if (item.description) {
      let endIndex = item.description.indexOf('\n')
      if (endIndex === -1) {
        endIndex = item.description.length
      }
      description = item.description.substring(0, endIndex)
    }
    if (
      (item as Runtime.RemoteObject).preview ||
      (item as Runtime.ObjectPreview).properties
    ) {
      if (item.expanded) {
        lines.push(`▲[${description}]`)
        highlights.push({
          hlGroup: 'ReactNativeDevtoolsConsoleItemObject',
          line: lines.length - 1,
          colStart: 0,
          colEnd: lines[lines.length - 1].length,
          srcId,
        })
        // TODO render properties
        lines.push(
          ...(
            (item as Runtime.RemoteObject).preview ??
            (item as Runtime.ObjectPreview)
          ).properties.map(({name}) => `${indent}  ${name}`),
        )
      } else {
        lines.push(`▼[${description}]`)
        highlights.push({
          hlGroup: 'ReactNativeDevtoolsConsoleItemObject',
          line: lines.length - 1,
          colStart: 0,
          colEnd: lines[lines.length - 1].length,
          srcId,
        })
      }
    } else {
      highlights.push({
        hlGroup: 'ReactNativeDevtoolsConsoleItemObject',
        line: lines.length,
        colStart: 0,
        colEnd: description.length,
        srcId,
      })
      lines.push(description)
    }
  } else {
    lines.push('force-new-line')
    lines.push(JSON.stringify(item))
  }
  return [lines, highlights]
}
