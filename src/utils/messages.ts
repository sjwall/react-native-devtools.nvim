import {NvimPlugin} from 'neovim'

export async function notify(
  plugin: NvimPlugin,
  message: string,
  level: 0 | 1 | 2 | 3 | 4 | 5,
) {
  return plugin.nvim.call('nvim_notify', [message, level, {}])
}

export async function fatal(plugin: NvimPlugin, message: string) {
  return notify(plugin, message, 5)
}

export async function error(plugin: NvimPlugin, message: string) {
  return notify(plugin, message, 4)
}

export async function warn(plugin: NvimPlugin, message: string) {
  return notify(plugin, message, 3)
}

export async function info(plugin: NvimPlugin, message: string) {
  return notify(plugin, message, 2)
}

export async function debug(plugin: NvimPlugin, message: string) {
  return notify(plugin, message, 1)
}

export async function trace(plugin: NvimPlugin, message: string) {
  return notify(plugin, message, 0)
}
