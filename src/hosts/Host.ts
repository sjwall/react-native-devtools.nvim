import assert from 'node:assert'
import {Logger} from '../Logger'
import {type Message} from '../ReactNativeDevtools'
import {ManagerTargets} from '../targets/ManagerTargets'
import {createConsoleBuffer} from '../utils/createConsoleBuffer'
import {parseUrl} from '../utils/parseUrl'
import {NvimPlugin} from 'neovim'
import {Buffer, BufferHighlight} from 'neovim/lib/api/Buffer'
import PQueue from 'p-queue'
import {WebSocket} from 'ws'

type BufferHighlightLine = Omit<BufferHighlight, 'line'>

export class Host {
  #url: string

  get url() {
    return this.#url
  }

  #managerTargets: ManagerTargets

  get managerTargets() {
    return this.#managerTargets
  }

  #ws: WebSocket | null = null
  #buffer: Buffer | null = null
  #highlights: BufferHighlight[] = []

  #plugin: NvimPlugin
  #logger: Logger
  #ns: number
  #queue = new PQueue({concurrency: 1})

  constructor(url: string, plugin: NvimPlugin, logger: Logger) {
    this.#url = url
    this.#plugin = plugin
    this.#logger = logger
    this.#managerTargets = new ManagerTargets(url)
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

  connect = async () => {
    await this.#logger.trace('StartWebSocketFeed')
    this.#ns = await this.#plugin.nvim.createNamespace('ReactNativeDevtools')
    const result = await this.#managerTargets.refresh()

    this.#buffer = await createConsoleBuffer(this.#plugin)
    const [_, path] = parseUrl(this.#url)
    this.#buffer.name = `rndt://${path}/${this.#managerTargets.targets[0].deviceName}/${this.#managerTargets.targets[0].appId}`

    if (result.isErr() || result.value.length === 0) {
      await this.appendToBuffer('No targets to connect to!')
      return
    }

    const target = result.value[0]

    const url = target.webSocketDebuggerUrl
    await this.appendToBuffer(`Connecting to WebSocket... ${url}`)

    this.#ws = new WebSocket(url)

    this.#ws.on('open', () => {
      this.appendToBuffer('WebSocket connection opened')
      const message = JSON.stringify({id: 1, method: 'Runtime.enable'})
      this.appendToBuffer(message)
      this.#ws?.send(message)
    })

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
                .map(({value}) => value)
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

    // ws.on('message', (data: string) => {
    //   appendToBuffer(`WS Message: ${data}`);
    // });

    this.#ws.on('close', (code, reason) => {
      this.#ws = null
      this.appendToBuffer(`WebSocket connection closed ${code} ${reason}`)
    })

    this.#ws.on('error', (err: Error) => {
      this.appendToBuffer(`WebSocket error: ${err.message}`)
    })
  }

  close = async () => {
    if (this.#ws) {
      this.#ws.close()
      this.#ws = null
    }
  }
}
