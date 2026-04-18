import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  onPress?: () => void;
};

/** White pill, grey border, Google “G” + label — matches reference layout */
export function GoogleContinueButton({ onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      friction: 5,
      tension: 280,
      useNativeDriver: true,
    }).start();
  };

  const handleOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
      <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="logo-google" size={22} color="#4285F4" />
        </View>
        <Text style={styles.label}>Google</Text>
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
    color: '#374151',
    letterSpacing: 0.2,
  },
});
