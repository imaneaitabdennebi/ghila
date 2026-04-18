import { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Variant = 'google' | 'facebook' | 'email';

type IconCfg =
  | { kind: 'googleColor' }
  | { kind: 'ion'; name: keyof typeof Ionicons.glyphMap; color: string };

const config: Record<Variant, { icon: IconCfg; label: string }> = {
  google: {
    icon: { kind: 'googleColor' },
    label: 'Google',
  },
  facebook: {
    icon: { kind: 'ion', name: 'logo-facebook', color: '#1877F2' },
    label: 'Facebook',
  },
  email: {
    icon: { kind: 'ion', name: 'mail-outline', color: '#111827' },
    label: 'E-mail',
  },
};

type Props = {
  variant: Variant;
  onPress?: () => void;
};

/** Logo Google multicolore (PNG officiel), sinon Ionicons */
function VariantIcon({ cfg }: { cfg: IconCfg }) {
  if (cfg.kind === 'googleColor') {
    return (
      <Image
        source={require('../../assets/google-g.png')}
        style={styles.googleIcon}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    );
  }
  return <Ionicons name={cfg.name} size={22} color={cfg.color} />;
}

/** Pilule blanche, bord gris — comme l’écran d’inscription Glovo */
export function GlovoOutlineButton({ variant, onPress }: Props) {
  const { icon, label } = config[variant];
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
          <VariantIcon cfg={icon} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.2,
  },
});
