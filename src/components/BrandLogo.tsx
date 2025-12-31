import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import LogoFondoOscuro from './icons/LogoFondoOscuro';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function BrandLogo({ size = 96, style }: BrandLogoProps) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <LogoFondoOscuro width={size} height={size} />
    </View>
  );
}
