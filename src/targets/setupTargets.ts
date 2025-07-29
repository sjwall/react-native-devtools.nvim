import {Logger} from '../Logger'
import {error, info} from '../utils/messages'
import {ManagerTargets} from './ManagerTargets'
import {NvimPlugin} from 'neovim'

export type TargetsOptions = {
  managerTargets: ManagerTargets
  logger: Logger
}

export function setupTargets(
  plugin: NvimPlugin,
  {managerTargets, logger}: TargetsOptions,
) {
  plugin.registerFunction('RNDUITargets', async () => {
    await logger.trace('RNDUITargets')
    const result = await managerTargets.refresh()

    if (result.isErr()) {
      await logger.trace('RNDUITargets: failed to refresh')
      return error(
        plugin,
        `Failed to list React Native targets!\n${result.error}`,
      )
    } else if (result.value.length === 0) {
      return info(plugin, `# Targets\nThere are no targets.`)
    } else {
      return error(
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
    const result = await managerTargets.refresh()

    if (result.isErr() || result.value.length === 0) {
      await logger.trace('RNDTargets: failed to refresh')
      return []
    }

    return result.value
  })
}
