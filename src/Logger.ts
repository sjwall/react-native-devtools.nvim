import {appendFile} from 'node:fs/promises'
import {join} from 'node:path'
import {NvimPlugin} from 'neovim'

export class Logger {
  #filePath = './log.log'

  constructor(plugin: NvimPlugin) {
    plugin.nvim.call('stdpath', 'log').then((value) => {
      this.#filePath = join(value, 'react-native-devtools.log')
    })
  }

  async log(...message: string[]) {
    await appendFile(
      this.#filePath,
      `${new Date().toISOString()} INFO: ${message.join(' ')}\n`,
    )
  }

  async trace(...message: string[]) {
    await appendFile(
      this.#filePath,
      `${new Date().toISOString()} TRACE: ${message.join(' ')}\n`,
    )
  }
}
