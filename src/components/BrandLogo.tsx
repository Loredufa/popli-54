import React from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';

const logoSource = require('../../assets/images/logo.png');
const LOGO_SHADOW = {
  shadowColor: '#ffffff',
  shadowOpacity: 0.5,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 0 },
  elevation: 4,
};

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function BrandLogo({ size = 96, style }: BrandLogoProps) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={logoSource}
        style={[{ width: size, height: size }, LOGO_SHADOW]}
        resizeMode="contain"
      />
    </View>
  );
}
