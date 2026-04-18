import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhilaLogo } from '../components/GhilaLogo';
import { colors } from '../theme/colors';

/** Écran d’accueil après le guide (placeholder — brancher navigation / liste restaurants ici) */
export function HomeScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bgMid, colors.bgLight]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <GhilaLogo size="md" />
          <Text style={styles.brand}>GHILA</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Accueil</Text>
          <Text style={styles.sub}>
            Bienvenue sur Ghila — explorez les restaurants près de vous.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    marginLeft: 12,
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
