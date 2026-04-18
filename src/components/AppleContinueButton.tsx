import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  onPress?: () => void;
};

/** iOS uniquement — style proche de Sign in with Apple (contour, pas le bouton noir officiel) */
export function AppleContinueButton({ onPress }: Props) {
  if (Platform.OS !== 'ios') return null;

  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, friction: 5, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
      }
    >
      <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="logo-apple" size={22} color="#000" />
        </View>
        <Text style={styles.label}>Apple</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  iconWrap: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.2,
  },
});
