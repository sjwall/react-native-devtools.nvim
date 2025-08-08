import {NvimPlugin} from 'neovim'

export async function createConsoleBuffer(plugin: NvimPlugin) {
  await plugin.nvim.command('enew')
  const buffer = await plugin.nvim.buffer
  await buffer.setOption('buftype', 'nofile')
  await buffer.setOption('filetype', 'react-native-devtools-console')
  await buffer.setOption('swapfile', false)
  return buffer
}
