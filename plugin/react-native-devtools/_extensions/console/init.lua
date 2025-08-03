local ManagerServer = require('react-native-devtools.manager_server')
local ConsoleBuffer = require('plugin.react-native-devtools._extensions.console.console_buffer')

vim.api.nvim_create_user_command(
    "RNDConsoleOpen",
    function()
    ManagerServer:
    end,
    { desc = "Prints a greeting message" }
)
