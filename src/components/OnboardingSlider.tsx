import { useCallback, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Animated,
  FlatList,
  Image,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING_PAGES, type OnboardingPage } from '../data/onboarding';
import { colors } from '../theme/colors';

const SLIDE_PADDING_H = 22;

/** Affiche les PNG en entier (contain), taille adaptée à l’écran et à la hauteur utile du slide */
function OnboardingHeroImage({
  source,
  accessibilityLabel,
  pageWidth,
  maxFrameHeight,
}: {
  source: ImageSourcePropType;
  accessibilityLabel?: string;
  pageWidth: number;
  maxFrameHeight: number;
}) {
  const innerW = pageWidth - SLIDE_PADDING_H * 2;
  const frameW = Math.min(innerW, 400);
  const idealH = Math.round(frameW * 0.7);
  const frameH = Math.max(160, Math.min(idealH, maxFrameHeight));

  return (
    <View style={[heroStyles.frame, { width: frameW, height: frameH }]}>
      <Image
        source={source}
        style={heroStyles.image}
        resizeMode="contain"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const heroStyles = StyleSheet.create({
  /** Pas de fond ni cadre : les PNG transparents se voient sur le blanc du slide */
  frame: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

const LAST_INDEX = ONBOARDING_PAGES.length - 1;

/** Doit rester aligné avec WelcomeScreen : panneau = 75 % de la hauteur d’écran */
const SHEET_FRACTION = 0.75;
/** Poignée + bandeau vert + barre + liste + pied (ajusté avec la bande dégradée) */
const CHROME_H = 6 + 22 + 52 + 24 + 138;

type Props = {
  onComplete?: () => void;
  onSkip?: () => void;
};

export function OnboardingSlider({ onComplete, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const { width: pageW, height: winH } = useWindowDimensions();
  const sheetH = winH * SHEET_FRACTION;
  const listH = Math.max(sheetH - CHROME_H - insets.bottom, 180);

  const listRef = useRef<FlatList<OnboardingPage>>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  /** scrollToIndex ne met pas toujours à jour l’index sans onMomentumScrollEnd → on force l’offset + l’état */
  const goNext = useCallback(() => {
    const i = indexRef.current;
    if (i >= LAST_INDEX) {
      onComplete?.();
      return;
    }
    const next = i + 1;
    indexRef.current = next;
    setIndex(next);
    const offset = next * pageW;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset, animated: true });
    });
  }, [onComplete, pageW]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.min(Math.max(Math.round(x / pageW), 0), LAST_INDEX);
      indexRef.current = i;
      setIndex(i);
    },
    [pageW]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<OnboardingPage>) => (
      <View style={[styles.slide, { width: pageW, height: listH }]}>
        <View style={styles.slideInner}>
          <View style={styles.artBlock}>
            <OnboardingHeroImage
              source={item.image}
              accessibilityLabel={item.title}
              pageWidth={pageW}
              maxFrameHeight={Math.max(170, listH - 148)}
            />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      </View>
    ),
    [pageW, listH]
  );

  const keyExtractor = useCallback((item: OnboardingPage) => item.key, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bgMid, colors.bgLight]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBand}
      />
      <View style={styles.handle} />
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Pressable
          onPress={onSkip}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={ONBOARDING_PAGES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={{ height: listH }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((r) => setTimeout(r, 400));
          wait.then(() => {
            listRef.current?.scrollToOffset({
              offset: info.index * pageW,
              animated: true,
            });
          });
        }}
        getItemLayout={(_, i) => ({
          length: pageW,
          offset: pageW * i,
          index: i,
        })}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PaginationDots count={ONBOARDING_PAGES.length} scrollX={scrollX} pageWidth={pageW} />
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}
        >
          <Text style={styles.primaryLabel}>
            {index === LAST_INDEX ? 'Commencer' : 'Suivant'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PaginationDots({
  count,
  scrollX,
  pageWidth,
}: {
  count: number;
  scrollX: Animated.Value;
  pageWidth: number;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [
          (i - 1) * pageWidth,
          i * pageWidth,
          (i + 1) * pageWidth,
        ];
        const width = scrollX.interpolate({
          inputRange,
          outputRange: [6, 22, 6],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.28, 1, 0.28],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  /** Même dégradé vert que l’écran d’accueil (lien visuel avec le haut) */
  headerBand: {
    height: 6,
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.bgMid,
    marginTop: 8,
    marginBottom: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topSpacer: {
    flex: 1,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: colors.bgDeep,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.65,
  },
  slide: {
    backgroundColor: colors.white,
  },
  /** Contenu centré dans la zone blanche du carrousel */
  slideInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  artBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    flexShrink: 0,
  },
  title: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    width: '100%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
    /** Points « écrasés » (traits fins) ; l’opacité animée marque la page active */
    backgroundColor: colors.bgDeep,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: colors.bgDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryPressed: {
    opacity: 0.88,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
});
