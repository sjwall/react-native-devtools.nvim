# react-native-devtools.nvim

React Native DevTools integrated into Neovim.

## ✨ Features

- Console log

More coming soon...

## 📦 Installation

```lua
-- lazy.nvim
{
  'sjwall/react-native-devtools.nvim',
  build = './build.sh',
  event = 'VeryLazy',
  dependencies = {
    'nvim-lua/plenary.nvim',
  },
  keys = {
    { '<leader>sT', '<cmd>Telescope rndt_targets<cr>', desc = '[S]earch React Native [T]argets' },
  },
}
```
