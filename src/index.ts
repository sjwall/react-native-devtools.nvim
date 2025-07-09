import { Neovim, NvimPlugin, Buffer } from 'neovim';
import WebSocket from 'ws';

module.exports = async (plugin: NvimPlugin) => {
  plugin.setOptions({ dev: true });
  const nvim = plugin.nvim;
  let ws: WebSocket | null = null;
  let buffer: Buffer | null = null

  async function createConsoleBuffer() {
    await nvim.command('enew');
    buffer = await nvim.buffer;
    await buffer.setOption('buftype', 'nofile');
    // await buf.setOption('bufhidden', 'hide');
    await buffer.setOption('swapfile', false);
    await buffer.setLines([], {
      start: 0,
      end: -1,
      strictIndexing: false,
    });
  }

  async function appendToBuffer(line: string) {
    if (buffer === null) return;
    const lines = await buffer.lines;
    await buffer.setOption("modifiable", true);
    await buffer.setLines([...lines, line], {
      start: 0,
      end: -1,
      strictIndexing: false,
    });
    await buffer.setOption("modifiable", false);
  }

  plugin.registerFunction('StartWebSocketFeed', async () => {
    await createConsoleBuffer()

    await appendToBuffer("Connecting to WebSocket...");

    ws = new WebSocket('ws://localhost:8081/debugger-proxy?role=debugger'); // test WS server

    ws.on('open', () => {
      appendToBuffer('WebSocket connection opened');
      ws?.send(JSON.stringify({ id: "1", method: 'Runtime.enable' }));
      // ws?.send('Hello from Neovim plugin!');
    });

    ws.onmessage = (event) => {
      appendToBuffer(JSON.stringify(event))
      nvim.outWrite('Hello from TypeScript Neovim plugin!\n');
    }

    // ws.on('message', (data: string) => {
    //   appendToBuffer(`WS Message: ${data}`);
    // });

    ws.on('close', (code, reason) => {
      ws = null
      appendToBuffer(`WebSocket connection closed ${code} ${reason}`);
    });

    ws.on('error', (err: Error) => {
      appendToBuffer(`WebSocket error: ${err.message}`);
    });


    return 'Started WebSocket';
  });

  plugin.registerFunction('StopWebSocketFeed', async () => {
    if (ws) {
      ws.close();
      ws = null;
      return 'Stopped WebSocket';
    }
    return 'WebSocket not active';
  });

  plugin.registerCommand('HelloTS', async () => {
    const nvim = plugin.nvim;
    await nvim.outWrite('Hello from TypeScript Neovim plugin!\n');
  });

  plugin.registerFunction('AddNumbers', async ([a, b]: [number, number]) => {
    return a + b;
  });
};
