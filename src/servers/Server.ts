import {NvimPlugin} from 'neovim'
import {Logger} from '../Logger'
import {Target} from '../targets/Target'
import {TargetConnection} from '../targets/TargetConnection'
import {fetchData} from '../utils/fetchData'

export class Server {
  #url: string

  get url() {
    return this.#url
  }

  #targets: Target[] = []

  get targets() {
    return this.#targets
  }

  #connections: TargetConnection[] = []

  get connections() {
    return [...this.#connections]
  }

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

  findConnection = (targetId: string) =>
    this.#connections.find((item) => item.target.id === targetId)

  connectToTarget = async (target: Target) => {
    let targetConnection = this.findConnection(target.id)
    if (targetConnection) {
      return targetConnection
    }

    targetConnection = new TargetConnection(
      this.#plugin,
      this.#logger,
      target,
      this.#url,
    )
    await targetConnection.connect()
    this.#connections.push(targetConnection)
    return targetConnection
  }

  disconnectTarget = async (targetId: string) => {
    const index = this.connections.findIndex((item) => item.target.id = targetId)
    if (index >= 0) {
      const [connection] = this.connections.splice(index, 1)
      connection.close()
    }
  }
}
