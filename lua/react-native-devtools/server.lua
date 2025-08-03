---@class Server
---@field url string
local Server = {}

Server.__index = Server

---@param url string
---@return Server
function Server.new(url)
  local instance = setmetatable({ url = url }, Server)
  return instance
end

return Server
