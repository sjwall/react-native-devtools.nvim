import {NvimPlugin} from 'neovim'
import {Logger} from '../Logger'
import {Server} from './Server'

export class ManagerServers {
  #plugin: NvimPlugin
  #logger: Logger

  #servers: Server[] = []

  get servers(): readonly Server[] {
    return [...this.#servers]
  }

  constructor(plugin: NvimPlugin, logger: Logger) {
    this.#plugin = plugin
    this.#logger = logger
    this.#servers.push(new Server('http://localhost:8081', plugin, logger))
  }

  find = (urlToFind: string): Server | undefined =>
    this.#servers.find(({url}) => url == urlToFind)

  add = (newUrl: string): Server => {
    let server = this.find(newUrl)
    if (server) {
      return server
    }
    server = new Server(newUrl, this.#plugin, this.#logger)
    this.#servers.push(server)
    return server
  }
}
