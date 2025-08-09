import {NvimPlugin} from 'neovim'

export async function getCurrentConsoleBuffer(plugin: NvimPlugin) {
  const currentBuffer = await plugin.nvim.buffer
  if (
    (await currentBuffer.getOption('filetype')) ===
    'react-native-devtools-console'
  ) {
    return currentBuffer
  }
  return undefined
}
