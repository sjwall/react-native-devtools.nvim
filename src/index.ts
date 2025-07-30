import {Logger} from './Logger'
import {ManagerHosts} from './hosts/ManagerHosts'
import {setupTargets} from './targets/setupTargets'
import {NvimPlugin} from 'neovim'

module.exports = async (plugin: NvimPlugin) => {
  plugin.setOptions({dev: true})
  const logger = new Logger()
  const managerHosts = new ManagerHosts(plugin, logger)

  setupTargets(plugin, {managerHosts, logger})

  plugin.registerFunction('StartWebSocketFeed', async () => {
    return managerHosts.hosts[0].connect()
  })

  plugin.registerFunction('StopWebSocketFeed', async () => {
    return managerHosts.hosts[0].close()
  })
}
