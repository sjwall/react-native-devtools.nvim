import {appendFile} from 'node:fs/promises'
import {join} from 'node:path'
import {NvimPlugin} from 'neovim'

export class Logger {
  #filePath = './log.txt'

  constructor(plugin: NvimPlugin) {
    plugin.nvim.call('stdpath', 'log').then((value) => {
      this.#filePath = join(value, 'react-native-devtools.txt')
    })
  }

  async log(...message: string[]) {
    await appendFile(this.#filePath, `INFO: ${message.join(' ')}\n`)
  }

  async trace(...message: string[]) {
    await appendFile(this.#filePath, `TRACE: ${message.join(' ')}\n`)
  }
}
