import {NvimPlugin} from 'neovim'
import {Logger} from '../Logger'
import {ManagerServers} from '../servers/ManagerServers'
import {error, info} from '../utils/messages'

export type TargetsOptions = {
  managerServers: ManagerServers
  logger: Logger
}

export function setupTargets(
  plugin: NvimPlugin,
  {managerServers, logger}: TargetsOptions,
) {
  plugin.registerCommand('RNDUITargets', async () => {
    await logger.trace('RNDUITargets')
    const result = await managerServers.servers[0].refreshTargets()

    if (result.isErr()) {
      await logger.trace('RNDUITargets: failed to refresh')
      return error(
        plugin,
        `Failed to list React Native targets!\n${result.error}`,
      )
    } else if (result.value.length === 0) {
      return info(plugin, `# Targets\nThere are no targets.`)
    } else {
      return info(
        plugin,
        `# Targets\n${result.value
          .filter(
            ({reactNative}) => reactNative.capabilities.prefersFuseboxFrontend,
          )
          .map(({id, title}) => `- ${id} ${title}`)
          .join('\n')}\n`,
      )
    }
  })

  plugin.registerFunction('RNDTargets', async () => {
    await logger.trace('RNDTargets')
    const result = await managerServers.servers[0].refreshTargets()

    if (result.isErr() || result.value.length === 0) {
      await logger.trace('RNDTargets: failed to refresh')
      return []
    }

    await logger.trace(`RNDTargets: found ${result.value.length} targets`)
    return result.value
  })
}
