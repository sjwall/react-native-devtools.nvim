local Job = require("plenary.job")

local Utils = require("react-native-devtools.utils")

local M = {}

function M.canBuild()
  return vim.fn.executable("npm")
end

function M.createJobInstallNeovimNpmPackage()
  return Job:new({
    command = "npm",
    args = { "install", "-g", "neovim" },
    on_exit = function(_, code)
      if code == 0 then
        vim.notify("installed neovim package")
      else
        error("Install neovim npm package failed, exited with code " .. code)
      end
    end,
  })
end

function M.createJobInstallPackages()
  return Job:new({
    command = "npm",
    args = { "install" },
    on_exit = function(_, code)
      if code == 0 then
        vim.notify("installed dependencies")
      else
        error("Install npm packages failed, exited with code " .. code)
      end
    end,
  })
end

function M:createJobBuild()
  local dirname = Utils.trim(string.sub(debug.getinfo(1).source, 2, #"/init.lua" * -1)) .. "/"
  local git_root = vim.fs.find(".git", { path = dirname, upward = true })[1]
  local build_directory = git_root and vim.fn.fnamemodify(git_root, ":h") or (dirname .. "/../../")

  if not self.canBuild() then
    error("Building react-native-devtools.nvim requires npm to be installed.", 2)
  end

  return Job:new({
    command = "npm",
    args = { "run", "build" },
    on_exit = function(_, code)
      if code == 0 then
        vim.notify("Built remote plugin", vim.log.levels.INFO)
        vim.defer_fn(function()
          vim.cmd("UpdateRemotePlugins")
        end, 0)
      else
        error("Build failed, exited with code " .. code)
      end
    end,
  })
end

function M:build()
  self:createJobBuild():start(60000)
end

function M:setup()
  local installPackages = self:createJobInstallPackages()
  installPackages:add_on_exit_callback(function()
    self:build()
  end)

  local installNeovimNpmPackage = self:createJobInstallNeovimNpmPackage()
  installNeovimNpmPackage:add_on_exit_callback(function()
    installPackages:start(60000)
  end)

  installNeovimNpmPackage:start(60000)
end

return M
