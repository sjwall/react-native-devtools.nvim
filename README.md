# react-native-devtools.nvim

React Native DevTools integrated into Neovim.

## 📦 Installation

```lua
-- lazy.nvim
{
  'sjwall/react-native-devtools.nvim',
  build = ':RNDevToolsSetup',
  event = 'VeryLazy',
  dependencies = {
    'nvim-lua/plenary.nvim',
  },
}
```
