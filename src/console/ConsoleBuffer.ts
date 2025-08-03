import assert from 'node:assert'
import {NvimPlugin} from 'neovim'
import {Buffer, BufferHighlight} from 'neovim/lib/api/Buffer'
import PQueue from 'p-queue'
import {WebSocket} from 'ws'
import {Logger} from '../Logger'
import {type Message} from '../ReactNativeDevtools'
import {Target} from '../targets/Target'
import {createConsoleBuffer} from '../utils/createConsoleBuffer'
import {parseUrl} from '../utils/parseUrl'

type BufferHighlightLine = Omit<BufferHighlight, 'line'>

export class ConsoleBuffer {
  #url: string
  #target: Target
  #plugin: NvimPlugin
  #ws: WebSocket
  #logger: Logger

  #queue = new PQueue({concurrency: 1})
  #buffer: Buffer | null = null
  #highlights: BufferHighlight[] = []
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
              const messages = result.params.args
                .map(({value}: {value: string}) => value)
                .filter(
                  (value: string) =>
                    !value.includes(
                      'You are using an unsupported debugging client. Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools.',
                    ),
                )

              if (messages.length === 0) {
                return
              }

              const createMessage = (
                parts: [string, string][],
              ): [string, BufferHighlightLine[]] => {
                const hightlights: BufferHighlightLine[] = []
                let message = ''
                parts.forEach(([part, hlGroup]) => {
                  if (message.length > 0) {
                    message += ' '
                  }
                  const colStart = message.length
                  message += part
                  hightlights.push({
                    hlGroup,
                    colStart,
                    colEnd: message.length,
                    srcId: this.#ns,
                  })
                })
                return [message, hightlights]
              }
              const type = `${result.params.type[0].toUpperCase()}${result.params.type.substring(1)}`
              const [message, highlights] = createMessage([
                [
                  new Date(result.params.timestamp).toLocaleTimeString(),
                  'ReactNativeDevtoolsTimestamp',
                ],
                [type, `ReactNativeDevtools${type}Title`],
                [messages.join(', '), `ReactNativeDevtools${type}Text`],
              ])
              await this.appendToBuffer(message, ...highlights)
            } else {
              await this.appendToBuffer(
                `unhandled method ${result.method ?? 'no method'}`,
              )
            }
          } catch (e) {
            const message = `Failed to process message - ${e.message}: ${event.type} - ${String(event.data)}`
            await this.appendToBuffer(message, {
              hlGroup: `ReactNativeDevtoolsErrorText`,
              colStart: 0,
              colEnd: message.length,
              srcId: this.#ns,
            })
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

  appendToBuffer = async (
    line: string,
    ...highlights: BufferHighlightLine[]
  ) => {
    return this.#queue.add(() => this.#doAppendToBuffer(line, ...highlights))
  }

  #doAppendToBuffer = async (
    line: string,
    ...highlights: BufferHighlightLine[]
  ) => {
    if (this.#buffer === null) return
    let lines = await this.#buffer.lines
    await this.#buffer.setOption('modifiable', true)
    if (lines.length === 1 && lines[0] === '') {
      lines = [line]
    } else {
      lines.push(line)
    }
    await this.#buffer.setLines(lines, {
      start: 0,
      end: -1,
      strictIndexing: false,
    })
    this.#buffer.clearNamespace({nsId: this.#ns})
    this.#highlights.push(
      ...highlights.map((highlight) => ({
        ...highlight,
        line: lines.length - 1,
      })),
    )
    await Promise.allSettled(
      this.#highlights.map((item) => this.#buffer!.addHighlight(item)),
    )
    await this.#buffer.setOption('modifiable', false)
  }

  close = async () => {
    const result = this.#plugin.nvim.call('nvim_buf_delete', [
      this.#buffer!.id,
      {},
    ])
    this.#buffer = null
    return result
  }
}
