local has_telescope, _ = pcall(require, "telescope")

if not has_telescope then
  error("react-native-devtools.nvim requires nvim-telescope/telescope.nvim")
end

local rndtUtils = require("react-native-devtools.utils")
local actions = require("telescope.actions")
local action_set = require("telescope.actions.set")
local action_state = require("telescope.actions.state")
local debounce = require("telescope.debounce")
local previewers = require("telescope.previewers")
local pickers = require("telescope.pickers")
local finders = require("telescope.finders")

---@class Capabilities
---@field prefersFuseboxFrontend boolean
---@field nativeSourceCodeFetching boolean
---@field nativePageReloads boolean

---@class ReactNativeTargetReactNative
---@field logicalDeviceId string
---@field capabilities Capabilities

---@class ReactNativeTarget
---@field id string
---@field title string
---@field description string
---@field appId string
---@field type string
---@field devtoolsFrontendUrl string
---@field webSocketDebuggerUrl string
---@field deviceName string
---@field reactNative ReactNativeTargetReactNative

---@class Entry
---@field value ReactNativeTarget
---@field display string
---@field ordinal string

local run = function(opts)
  local previousPrompt = nil
  local picker
  local targetData = {}
  local data_debounce = debounce.debounce_trailing(function(prompt)
    local prompt_trimmed = rndtUtils.trim(prompt or "")
    if prompt_trimmed ~= previousPrompt then
      previousPrompt = prompt_trimmed
      local success, result = pcall(vim.fn.call, "RNDTargets", {})
      targetData = result
      picker:refresh()
    end
  end, 1000)
  picker = pickers.new(opts, {
    prompt_title = "React Native DevTools Targets",
    finder = finders.new_dynamic({
      fn = function(prompt)
        data_debounce(prompt)
        return targetData
      end,
      ---@param entry ReactNativeTarget
      ---@return Entry
      entry_maker = function(entry)
        return {
          value = entry,
          display = entry.title,
          ordinal = entry.title,
        }
      end,
    }),
    previewer = previewers.new_buffer_previewer({
      title = "Targets",
      dyn_title = function(_, entry)
        return entry.display
      end,
      get_buffer_by_name = function(_, entry)
        return "rndt_target_" .. entry.display
      end,
      ---@param entry Entry
      define_preview = function(self, entry, status)
        if self.state.bufname then
          return
        end
        vim.api.nvim_buf_set_lines(self.state.bufnr, 0, -1, false, {
          entry.value.id,
          entry.display,
          entry.value.description,
          entry.value.devtoolsFrontendUrl,
          entry.value.webSocketDebuggerUrl,
          "Native Page Reloads: " .. tostring(entry.value.reactNative.capabilities.nativePageReloads),
          "Native Source Code Fetching: " .. tostring(entry.value.reactNative.capabilities.nativeSourceCodeFetching),
          "Prefers Fusebox Frontend: " .. tostring(entry.value.reactNative.capabilities.prefersFuseboxFrontend),
        })
      end,
    }),
    attach_mappings = function(_, map)
      action_set.select:replace(function(prompt_bufnr)
        local entry = action_state.get_selected_entry()
        actions.close(prompt_bufnr)
        result = vim.fn.call("RNDConsoleOpen", {
          nil,
          entry.value.id,
        })
      end)
      return true
    end,
  })
  picker:find()
end

return require("telescope").register_extension({
  exports = {
    rndt_targets = run,
  },
})
