local Server = require("react-native-devtools.server")

---@class ManagerServer
---@field servers Server[]
local ManagerServer = {}

ManagerServer.__index = ManagerServer

function ManagerServer.new()
  local instance = setmetatable({}, ManagerServer)

  instance.servers = table.insert(instance.servers, Server.new("http://localhost:8081"))

  return instance
end

return ManagerServer.new()
