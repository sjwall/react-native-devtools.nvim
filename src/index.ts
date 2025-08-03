import {Logger} from './Logger'
import {ManagerServers} from './servers/ManagerServers'
import {setupHighlightGroups} from './setupHighlightGroups'
import {setupTargets} from './targets/setupTargets'
import {NvimPlugin} from 'neovim'

module.exports = async (plugin: NvimPlugin) => {
  plugin.setOptions({dev: true})
  setupHighlightGroups(plugin)
  const logger = new Logger()
  const managerServers = new ManagerServers(plugin, logger)

  setupTargets(plugin, {managerServers, logger})

  plugin.registerFunction(
    'RNDConsoleOpen',
    async ([url, target]: [string, string]) => {
      return managerServers.find(url ?? 'http://localhost:8081')?.connect()
    },
  )

  plugin.registerFunction(
    'RNDConsoleClose',
    async ([url, target]: [string, string]) => {
      return managerServers.find(url ?? 'http://localhost:8081')?.close()
    },
  )
}
