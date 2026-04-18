import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhilaLogo } from '../components/GhilaLogo';
import { OnboardingSlider } from '../components/OnboardingSlider';
import { colors } from '../theme/colors';

const { height: SCREEN_H } = Dimensions.get('window');
/** Bottom sheet ~75% — même principe que l’écran d’inscription, avec le guide à la place */
const SHEET_HEIGHT = SCREEN_H * 0.75;
const SPLASH_DELAY_MS = 2000;
const TRANSITION_MS = 680;
/** Hauteur approximative du bloc logo + titre + tagline (pour placer le logo en haut après animation) */
const LOGO_BLOCK_H = 200;

type WelcomeProps = {
  /** Après « Commencer » ou « Passer » sur le guide */
  onGuideFinished?: () => void;
};

export function WelcomeScreen({ onGuideFinished }: WelcomeProps) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(1)).current;

  /** Du centre vertical du hero vers le haut (sous la safe area) */
  const logoTravelY = useMemo(() => {
    const availableH = SCREEN_H - insets.top;
    return 10 + LOGO_BLOCK_H / 2 - availableH / 2;
  }, [insets.top]);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 580,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoLift, {
          toValue: 1,
          duration: TRANSITION_MS,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: TRANSITION_MS + 40,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }, SPLASH_DELAY_MS);

    return () => clearTimeout(t);
  }, [fade, logoLift, sheetY]);

  const logoTranslate = logoLift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, logoTravelY],
  });

  const sheetTranslate = sheetY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SHEET_HEIGHT + 40],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bgMid, colors.bgLight]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={[styles.hero, { opacity: fade }]}>
          <Animated.View style={{ transform: [{ translateY: logoTranslate }] }}>
            <GhilaLogo />
            <Text style={styles.brand}>GHILA</Text>
            <Text style={styles.tagline}>LIVRAISON · MAROC</Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>

      <Animated.View
        style={[
          styles.sheetOuter,
          {
            height: SHEET_HEIGHT,
            transform: [{ translateY: sheetTranslate }],
          },
        ]}
      >
        <OnboardingSlider
          onComplete={onGuideFinished}
          onSkip={onGuideFinished}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    marginTop: 20,
    fontSize: 40,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
  },
  tagline: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent,
    letterSpacing: 4,
    opacity: 0.95,
  },
  sheetOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
