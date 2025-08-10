import {Runtime} from 'react-native-devtools-frontend'

export type ConsoleObject = (Runtime.RemoteObject | Runtime.ObjectPreview) &
  Expandable

export type Expandable = {
  expanded?: boolean
}

export type ExpandableRef = {
  line: number
  colStart: number
  colEnd: number
  item: Expandable
}
