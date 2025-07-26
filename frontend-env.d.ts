interface Node {
  traverseNextNode: (node: Node) => Node
  traversePreviousNode: (node: Node) => Node
  parentNodeOrShadowHost: () => Node
}

interface Error {
  constructor(err: unknown): Error
}

interface Window {
  [k: string]: any
}

declare namespace Adb {
  interface Config {}
}
