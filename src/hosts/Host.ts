import {Logger} from '../Logger'
import {ManagerTargets} from '../targets/ManagerTargets'
import {createConsoleBuffer} from '../utils/createConsoleBuffer'
import {type Message} from '@frontend/core/protocol_client/InspectorBackend'
import {NvimPlugin} from 'neovim'
import {Buffer} from 'neovim/lib/api/Buffer'
import {WebSocket} from 'ws'

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

  #plugin: NvimPlugin
  #logger: Logger

  constructor(url: string, plugin: NvimPlugin, logger: Logger) {
    this.#url = url
    this.#plugin = plugin
    this.#logger = logger
    this.#managerTargets = new ManagerTargets(url)
  }

  appendToBuffer = async (line: string) => {
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
    await this.#buffer.setOption('modifiable', false)
  }

  connect = async () => {
    await this.#logger.trace('StartWebSocketFeed')
    const result = await this.#managerTargets.refresh()

    this.#buffer = await createConsoleBuffer(this.#plugin)

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
              const messages = result.params.args
                .map(({value}) => value)
                .filter(
                  (value) =>
                    !value.includes(
                      'You are using an unsupported debugging client. Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools.',
                    ),
                )
              await this.appendToBuffer(
                `${new Date(result.params.timestamp).toLocaleTimeString()} ${result.params.type} ${messages.join(',')}`,
              )
            } else {
              await this.appendToBuffer(
                `unhandled method ${result.method ?? 'no method'}`,
              )
            }
          } catch (e) {}
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
