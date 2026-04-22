import { useEffect, useMemo, useState } from 'react';
import { Image, type StyleProp, StyleSheet, View, type ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryId } from '../data/homeCatalog';
import { colors } from '../theme/colors';

type Props = {
  uri: string;
  category?: CategoryId;
  style: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
};

/** Images de secours stables (même domaine Unsplash) si l’URL principale échoue. */
const FALLBACK_BY_CATEGORY: Partial<Record<CategoryId, string>> = {
  pharma:
    'https://images.unsplash.com/photo-1584308666744-24d5c474e2ae?w=900&h=900&fm=jpg&fit=crop&q=80',
  food:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=900&fm=jpg&fit=crop&q=80',
  courses:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&h=900&fm=jpg&fit=crop&q=80',
  cadeaux:
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&h=900&fm=jpg&fit=crop&q=80',
};

/**
 * Affiche la photo produit distante ; en cas d’erreur réseau ou URL invalide,
 * tente une image de secours par catégorie, puis une icône (plus de carte vide beige).
 */
export function ProductRemoteImage({
  uri,
  category,
  style,
  resizeMode = 'cover',
}: Props) {
  const chain = useMemo(() => {
    const alt = category ? FALLBACK_BY_CATEGORY[category] : undefined;
    const out = [uri];
    if (alt && alt !== uri) out.push(alt);
    return out;
  }, [uri, category]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [uri]);

  const current = index < chain.length ? chain[index] : null;

  if (!current || index >= chain.length) {
    const icon =
      category === 'food'
        ? 'restaurant-outline'
        : category === 'courses'
          ? 'basket-outline'
          : category === 'cadeaux'
            ? 'gift-outline'
            : 'medkit-outline';
    return (
      <View style={[style, styles.placeholder]}>
        <Ionicons name={icon} size={40} color={colors.homeMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: current }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.homeCardBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
