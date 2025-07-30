import {Logger} from '../Logger'
import {Host} from './Host'
import {NvimPlugin} from 'neovim'

export class ManagerHosts {
  #plugin: NvimPlugin
  #logger: Logger

  #hosts: Host[] = []

  get hosts(): readonly Host[] {
    return [...this.#hosts]
  }

  constructor(plugin: NvimPlugin, logger: Logger) {
    this.#plugin = plugin
    this.#logger = logger
    this.#hosts.push(new Host('http://localhost:8081', plugin, logger))
  }

  find = (urlToFind: string): Host | undefined =>
    this.#hosts.find(({url}) => url == urlToFind)

  add = (newUrl: string): Host => {
    let host = this.find(newUrl)
    if (host) {
      return host
    }
    host = new Host(newUrl, this.#plugin, this.#logger)
    this.#hosts.push(host)
    return host
  }
}
