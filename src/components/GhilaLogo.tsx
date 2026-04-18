import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  size?: 'md' | 'lg';
};

export function GhilaLogo({ size = 'lg' }: Props) {
  const box = size === 'lg' ? 88 : 64;
  const icon = size === 'lg' ? 40 : 30;

  return (
    <View style={[styles.wrap, { width: box, height: box, borderRadius: box * 0.26 }]}>
      <Ionicons name="location" size={icon} color={colors.bgDeep} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
});
