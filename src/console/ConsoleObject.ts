import {Runtime} from 'react-native-devtools-frontend'

export type ConsoleObject = (Runtime.RemoteObject | Runtime.ObjectPreview) & {
  expanded?: boolean
}

export type Expandable = {
  line: number
  colStart: number
  colEnd: number
  item: ConsoleObject
}
