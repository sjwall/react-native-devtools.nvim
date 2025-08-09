import {NvimPlugin} from 'neovim'
import {Logger} from './Logger'
import {ManagerServers} from './servers/ManagerServers'
import {setupHighlightGroups} from './setupHighlightGroups'
import {setupTargets} from './targets/setupTargets'
import {getCurrentConsoleBuffer} from './utils/getCurrentConsoleBuffer'

module.exports = async (plugin: NvimPlugin) => {
  setupHighlightGroups(plugin)
  const logger = new Logger(plugin)
  const managerServers = new ManagerServers(plugin, logger)

  setupTargets(plugin, {managerServers, logger})

  plugin.registerFunction(
    'RNDConsoleOpen',
    async ([url, target]: [string, string]) => {
      const server = managerServers.find(url ?? 'http://localhost:8081')
      const targets = await server?.refreshTargets()
      if (targets?.isOk()) {
        const connection = await server!.connectToTarget(
          targets.value.find((item) => item.id === target) ?? targets.value[0],
        )
        connection.openConsole()
      }
    },
  )

  plugin.registerFunction(
    'RNDConsoleClose',
    async ([url, target]: [string, string]) => {
      const server = managerServers.find(url ?? 'http://localhost:8081')
      await server?.disconnectTarget(target)
    },
  )

  plugin.registerFunction('RNDConsoleExpandToggle', async () => {
    const currentBuffer = await getCurrentConsoleBuffer(plugin)
    if (currentBuffer) {
      for (let i = 0; i < managerServers.servers.length; i++) {
        const server = managerServers.servers[i]
        for (let j = 0; j < server.connections.length; j++) {
          const connection = server.connections[j]
          if (connection.consoleBuffer?.buffer === currentBuffer.id) {
            await connection.consoleBuffer.onToggleExpand()
            return
          }
        }
      }
    }
  })
}
