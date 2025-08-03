import {NvimPlugin} from 'neovim'
import {WebSocket} from 'ws'
import {Logger} from '../Logger'
import {ConsoleBuffer} from '../console/ConsoleBuffer'
import {Target} from '../targets/Target'
import {fetchData} from '../utils/fetchData'
import {info, warn} from '../utils/messages'

export class Server {
  #url: string

  get url() {
    return this.#url
  }

  #targets: Target[] = []

  get targets() {
    return this.#targets
  }

  #ws: WebSocket | null = null

  #plugin: NvimPlugin
  #logger: Logger

  constructor(url: string, plugin: NvimPlugin, logger: Logger) {
    this.#url = url
    this.#plugin = plugin
    this.#logger = logger
  }

  async refreshTargets() {
    const result = await fetchData<Target[]>(`${this.#url}/json`)
    if (result.isOk()) {
      this.#targets = result.value
    }
    return result
  }

  connect = async () => {
    await this.#logger.trace('Server:connect')
    const result = await this.refreshTargets()

    if (result.isErr() || result.value.length === 0) {
      warn(this.#plugin, 'No targets to connect to!')
      return
    }

    const target = result.value[0]

    const url = target.webSocketDebuggerUrl
    info(this.#plugin, `Connecting to WebSocket... ${url}`)

    this.#ws = new WebSocket(url)

    this.#ws.on('open', () => {
      info(this.#plugin, 'WebSocket connection opened')
      const message = JSON.stringify({id: 1, method: 'Runtime.enable'})
      this.#ws?.send(message)
      new ConsoleBuffer(
        this.#url,
        target,
        this.#plugin,
        this.#ws!,
        this.#logger,
      ).init()
    })
  }

  close = async () => {
    if (this.#ws) {
      this.#ws.close()
      this.#ws = null
    }
  }
}
