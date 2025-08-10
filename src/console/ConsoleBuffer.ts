import {type Message, Runtime} from 'react-native-devtools-frontend'
import assert from 'node:assert'
import {NvimPlugin} from 'neovim'
import {Buffer, BufferHighlight} from 'neovim/lib/api/Buffer'
import PQueue from 'p-queue'
import {WebSocket} from 'ws'
import {Logger} from '../Logger'
import {Target} from '../targets/Target'
import {createConsoleBuffer} from '../utils/createConsoleBuffer'
import {parseUrl} from '../utils/parseUrl'
import {ConsoleMessage} from './ConsoleMessage'
import {ConsoleMessageLog} from './ConsoleMessageLog'
import {ConsoleMessageStatic} from './ConsoleMessageStatic'
import {Expandable} from './ConsoleObject'

export class ConsoleBuffer {
  #url: string
  #target: Target
  #plugin: NvimPlugin
  #ws: WebSocket
  #logger: Logger

  #queue = new PQueue({concurrency: 1})
  #src: ConsoleMessage[] = []
  #buffer: Buffer | null = null
  get buffer() {
    return this.#buffer?.id
  }
  #highlights: BufferHighlight[] = []
  #expandables: Expandable[] = []
  #ns!: number

  constructor(
    url: string,
    target: Target,
    plugin: NvimPlugin,
    ws: WebSocket,
    logger: Logger,
  ) {
    this.#url = url
    this.#target = target
    this.#plugin = plugin
    this.#ws = ws
    this.#logger = logger
  }

  async init() {
    this.#ns = await this.#plugin.nvim.createNamespace('ReactNativeDevtools')
    this.#buffer = await createConsoleBuffer(this.#plugin)
    const [_, path] = parseUrl(this.#url)
    this.#buffer.name = `rndt://${path}/${this.#target.deviceName}/${this.#target.appId}`

    this.#plugin.nvim.command(
      'nmap <buffer> <silent> <CR> :call RNDConsoleExpandToggle()<CR>',
    )

    this.#plugin.nvim.command(
      `au BufDelete <buffer=${this.#buffer.id}> call RNDConsoleClose(${this.#buffer.id})`,
    )

    this.#ws.onmessage = (event) => {
      ;(async () => {
        await this.#logger.trace(`message recieved: ${event.type}`)
        if (event.type === 'message') {
          try {
            await this.#logger.log('message', event.data as string)
            const result: Message = JSON.parse(event.data as string)
            if (result.method === 'Runtime.consoleAPICalled') {
              assert(
                result.params != null,
                'ReactNativeDevtools: Malformed Runtime.consoleAPICalled',
              )
              const event = result.params as Runtime.ConsoleAPICalledEvent
              const log = event.args.filter(
                ({type, value}) =>
                  type !== 'string' ||
                  !value.includes(
                    'You are using an unsupported debugging client. Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools.',
                  ),
              )

              if (log.length === 0) {
                return
              }

              const consoleMessage = new ConsoleMessageLog(event, this.#ns)

              await this.appendToBuffer(consoleMessage)
            } else {
              await this.appendToBuffer(
                `unhandled method ${result.method ?? 'no method'}`,
              )
            }
          } catch (e) {
            const message = `Failed to process message - ${e.message}: ${event.type} - ${String(event.data)}`
            await this.appendToBuffer(
              new ConsoleMessageStatic(message, [
                {
                  hlGroup: `ReactNativeDevtoolsErrorText`,
                  colStart: 0,
                  colEnd: message.length,
                  srcId: this.#ns,
                },
              ]),
            )
          }
        }
      })()
    }

    this.#ws.on('close', (code, reason) => {
      this.appendToBuffer(`WebSocket connection closed ${code} ${reason}`)
    })

    this.#ws.on('error', (err: Error) => {
      this.appendToBuffer(`WebSocket error: ${err.message}`)
    })
  }

  appendToBuffer = async (consoleMessage: ConsoleMessage | string) => {
    if (typeof consoleMessage === 'string') {
      consoleMessage = new ConsoleMessageStatic(consoleMessage)
    }
    return this.#queue.add(() => this.#doAppendToBuffer(consoleMessage))
  }

  #doAppendToBuffer = async (consoleMessage: ConsoleMessage) => {
    if (this.#buffer === null) return

    const [messages, highlights, expandables] = consoleMessage.render()
    const linesLength = await this.#buffer.length

    await this.#buffer.setOption('modifiable', true)
    // Empty buffer has 1 line so if no cached messages clear the buffer
    if (this.#src.length === 0) {
      await this.#buffer.setLines(messages, {
        start: 0,
        end: -1,
        strictIndexing: false,
      })
    } else {
      await this.#buffer.append(messages)
    }

    this.#highlights.push(
      ...highlights.map((highlight) => ({
        ...highlight,
        line:
          linesLength -
          (this.#src.length === 0 ? 1 : 0) +
          (highlight.line ?? 0),
      })),
    )
    this.#expandables.push(
      ...expandables.map((expandable) => ({
        ...expandable,
        line: linesLength + expandable.line,
      })),
    )
    this.#applyHighlights()
    await this.#buffer.setOption('modifiable', false)
    this.#src.push(consoleMessage)
  }

  async #applyHighlights() {
    this.#buffer!.clearNamespace({nsId: this.#ns})
    await Promise.allSettled(
      this.#highlights.map((item) => this.#buffer!.addHighlight(item)),
    )
  }

  async #rerenderBuffer() {
    if (this.#buffer === null) return
    this.#highlights = []
    this.#expandables = []
    const lines: string[] = []
    this.#src.forEach((consoleMessage) => {
      const [itemLines, itemHighlights, itemExpandables] =
        consoleMessage.render()
      this.#highlights.push(
        ...itemHighlights.map((highlight) => ({
          ...highlight,
          line: (highlight.line ?? 0) + lines.length,
        })),
      )
      this.#expandables.push(
        ...itemExpandables.map((expandable) => ({
          ...expandable,
          line: expandable.line + lines.length,
        })),
      )
      lines.push(...itemLines)
    })
    await this.#buffer.setOption('modifiable', true)
    await this.#buffer.setLines(lines, {
      start: 0,
      end: -1,
      strictIndexing: false,
    })
    this.#applyHighlights()
    await this.#buffer.setOption('modifiable', false)
  }

  async onToggleExpand() {
    const cursor = await (await this.#plugin.nvim.window).cursor
    const [line, col] = cursor
    const item = this.#expandables.find(
      (expandable) =>
        expandable.line === line - 1 &&
        col >= expandable.colStart &&
        col - 1 <= expandable.colEnd,
    )
    if (item) {
      item.item.expanded = !item.item.expanded
      await this.#rerenderBuffer()
    }
  }

  close = async (deleteBuffer = false) => {
    let result: Promise<void>
    if (deleteBuffer && this.#buffer !== null) {
      result = this.#plugin.nvim.call('nvim_buf_delete', [this.#buffer.id, {}])
    } else {
      result = Promise.resolve()
    }
    this.#buffer = null
    this.#highlights = []
    this.#src = []
    this.#expandables = []
    this.#ws.close()
    return result
  }
}
