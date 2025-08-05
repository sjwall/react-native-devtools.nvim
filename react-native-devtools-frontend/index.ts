export type * from './front_end/generated/protocol'

// --------------------------------------------------
// front_end/core/platform/DevToolsPath.ts
export type Brand<Base, Tag> = Base & {_tag: Tag}

// --------------------------------------------------
// front_end/core/platform/DevToolsPath.ts
export type UrlString = Brand<string, 'UrlString'>

// --------------------------------------------------
// front_end/core/protocol_client/InspectorBackend.ts
export type QualifiedName = string & {qualifiedEventNameTag: string | undefined}

interface MessageParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

export interface MessageError {
  code: number
  message: string
  data?: string | null
}

export interface Message {
  sessionId?: string
  url?: UrlString
  id?: number
  error?: MessageError | null
  result?: Object | null
  method?: QualifiedName
  params?: MessageParams | null
}
