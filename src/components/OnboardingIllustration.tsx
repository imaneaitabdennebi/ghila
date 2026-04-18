import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type IllustrationTheme = 'delivery' | 'restaurants' | 'tracking';

type Props = {
  theme: IllustrationTheme;
  variant?: 'light' | 'dark';
};

export function OnboardingIllustration({ theme, variant = 'dark' }: Props) {
  const light = variant === 'light';

  return (
    <View style={styles.stage} accessibilityLabel={theme}>
      {/* Fond organique — tons du header */}
      <LinearGradient
        colors={[
          `${colors.bgLight}33`,
          `${colors.bgMid}22`,
          `${colors.accent}18`,
        ]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.blob}
      />
      <View style={[styles.blobRing, light && styles.blobRingLight]} />

      {theme === 'delivery' && <DeliveryArt light={light} />}
      {theme === 'restaurants' && <RestaurantsArt light={light} />}
      {theme === 'tracking' && <TrackingArt light={light} />}
    </View>
  );
}

function DeliveryArt({ light }: { light: boolean }) {
  return (
    <>
      <View style={styles.routeLine}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.routeDot, { opacity: 0.35 + i * 0.12 }]} />
        ))}
      </View>
      <View style={styles.scooterWrap}>
        <MaterialCommunityIcons name="motorbike" size={64} color={colors.bgMid} />
      </View>
      <LinearGradient
        colors={[colors.white, colors.inputBg]}
        style={[styles.floatingCard, light && styles.floatingCardLight]}
      >
        <Ionicons name="map" size={22} color={colors.bgMid} />
        <View style={styles.miniPin}>
          <Ionicons name="location" size={12} color={colors.bgDeep} />
        </View>
      </LinearGradient>
      <View style={[styles.speedLines, { opacity: light ? 0.5 : 0.65 }]}>
        <View style={styles.speedLine} />
        <View style={[styles.speedLine, styles.speedLineMid]} />
        <View style={styles.speedLine} />
      </View>
    </>
  );
}

function RestaurantsArt({ light }: { light: boolean }) {
  return (
    <>
      <View style={styles.plateRing}>
        <LinearGradient
          colors={[`${colors.bgMid}55`, `${colors.accent}40`]}
          style={styles.plateInner}
        >
          <MaterialCommunityIcons name="silverware-fork-knife" size={38} color={colors.white} />
        </LinearGradient>
      </View>
      <View style={[styles.steam, { opacity: light ? 0.45 : 0.6 }]}>
        <View style={styles.steamWisp} />
        <View style={[styles.steamWisp, styles.steamWispTall, styles.steamWispSp]} />
        <View style={[styles.steamWisp, styles.steamWispSp]} />
      </View>
      <LinearGradient colors={[colors.bgMid, colors.bgLight]} style={styles.chefBadge}>
        <MaterialCommunityIcons name="chef-hat" size={26} color={colors.accent} />
      </LinearGradient>
      <View style={[styles.leafAccent, light && styles.leafAccentLight]}>
        <MaterialCommunityIcons name="leaf" size={22} color={colors.bgLight} />
      </View>
    </>
  );
}

function TrackingArt({ light }: { light: boolean }) {
  return (
    <>
      <View style={[styles.radarOuter, light && styles.radarOuterLight]} />
      <View style={styles.radarMid} />
      <Ionicons name="navigate-circle" size={58} color={colors.bgMid} />
      <View style={[styles.pinTop, light && styles.pinTopLight]}>
        <Ionicons name="location-sharp" size={22} color={colors.accent} />
      </View>
      <View style={styles.pathDashes}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.pathDash, { marginRight: i < 3 ? 6 : 0 }]} />
        ))}
      </View>
      <View style={[styles.scooterMini]}>
        <MaterialCommunityIcons name="truck-delivery" size={28} color={colors.bgLight} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    maxWidth: 280,
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  blob: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
    transform: [{ scaleX: 1.06 }, { scaleY: 0.92 }, { rotate: '-8deg' }],
  },
  blobRing: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: `${colors.bgLight}66`,
  },
  blobRingLight: {
    borderColor: `${colors.bgMid}33`,
  },
  routeLine: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeDot: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentMuted,
  },
  scooterWrap: {
    marginTop: -8,
    shadowColor: colors.bgDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  floatingCard: {
    position: 'absolute',
    top: 22,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  floatingCardLight: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  miniPin: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedLines: {
    position: 'absolute',
    left: 20,
    top: 72,
  },
  speedLine: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.bgLight,
    marginBottom: 5,
  },
  speedLineMid: {
    width: 32,
    marginLeft: 4,
  },
  plateRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    backgroundColor: `${colors.bgMid}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateInner: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steam: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  steamWisp: {
    width: 8,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.bgLight,
  },
  steamWispSp: {
    marginLeft: 8,
  },
  steamWispTall: {
    height: 32,
  },
  chefBadge: {
    position: 'absolute',
    bottom: 34,
    right: 26,
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.bgDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  leafAccent: {
    position: 'absolute',
    bottom: 44,
    left: 24,
    opacity: 0.85,
  },
  leafAccentLight: {
    opacity: 0.65,
  },
  radarOuter: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: `${colors.accent}55`,
    left: '50%',
    marginLeft: -74,
    top: 18,
  },
  radarOuterLight: {
    borderColor: `${colors.bgMid}44`,
  },
  radarMid: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1.5,
    borderColor: `${colors.bgLight}99`,
    left: '50%',
    marginLeft: -54,
    top: 38,
  },
  pinTop: {
    position: 'absolute',
    top: 28,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pinTopLight: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  pathDashes: {
    position: 'absolute',
    bottom: 46,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathDash: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accentMuted,
  },
  scooterMini: {
    position: 'absolute',
    bottom: 38,
    left: '50%',
    marginLeft: -14,
    opacity: 0.9,
  },
});
