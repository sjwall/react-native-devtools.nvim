import {expect, test, describe} from 'vitest'
import {renderString} from './renderer'

describe('renderString', () => {
  test('single line', () => {
    expect(renderString('single line string', {}, 2)).toStrictEqual([
      ['"single line string"'],
      [
        {
          colEnd: 19,
          colStart: 0,
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: 0,
          srcId: 2,
        },
      ],
      [],
    ])
  })

  test('single line with name', () => {
    expect(renderString('single line string', {}, 2, 'field name')).toStrictEqual([
      ['field name: "single line string"'],
      [
        {
          colEnd: 11,
          colStart: 0,
          hlGroup: 'ReactNativeDevtoolsConsoleItemName',
          line: 0,
          srcId: 2,
        },
        {
          colEnd: 31,
          colStart: 12,
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: 0,
          srcId: 2,
        },
      ],
      [],
    ])
  })

  test('multi line collapsed', () => {
    expect(renderString('multi\nline\nstring', {}, 2)).toStrictEqual([
      ['▼"multi..."'],
      [
        {
          colEnd: 10,
          colStart: 1,
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: 0,
          srcId: 2,
        },
      ],
      [{colEnd: 10, colStart: 0, line: 0, item: {}}],
    ])
  })

  test('multi line expanded', () => {
    expect(renderString('multi\nline\nstring', {expanded: true}, 2)).toStrictEqual([
      ['▲"multi', 'line', 'string"'],
      [
        {
          colEnd: 6,
          colStart: 1,
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: 0,
          srcId: 2,
        },
        {
          colEnd: 3,
          colStart: 0,
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: 1,
          srcId: 2,
        },
        {
          colEnd: 6,
          colStart: 0,
          hlGroup: 'ReactNativeDevtoolsConsoleItemString',
          line: 2,
          srcId: 2,
        },
      ],
      [
     {
       "colEnd": 6,
       "colStart": 0,
       "item": {
         "expanded": true,
       },
       "line": 0,
     },
     {
       "colEnd": 3,
       "colStart": 0,
       "item": {
         "expanded": true,
       },
       "line": 1,
     },
     {
       "colEnd": 6,
       "colStart": 0,
       "item": {
         "expanded": true,
       },
       "line": 2,
     },
   ],
    ])
  })
})
