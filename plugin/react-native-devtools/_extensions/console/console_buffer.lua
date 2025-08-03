require("react-native-devtools.target")
local parse_url = require("react-native-devtools.utils.parse_url")

---@class ConsoleBuffer
---@field group string
---@field buffer number
local ConsoleBuffer = {}

ConsoleBuffer.__index = ConsoleBuffer

---@param target Target
local function create_buffer(target)
  local buf_id = vim.api.nvim_create_buf(false, true)

  vim.api.nvim_set_option_value("buftype", "nofile", { buf = buf_id })
  vim.api.nvim_set_option_value("swapfile", false, { buf = buf_id })
  vim.api.nvim_set_option_value("modified", false, { buf = buf_id })

  vim.api.nvim_set_current_buf(buf_id)
  return buf_id
end

---@param url string
---@param target Target
function ConsoleBuffer.new(url, target)
  local instance = setmetatable({}, ConsoleBuffer)
  instance.group = vim.api.nvim_create_augroup("ReactNativeDevtoolsConsole" .. target.id, { clear = true })

  vim.api.nvim_create_autocmd("User", {
    pattern = "ReactNativeDevtools" .. target.id,
    group = instance.group,
    callback = function(args)
      print(vim.inspect(args))
    end,
  })

  instance.buffer = create_buffer(target)
  local _, path = parse_url(url)
  vim.api.nvim_set_option_value(
    "name",
    "rndt://" .. path .. "/" .. target.deviceName .. "/" .. target.appId,
    { buf = instance.buffer }
  )

  return instance
end

function ConsoleBuffer:close()
  vim.api.nvim_clear_autocmds({ group = self.group })
end

return ConsoleBuffer
