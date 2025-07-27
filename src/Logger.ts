import {appendFile} from 'node:fs/promises'

export class Logger {
  #filePath = './log.txt'

  async log(...message: string[]) {
    await appendFile(this.#filePath, `INFO: ${message.join(' ')}\n`)
  }

  async trace(...message: string[]) {
    await appendFile(this.#filePath, `TRACE: ${message.join(' ')}\n`)
  }
}
