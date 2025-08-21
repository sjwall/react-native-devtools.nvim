import {appendFile} from 'node:fs/promises'
import {join} from 'node:path'
import {NvimPlugin} from 'neovim'

export class Logger {
  #filePath: string | undefined

  constructor(plugin: NvimPlugin) {
    plugin.nvim.call('stdpath', 'log').then((value) => {
      if (!this.#filePath) {
        this.#filePath = join(value, 'react-native-devtools.log')
      }
    })
  }

  async #appendToLogFile(level: 'INFO' | 'TRACE', message: string[]) {
    if (this.#filePath) {
      await appendFile(
        this.#filePath,
        `${new Date().toISOString()} ${level}: ${message.join(' ')}\n`,
      )
    }
  }

  async log(...message: string[]) {
    this.#appendToLogFile('INFO', message)
  }

  async trace(...message: string[]) {
    this.#appendToLogFile('TRACE', message)
  }
}
