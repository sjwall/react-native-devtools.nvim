local Job = require("plenary.job")

local Utils = require("react-native-devtools.utils")

local M = {}

function M.canBuild()
  return vim.fn.executable("npm")
end

function M.installNeovimNpmPackage()
  return Job:new({
    command = "npm",
    args = { "install", "-g", "neovim" },
    on_exit = function(j, code)
      if code == 0 then
        vim.notify("installed neovim package")
      else
        error("Install neovim npm package failed, exited with code " .. code)
      end
    end,
  }):sync(60000)
end

function M.installPackages()
  return Job:new({
    command = "npm",
    args = { "install" },
    on_exit = function(j, code)
      if code == 0 then
        vim.notify("installed dependencies")
      else
        error("Install npm packages failed, exited with code " .. code)
      end
    end,
  }):sync(60000)
end

function M:build()
  local dirname = Utils.trim(string.sub(debug.getinfo(1).source, 2, #"/init.lua" * -1)) .. "/"
  local git_root = vim.fs.find(".git", { path = dirname, upward = true })[1]
  local build_directory = git_root and vim.fn.fnamemodify(git_root, ":h") or (dirname .. "/../../")

  if not self.canBuild() then
    error("Building react-native-devtools.nvim requires npm to be installed.", 2)
  end

  Job:new({
    command = "npm",
    args = { "run", "build" },
    on_exit = function(j, code)
      if code == 0 then
        vim.notify("Built remote plugin", vim.log.levels.INFO)
        vim.cmd("UpdateRemotePlugins")
      else
        error("Build failed, exited with code " .. code)
      end
    end,
  }):sync(60000)
  vim.notify("build complete")
end

function M:setup()
  self:installNeovimNpmPackage()
  self:installPackages()
  self:build()
end

return M
