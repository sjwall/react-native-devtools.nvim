import {NvimPlugin} from 'neovim'
import {WebSocket} from 'ws'
import {Logger} from '../Logger'
import {ConsoleBuffer} from '../console/ConsoleBuffer'
import {info} from '../utils/messages'
import {Target} from './Target'

export class TargetConnection {
  #ws: WebSocket | null = null
  #plugin: NvimPlugin
  #logger: Logger
  #target: Target

  get target() {
    return this.#target
  }

  #url: string
  #consoleBuffer: ConsoleBuffer | null = null

  constructor(plugin: NvimPlugin, logger: Logger, target: Target, url: string) {
    this.#plugin = plugin
    this.#logger = logger
    this.#target = target
    this.#url = url
  }

  connect = async () => {
    await this.#logger.trace('TargetConnection:connect')

    const url = this.#target.webSocketDebuggerUrl
    info(this.#plugin, `Connecting to WebSocket... ${url}`)

    this.#ws = new WebSocket(url)

    this.#ws.on('open', () => {
      info(this.#plugin, 'WebSocket connection opened')
      const message = JSON.stringify({id: 1, method: 'Runtime.enable'})
      this.#ws?.send(message)
    })

    return this
  }

  openConsole = async () => {
    if (this.#consoleBuffer !== null) {
      return
    }
    this.#consoleBuffer = new ConsoleBuffer(
      this.#url,
      this.#target,
      this.#plugin,
      this.#ws!,
      this.#logger,
    )
    this.#consoleBuffer.init()
  }

  closeConsoleBuffer = () => {
    this.#consoleBuffer?.close()
    this.#consoleBuffer = null
  }

  close = async () => {
    this.closeConsoleBuffer()
    if (this.#ws) {
      this.#ws.close()
      this.#ws = null
    }
  }
}
