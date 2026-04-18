import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Couleurs calées sur l’icône app Ghila (lime, vert forêt, blanc) */
const LIME_BG = '#C6E000';
const FOREST = '#003300';
const WHITE = '#FFFFFF';

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

type Props = {
  /** Taille du carré (squircle) */
  size?: number;
};

/**
 * Reproduction de l’icône : fond lime, « Ghila » serif vert forêt,
 * point et épingle du « i » en blanc.
 */
export function GhilaSignupLogo({ size = 64 }: Props) {
  const r = Math.round(size * 0.26);
  const fs = Math.max(11, Math.round(size * 0.28));
  const pin = Math.max(9, Math.round(size * 0.17));
  const dot = Math.max(4, Math.round(size * 0.07));
  const stemW = Math.max(2.5, size * 0.045);
  const stemH = Math.max(10, Math.round(size * 0.22));

  return (
    <View style={[styles.squircle, { width: size, height: size, borderRadius: r }]}>
      <View style={styles.wordRow}>
        <Text style={[styles.letter, { fontSize: fs }]}>Gh</Text>
        <View style={styles.iColumn}>
          <Ionicons name="location" size={pin} color={WHITE} style={styles.pin} />
          <View style={[styles.iDot, { width: dot, height: dot, borderRadius: dot / 2 }]} />
          <View style={[styles.iStem, { width: stemW, height: stemH }]} />
        </View>
        <Text style={[styles.letter, { fontSize: fs }]}>la</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  squircle: {
    backgroundColor: LIME_BG,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'android' ? 2 : 3,
  },
  letter: {
    fontFamily: serif,
    fontWeight: '700',
    color: FOREST,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  iColumn: {
    alignItems: 'center',
    marginHorizontal: 0.5,
    marginBottom: 0,
  },
  pin: {
    marginBottom: -1,
  },
  iDot: {
    backgroundColor: WHITE,
    marginTop: 1,
  },
  iStem: {
    backgroundColor: FOREST,
    borderRadius: 1,
    marginTop: 0,
  },
});
