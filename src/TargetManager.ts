import {Target} from './types/Target'
import {fetchData} from './utils/fetchData'

export class TargetManager {
  #host: string

  #targets: Target[] = []

  get targets() {
    return this.#targets
  }

  constructor(host: string) {
    this.#host = host
  }

  async refresh() {
    const result = await fetchData<Target[]>(`${this.#host}/json`)
    if (result.isOk()) {
      this.#targets = result.value
    }
    return result
  }
}
