import {NvimPlugin} from 'neovim'

export function setupHighlightGroups(plugin: NvimPlugin) {
  plugin.nvim.command(`
hi default ReactNativeDevtoolsTimestamp guifg=#bac2de
hi default ReactNativeDevtoolsErrorIcon guifg=#f38ba8
hi default ReactNativeDevtoolsWarningIcon guifg=#fab387
hi default ReactNativeDevtoolsInfoIcon guifg=#89b4fa
hi default ReactNativeDevtoolsLogIcon guifg=#89b4fa
hi default ReactNativeDevtoolsDebugIcon guifg=#94e2d5
hi default ReactNativeDevtoolsTraceIcon guifg=#f5e0dc
hi default ReactNativeDevtoolsErrorTitle guibg=#f38ba8 guifg=#11111b
hi default ReactNativeDevtoolsWarningTitle guibg=#fab387 guifg=#11111b
hi default ReactNativeDevtoolsInfoTitle guibg=#89b4fa guifg=#11111b
hi default ReactNativeDevtoolsLogTitle guibg=#89b4fa guifg=#11111b
hi default ReactNativeDevtoolsDebugTitle guibg=#94e2d5 guifg=#11111b
hi default ReactNativeDevtoolsTraceTitle guibg=#f5e0dc guifg=#11111b
hi default link ReactNativeDevtoolsErrorText Normal
hi default link ReactNativeDevtoolsWarningText Normal
hi default link ReactNativeDevtoolsInfoText Normal
hi default link ReactNativeDevtoolsLogText Normal
hi default link ReactNativeDevtoolsDebugText Normal
hi default link ReactNativeDevtoolsTraceText Normal
`)
}
