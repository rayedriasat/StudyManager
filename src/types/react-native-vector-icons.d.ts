declare module 'react-native-vector-icons/MaterialIcons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  class Icon extends Component<IconProps> {}
  
  export default Icon;
}

declare module 'react-native-vector-icons/Icon' {
  import { TextStyle, ViewProps } from 'react-native';
  
  export interface IconProps extends ViewProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }
}