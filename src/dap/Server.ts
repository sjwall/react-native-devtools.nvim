import {InitializedEvent, TerminatedEvent} from '@vscode/debugadapter'
import {createServer} from 'http'

export class Server {
  constructor(private port: number = 4711) {}

  sendResponse(seq: number, command: string, body = {}) {
    return {
      type: 'response',
      seq: 0,
      request_seq: seq,
      success: true,
      command,
      body,
    }
  }

  sendEvent(event: any) {
    return {
      type: 'event',
      seq: 0,
      ...event,
    }
  }

  log(...args: any[]) {
    console.log('[DAP]', ...args)
  }

  start() {
    const server = createServer(async (req, res) => {
      this.log('begin: ' + req.method + ' ' + req.url)
      if (req.method !== 'POST' || req.url !== '/dap') {
        res.writeHead(404)
        return res.end()
      }

      const body = await new Promise<string>((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => (data += chunk.toString()))
        req.on('end', () => resolve(data))
        req.on('error', (err) => reject(err))
      })

      let message
      try {
        message = JSON.parse(body)
      } catch {
        res.writeHead(400)
        return res.end('Invalid JSON')
      }

      this.log('Received:', message.command)

      let responses: any[] = []

      switch (message.command) {
        case 'initialize':
          responses.push(
            this.sendResponse(message.seq, 'initialize', {
              supportsConfigurationDoneRequest: true,
            }),
            this.sendEvent(new InitializedEvent()),
          )
          break

        case 'launch':
          responses.push(this.sendResponse(message.seq, 'launch'))
          break

        case 'disconnect':
          responses.push(
            this.sendResponse(message.seq, 'disconnect'),
            this.sendEvent(new TerminatedEvent()),
          )
          break

        default:
          responses.push({
            type: 'response',
            seq: 0,
            request_seq: message.seq,
            success: false,
            command: message.command,
            message: 'Unsupported command',
          })
      }

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(responses))
    })

    server.listen(this.port, () => {
      this.log(`DAP HTTP Server listening on http://localhost:${this.port}/dap`)
    })
  }
}
