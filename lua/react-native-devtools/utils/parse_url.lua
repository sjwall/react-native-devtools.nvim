---@param url string
---@return nil|string
---@return nil|string
return function(url)
  return url:match("^(.*://)(.*)$")
end
