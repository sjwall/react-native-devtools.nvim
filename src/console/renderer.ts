import {Runtime} from 'react-native-devtools-frontend'
import {BufferHighlight} from 'neovim/lib/api/Buffer'
import {ConsoleObject, Expandable, ExpandableRef} from './ConsoleObject'

export type RenderResult = [string[], BufferHighlight[], ExpandableRef[]]

function mergeResults(
  [intoLines, intoHighlights, intoExpandables]: RenderResult,
  [newLines, newHighlights, newExpandables]: RenderResult,
) {
  const baseLine = intoLines.length
  intoLines.push(...newLines)
  intoHighlights.push(
    ...newHighlights.map((highlight) => ({
      ...highlight,
      line: baseLine + (highlight.line ?? 0),
    })),
  )
  intoExpandables.push(
    ...newExpandables.map((expandable) => ({
      ...expandable,
      line: baseLine + expandable.line,
    })),
  )
}

function renderExpanded(expanded: boolean | undefined) {
  return `${expanded ? '▲' : '▼'}`
}

function renderName(name: string | undefined) {
  return `${name ? `${name}: ` : ''}`
}

export function renderString(
  value: string,
  item: Expandable,
  srcId: number,
  name?: string,
): RenderResult {
  const lines: string[] = []
  const highlights: BufferHighlight[] = []
  const expandables: ExpandableRef[] = []
  const newLineIndex = value.indexOf('\n')
  if (newLineIndex > -1) {
    const [firstLine, ...rest] = value.split('\n')
    const prefix = `${renderExpanded(item.expanded)}${renderName(name)}`
    if (item.expanded) {
      lines.push(`${prefix}"${firstLine}`)
      lines.push(...rest)
      lines[lines.length - 1] += '"'
      expandables.push(
        ...rest.map((restLine, index) => ({
          line: index + 1,
          colStart: 0,
          colEnd: restLine.length - 1 + (index === rest.length - 1 ? 1 : 0),
          item,
        })),
      )
    } else {
      lines.push(`${prefix}"${firstLine}..."`)
    }
    expandables.splice(0, 0, {
      line: 0,
      colStart: 0,
      colEnd: lines[0].length - 1,
      item,
    })
    highlights.push({
      hlGroup: 'ReactNativeDevtoolsConsoleItemString',
      line: 0,
      colStart: prefix.length,
      colEnd: lines[0].length - 1,
      srcId,
    })
    lines.forEach((line, index) => {
      if (index === 0) {
        return
      }
      highlights.push({
        hlGroup: 'ReactNativeDevtoolsConsoleItemString',
        line: index,
        colStart: 0,
        colEnd: line.length - 1,
        srcId,
      })
    })
  } else {
    const outputName = renderName(name)
    if (outputName) {
      highlights.push({
        hlGroup: 'ReactNativeDevtoolsConsoleItemName',
        line: lines.length,
        colStart: 0,
        colEnd: outputName.length - 1,
        srcId,
      })
    }
    lines.push(`${outputName}"${value}"`)
    highlights.push({
      hlGroup: 'ReactNativeDevtoolsConsoleItemString',
      line: lines.length - 1,
      colStart: outputName.length,
      // FIXME why no -1 here?
      colEnd: lines[lines.length - 1].length,
      srcId,
    })
  }
  return [lines, highlights, expandables]
}

export function renderNumber(
  value: number,
  item: Expandable,
  srcId: number,
  name?: string,
): RenderResult {
  const renderedName = renderName(name)
  const renderedValue = String(value)
  return [
    [`${renderedName}${renderedValue}`],
    [
      {
        hlGroup: 'ReactNativeDevtoolsConsoleItemNumber',
        line: 0,
        colStart: renderedName.length,
        colEnd: renderName.length + renderedValue.length,
        srcId,
      },
    ],
    [],
  ]
}

export function renderObjectPreview(
  item: Runtime.ObjectPreview & Expandable,
  srcId: number,
  name?: string,
): RenderResult {
  const lines: string[] = []
  const highlights: BufferHighlight[] = []
  const expandables: ExpandableRef[] = []
  let description = 'unknown'
  if (item.description) {
    let endIndex = item.description.indexOf('\n')
    if (endIndex === -1) {
      endIndex = item.description.length
    }
    description = item.description.substring(0, endIndex)
  }
  if (item.expanded) {
    lines.push(`▲${name ? `${name}: ` : ''}[${description}]`)
    expandables.push({
      line: 0,
      colStart: 0,
      colEnd: lines[0].length,
      item,
    })
    highlights.push({
      hlGroup: 'ReactNativeDevtoolsConsoleItemObject',
      line: 0,
      colStart: 0,
      colEnd: lines[0].length,
      srcId,
    })
    const properties = item.properties
    properties.forEach((property: Runtime.PropertyPreview & Expandable) => {
      let result: RenderResult
      if (property.valuePreview) {
        result = renderObjectPreview(
          property.valuePreview,
          srcId,
          property.name,
        )
      } else {
        result = renderString(
          property.value ?? 'unknown',
          property,
          srcId,
          property.name,
        )
      }
      mergeResults([lines, highlights, expandables], result)
    })
  } else {
    lines.push(`▼${name ? `${name}: ` : ''}[${description}]`)
    expandables.push({
      line: 0,
      colStart: 0,
      colEnd: lines[0].length,
      item,
    })
    highlights.push({
      hlGroup: 'ReactNativeDevtoolsConsoleItemObject',
      line: lines.length - 1,
      colStart: 0,
      colEnd: lines[lines.length - 1].length,
      srcId,
    })
  }
  return [lines, highlights, expandables]
}

export function renderRemoteObject(
  item: Runtime.RemoteObject & Expandable,
  srcId: number,
  name?: string,
): RenderResult {
  const lines: string[] = []
  const highlights: BufferHighlight[] = []
  const value = (item as Runtime.RemoteObject).value ?? item.description
  const expandables: ExpandableRef[] = []

  if (item.type === 'string') {
    const result = renderString(value, item, srcId)
    mergeResults([lines, highlights, expandables], result)
  } else if (item.type === 'number') {
    const result = renderNumber(value, item, srcId)
    mergeResults([lines, highlights, expandables], result)
  } else if (item.type === 'object') {
    let description = 'unknown'
    if (item.description) {
      let endIndex = item.description.indexOf('\n')
      if (endIndex === -1) {
        endIndex = item.description.length
      }
      description = item.description.substring(0, endIndex)
    }
    if ((item as Runtime.RemoteObject).preview) {
      const result = renderObjectPreview(item.preview!, srcId)
      mergeResults([lines, highlights, expandables], result)
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
  return [lines, highlights, expandables]
}
