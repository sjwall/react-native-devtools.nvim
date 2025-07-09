local Utils = require("react-native-devtools.utils")

vim.api.nvim_create_user_command("RNDevToolsSetup", function()
  require("react-native-devtools.build"):setup()
end, {
  desc = "React Native DevTools: setup and build remote plugin",
})

vim.api.nvim_create_user_command("RNDevToolsBuild", function()
  require("react-native-devtools.build"):build()
end, {
  desc = "React Native DevTools: build remote plugin",
})
