local Path = require("plenary.path")

local M = {}

---@param str string
---@return string
---@return integer count
function M.trim(str)
  return str:gsub("^%s+", ""):gsub("%s+$", "")
end

---@return Path path
function M.get_plugin_dir()
  local info = debug.getinfo(1, "S")
  local script_path = info.source:sub(2)
  return Path:new(script_path):parent():parent():parent()
end

return M
