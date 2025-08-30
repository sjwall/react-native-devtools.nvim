local M = {}

---@param str string
---@return string
---@return integer count
function M.trim(str)
  return str:gsub("^%s+", ""):gsub("%s+$", "")
end

return M
