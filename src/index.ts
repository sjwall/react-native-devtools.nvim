import {Logger} from './Logger'
import {ManagerHosts} from './hosts/ManagerHosts'
import {setupTargets} from './targets/setupTargets'
import {NvimPlugin} from 'neovim'

module.exports = async (plugin: NvimPlugin) => {
  plugin.setOptions({dev: true})
  const logger = new Logger()
  const managerHosts = new ManagerHosts(plugin, logger)

  setupTargets(plugin, {managerHosts, logger})

  plugin.registerFunction('RNDConsoleOpen', async ([host, target]) => {
    return managerHosts.find(host ?? 'http://localhost:8081')?.connect()
  })

  plugin.registerFunction('RNDConsoleClose', async ([host, target]) => {
    return managerHosts.find(host ?? 'http://localhost:8081')?.close()
  })
}
