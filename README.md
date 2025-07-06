# react-native-devtools.nvim

React Native DevTools integrated into Neovim.

## 📦 Installation

```lua
-- lazy.nvim
{
  'sjwall/react-native-devtools.nvim',
  dependencies = {
    'nvim-lua/plenary.nvim',
  },
}
```

The [neovim](https://npmjs.com/packages/neovim) node package is required as this is a remote plugin:

```sh
npm install -g neovim
```

In Neovim update the remote plugin list:

```neovim
:UpdateRemotePlugins
```
