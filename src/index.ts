import { attach } from 'neovim';

module.exports = async (plugin: any) => {
  plugin.setOptions({ dev: true });

  plugin.registerCommand('HelloTS', async () => {
    const nvim = plugin.nvim;
    await nvim.outWrite('Hello from TypeScript Neovim plugin!\n');
  });

  plugin.registerFunction('AddNumbers', async ([a, b]: [number, number]) => {
    return a + b;
  });
};
