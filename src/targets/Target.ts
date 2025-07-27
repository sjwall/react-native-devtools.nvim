export type TargetReactNative = {
  logicalDeviceId: string
  capabilities: {
    prefersFuseboxFrontend: boolean
    nativeSourceCodeFetching: boolean
    nativePageReloads: boolean
  }
}

export type Target = {
  id: string
  title: string
  description: string
  appId: string
  type: 'node'
  devtoolsFrontendUrl: `devtools://${string}`
  webSocketDebuggerUrl: `ws://${string}`
  deviceName: string
  reactNative: TargetReactNative
}
