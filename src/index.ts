import {appendFileSync} from 'node:fs'
import {Logger} from './Logger'
import {ManagerTargets} from './targets/ManagerTargets'
import {ApiError} from './types/ApiError'
import {Target} from './targets/Target'
import {type Message} from '@frontend/core/protocol_client/InspectorBackend'
import {Neovim, NvimPlugin, Buffer} from 'neovim'
import WebSocket from 'ws'

module.exports = async (plugin: NvimPlugin) => {
  plugin.setOptions({dev: true})
  const nvim = plugin.nvim
  const managerTargets = new ManagerTargets('http://localhost:8081')
  const logger = new Logger()
  let ws: WebSocket | null = null
  let buffer: Buffer | null = null

  async function createConsoleBuffer() {
    await nvim.command('enew')
    buffer = await nvim.buffer
    await buffer.setOption('buftype', 'nofile')
    // await buf.setOption('bufhidden', 'hide');
    await buffer.setOption('swapfile', false)
    await buffer.setLines([], {
      start: 0,
      end: -1,
      strictIndexing: false,
    })
  }

  async function appendToBuffer(line: string) {
    if (buffer === null) return
    const lines = await buffer.lines
    await buffer.setOption('modifiable', true)
    await buffer.setLines([...lines, line], {
      start: 0,
      end: -1,
      strictIndexing: false,
    })
    await buffer.setOption('modifiable', false)
  }

  plugin.registerFunction('StartWebSocketFeed', async () => {
    await logger.trace('StartWebSocketFeed')
    const result = await managerTargets.refresh()

    await createConsoleBuffer()

    if (result.isErr() || result.value.length === 0) {
      await appendToBuffer('No targets to connect to!')
      return
    }

    const target = result.value[0]

    await createConsoleBuffer()

    const url = target.webSocketDebuggerUrl
    await appendToBuffer(`Connecting to WebSocket... ${url}`)

    ws = new WebSocket(url) // test WS server

    ws.on('open', () => {
      appendToBuffer('WebSocket connection opened')
      const message = JSON.stringify({id: 1, method: 'Runtime.enable'})
      appendToBuffer(message)
      ws?.send(message)
      // ws?.send('Hello from Neovim plugin!');
    })

    ws.onmessage = (event) => {
      ;(async () => {
        await logger.trace(`message recieved: ${event.type}`)
        if (event.type === 'message') {
          try {
            await logger.log('message', event.data as string)
            const result: Message = JSON.parse(event.data as string)
            if (result.method === 'Runtime.consoleAPICalled') {
              const messages = result.params.args
                .map(({value}) => value)
                .filter(
                  (value) =>
                    !value.includes(
                      'You are using an unsupported debugging client. Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools.',
                    ),
                )
              await appendToBuffer(
                `${new Date(result.params.timestamp).toLocaleTimeString()} ${result.params.type} ${messages.join(',')}`,
              )
            } else {
              await appendToBuffer(
                `unhandled method ${result.method ?? 'no method'}`,
              )
            }
          } catch (e) {}
        }
      })()
    }

    // ws.on('message', (data: string) => {
    //   appendToBuffer(`WS Message: ${data}`);
    // });

    ws.on('close', (code, reason) => {
      ws = null
      appendToBuffer(`WebSocket connection closed ${code} ${reason}`)
    })

    ws.on('error', (err: Error) => {
      appendToBuffer(`WebSocket error: ${err.message}`)
    })

    return 'Started WebSocket'
  })

  plugin.registerFunction('StopWebSocketFeed', async () => {
    if (ws) {
      ws.close()
      ws = null
      return 'Stopped WebSocket'
    }
    return 'WebSocket not active'
  })

  plugin.registerFunction('RefreshTargetList', async () => {
    const result = await managerTargets.refresh()
    result.match(
      async (targets) => {
        await plugin.nvim.outWriteLine(JSON.stringify(targets))
      },
      async (error) => {
        await plugin.nvim.outWriteLine(
          `Failed to refresh, ${error.name} ${error.message}`,
        )
      },
    )
  })

  plugin.registerCommand('HelloTS', async () => {
    const nvim = plugin.nvim
    await nvim.outWrite('Hello from TypeScript Neovim plugin!\n')
  })

  plugin.registerFunction('AddNumbers', async ([a, b]: [number, number]) => {
    return a + b
  })
}
