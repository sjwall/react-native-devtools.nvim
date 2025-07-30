import {Logger} from '../Logger'
import {ManagerHosts} from '../hosts/ManagerHosts'
import {error, info} from '../utils/messages'
import {NvimPlugin} from 'neovim'

export type TargetsOptions = {
  managerHosts: ManagerHosts
  logger: Logger
}

export function setupTargets(
  plugin: NvimPlugin,
  {managerHosts, logger}: TargetsOptions,
) {
  plugin.registerCommand('RNDUITargets', async () => {
    await logger.trace('RNDUITargets')
    const result = await managerHosts.hosts[0].managerTargets.refresh()

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
    const result = await managerHosts.hosts[0].managerTargets.refresh()

    if (result.isErr() || result.value.length === 0) {
      await logger.trace('RNDTargets: failed to refresh')
      return []
    }

    return result.value
  })
}
