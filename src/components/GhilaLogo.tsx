import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  size?: 'md' | 'lg';
};

/** Logo initial : pastille lime (squircle), épingle vert forêt — sans image PNG. */
export function GhilaLogo({ size = 'lg' }: Props) {
  const box = size === 'lg' ? 88 : 64;
  const pinSize = size === 'lg' ? 40 : 30;
  const r = Math.round(box * 0.26);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: box,
          height: box,
          borderRadius: r,
          backgroundColor: colors.accent,
        },
      ]}
    >
      <Ionicons name="location" size={pinSize} color={colors.bgDeep} accessibilityLabel="Ghila" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
});
