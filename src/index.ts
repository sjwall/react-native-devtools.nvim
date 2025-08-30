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
    {sync: false},
  )

  plugin.registerFunction(
    'RNDConsoleClose',
    async (args: [string | number, string] | undefined) => {
      let [url, target]: [string | number | undefined, string | undefined] = [
        undefined,
        undefined,
      ]
      if (args) {
        ;[url, target] = args
      }
      if (typeof url !== 'number') {
        const server = managerServers.find(url ?? 'http://localhost:8081')
        if (server) {
          if (target) {
            await server?.disconnectTarget(target)
          } else {
            await Promise.allSettled(
              server.connections.map((connection) => connection.close()),
            )
          }
        }
      } else {
        managerServers.servers.find((server) => {
          return server.connections.find((connection) => {
            if (connection.consoleBuffer?.buffer === url) {
              connection.close()
              return true
            }
          })
        })
      }
    },
    {sync: false},
  )

  plugin.registerFunction(
    'RNDConsoleExpandToggle',
    async () => {
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
    },
    {sync: false},
  )
}
