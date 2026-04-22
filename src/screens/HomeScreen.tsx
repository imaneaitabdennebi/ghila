import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductRemoteImage } from '../components/ProductRemoteImage';
import { colors } from '../theme/colors';
import {
  CATEGORIES_META,
  type CategoryId,
  type Product,
  DEFAULT_CITY,
  CITIES,
  CATEGORY_IMAGES,
  INITIAL_ORDERS,
  PRODUCTS,
  type CartLine,
  type OrderMock,
} from '../data/homeCatalog';
import {
  pointsEarnedFromOrder,
} from '../data/loyaltyProgram';
import {
  loadLoyalty,
  saveLoyalty,
  type LoyaltyTransaction,
} from '../lib/loyaltyStorage';

const G = colors.ghilaGreen;
const LIME = colors.accent;
const HEADER_END = colors.homeHeaderEnd;

/** Ombre douce type « carte » (iOS + Android). */
const cardElevation = Platform.select({
  ios: {
    shadowColor: '#0f291c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 4 },
  default: {},
});

type TabId = 'home' | 'cart' | 'orders' | 'loyalty';

const TABS: {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive?: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'home', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
  { id: 'cart', label: 'Panier', icon: 'cart-outline' },
  { id: 'orders', label: 'Commandes', icon: 'cube-outline' },
  { id: 'loyalty', label: 'Fidélité', icon: 'star-outline' },
];

function filterProducts(
  query: string,
  category: CategoryId | null,
  list: Product[],
): Product[] {
  const q = query.trim().toLowerCase();
  let out = list;
  if (category) {
    out = out.filter((p) => p.category === category);
  }
  if (q.length === 0) return out;
  return out.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.priceLabel.toLowerCase().includes(q),
  );
}

export function HomeScreen() {
  const [tab, setTab] = useState<TabId>('home');
  const [city, setCity] = useState(DEFAULT_CITY);
  const [cityModal, setCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null,
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyTxs, setLoyaltyTxs] = useState<LoyaltyTransaction[]>([]);
  const [loyaltyHydrated, setLoyaltyHydrated] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderMock[]>(() => [
    ...INITIAL_ORDERS,
  ]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const homeFiltered = useMemo(
    () => filterProducts(searchQuery, selectedCategory, PRODUCTS),
    [searchQuery, selectedCategory],
  );

  const cartTotal = useMemo(
    () => cart.reduce((s, l) => s + l.product.priceMad * l.qty, 0),
    [cart],
  );

  useEffect(() => {
    let cancelled = false;
    void loadLoyalty().then((data) => {
      if (cancelled) return;
      if (data) {
        setLoyaltyBalance(data.balance);
        setLoyaltyTxs(data.transactions);
      }
      setLoyaltyHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loyaltyHydrated) return;
    void saveLoyalty({
      balance: loyaltyBalance,
      transactions: loyaltyTxs,
    });
  }, [loyaltyHydrated, loyaltyBalance, loyaltyTxs]);

  const addToCart = useCallback(
    (product: Product, qty = 1, opts?: { silent?: boolean }) => {
      setCart((prev) => {
        const i = prev.findIndex((l) => l.product.id === product.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + qty };
          return next;
        }
        return [...prev, { product, qty }];
      });
      if (!opts?.silent) {
        Alert.alert('Panier', `${product.title} ajouté au panier.`);
      }
    },
    [],
  );

  const setLineQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.product.id !== productId);
      return prev.map((l) =>
        l.product.id === productId ? { ...l, qty } : l,
      );
    });
  }, []);

  const checkout = useCallback(() => {
    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des articles avant de valider.');
      return;
    }
    const orderId = `CMD-${Date.now()}`;
    const earned = pointsEarnedFromOrder(cartTotal);
    const dateLabel = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tx: LoyaltyTransaction = {
      id: `earn_${orderId}`,
      at: new Date().toISOString(),
      type: 'earn',
      points: earned,
      detail: `Commande ${orderId} · ${cartTotal} DH`,
    };

    setLoyaltyBalance((b) => b + earned);
    setLoyaltyTxs((prev) => [tx, ...prev].slice(0, 80));
    setOrderHistory((prev) => [
      {
        id: orderId,
        dateLabel,
        status: 'Confirmée',
        totalLabel: `${cartTotal} DH`,
      },
      ...prev,
    ]);
    setCart([]);
    Alert.alert(
      'Commande confirmée',
      `Merci ! Livraison à ${city}.\n+${earned} pts fidélité (total : ${
        loyaltyBalance + earned
      } pts).`,
    );
  }, [cart.length, cartTotal, city, loyaltyBalance]);

  const toggleCategory = useCallback((id: CategoryId) => {
    setSelectedCategory((cur) => (cur === id ? null : id));
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <LinearGradient
          colors={[G, HEADER_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGreen}
        >
          <View style={styles.headerRow}>
            <Pressable
              style={styles.locationRow}
              onPress={() => setCityModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Changer la ville"
            >
              <View style={styles.limeDot} />
              <Text style={styles.locationCity}>{city}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.white} />
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>

      {tab === 'home' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={22}
              color={colors.homeMuted}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Que veux-tu commander ?"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.homeMuted} />
              </Pressable>
            )}
          </View>

          <View style={styles.catRow}>
            {CATEGORIES_META.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    styles.catItem,
                    pressed && styles.tabPressed,
                  ]}
                  onPress={() => toggleCategory(c.id)}
                >
                  <View
                    style={[
                      styles.catCircle,
                      active && styles.catCircleActive,
                    ]}
                  >
                    <ProductRemoteImage
                      uri={CATEGORY_IMAGES[c.id]}
                      category={c.id}
                      style={styles.catImage}
                    />
                  </View>
                  <Text style={styles.catLabel}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {selectedCategory && (
            <Pressable
              style={styles.clearFilter}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.clearFilterText}>
                Afficher toutes les catégories ×
              </Text>
            </Pressable>
          )}

          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Recommandé pour toi</Text>
          </View>
          {homeFiltered.length === 0 ? (
            <Text style={styles.emptyText}>
              Aucun résultat. Essayez un autre mot-clé ou une catégorie.
            </Text>
          ) : (
            <View style={styles.productGrid}>
              {homeFiltered.map((item) => (
                <View key={item.id} style={styles.recCard}>
                  <Pressable onPress={() => setDetailProduct(item)}>
                    <ProductRemoteImage
                      uri={item.image}
                      category={item.category}
                      style={styles.recImage}
                    />
                  </Pressable>
                  <View style={styles.recBody}>
                    <Pressable onPress={() => setDetailProduct(item)}>
                      <Text style={styles.recTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.recPrice}>{item.priceLabel}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.quickAddBtn,
                        pressed && styles.quickAddBtnPressed,
                      ]}
                      onPress={() => addToCart(item, 1)}
                      accessibilityLabel={`Ajouter ${item.title} au panier`}
                    >
                      <Ionicons name="add-circle" size={20} color={G} />
                      <Text style={styles.quickAddText}>Ajouter</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}


      {tab === 'cart' && (
        <View style={styles.cartTab}>
          {cart.length === 0 ? (
            <View style={styles.placeholder}>
              <Ionicons name="cart-outline" size={56} color={colors.homeMuted} />
              <Text style={styles.placeholderTitle}>Panier vide</Text>
              <Text style={styles.placeholderSub}>
                Parcourez l&apos;accueil et ajoutez des articles.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryBtnPressed,
                ]}
                onPress={() => setTab('home')}
              >
                <Text style={styles.primaryBtnText}>Voir l’accueil</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                keyExtractor={(l) => l.product.id}
                style={styles.cartListFlex}
                contentContainerStyle={styles.cartList}
                renderItem={({ item: line }) => (
                  <View style={styles.cartRow}>
                    <Pressable onPress={() => setDetailProduct(line.product)}>
                      <ProductRemoteImage
                        uri={line.product.image}
                        category={line.product.category}
                        style={styles.cartThumb}
                      />
                    </Pressable>
                    <View style={styles.cartMid}>
                      <Pressable onPress={() => setDetailProduct(line.product)}>
                        <Text style={styles.recTitle}>{line.product.title}</Text>
                        <Text style={styles.recPrice}>{line.product.priceLabel}</Text>
                      </Pressable>
                      <View style={styles.qtyRow}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.qtyBtn,
                            pressed && styles.qtyBtnPressed,
                          ]}
                          onPress={() =>
                            setLineQty(line.product.id, line.qty - 1)
                          }
                          accessibilityLabel="Diminuer la quantité"
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </Pressable>
                        <Text style={styles.qtyVal}>{line.qty}</Text>
                        <Pressable
                          style={({ pressed }) => [
                            styles.qtyBtn,
                            pressed && styles.qtyBtnPressed,
                          ]}
                          onPress={() =>
                            setLineQty(line.product.id, line.qty + 1)
                          }
                          accessibilityLabel="Augmenter la quantité"
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              />
              <View style={styles.cartFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>{cartTotal} DH</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                  onPress={checkout}
                >
                  <Text style={styles.primaryBtnText}>Commander</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {tab === 'orders' && (
        <View style={styles.ordersTab}>
          <FlatList
            data={orderHistory}
            keyExtractor={(o) => o.id}
            contentContainerStyle={styles.ordersList}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.orderCard,
                  pressed && styles.rowPressed,
                ]}
                onPress={() =>
                  Alert.alert(
                    item.id,
                    `Statut : ${item.status}\nDate : ${item.dateLabel}\nMontant : ${item.totalLabel}\nLivraison : ${city}`,
                  )
                }
              >
              <View>
                <Text style={styles.orderId}>{item.id}</Text>
                <Text style={styles.orderDate}>{item.dateLabel}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderStatus}>{item.status}</Text>
                <Text style={styles.recPrice}>{item.totalLabel}</Text>
              </View>
              </Pressable>
            )}
            ListHeaderComponent={
              <Text style={styles.ordersHint}>
                Commandes récentes à {city}
              </Text>
            }
          />
        </View>
      )}

      {tab === 'loyalty' && <View style={styles.loyaltyBlankPage} />}

      <SafeAreaView style={styles.tabSafe} edges={['bottom']}>
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = tab === t.id;
            const name = active && t.iconActive ? t.iconActive : t.icon;
            const color =
              t.id === 'loyalty' && active
                ? '#E6B800'
                : active
                  ? G
                  : colors.homeMuted;
            return (
              <Pressable
                key={t.id}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && styles.tabPressed,
                ]}
                onPress={() => setTab(t.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {active && t.id === 'home' && <View style={styles.tabDot} />}
                <View>
                  <Ionicons name={name} size={24} color={color} />
                  {t.id === 'cart' && cart.length > 0 && (
                    <View style={styles.tabCartBadge}>
                      <Text style={styles.tabCartBadgeText}>
                        {cart.reduce((s, l) => s + l.qty, 0)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Détail produit */}
      <Modal
        visible={detailProduct !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailProduct(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setDetailProduct(null)}
            accessibilityLabel="Fermer la fiche produit"
          />
          <View style={styles.detailSheet}>
            {detailProduct && (
              <>
                <ProductRemoteImage
                  uri={detailProduct.image}
                  category={detailProduct.category}
                  style={styles.detailImage}
                />
                <ScrollView style={styles.detailScroll}>
                  <Text style={styles.detailTitle}>{detailProduct.title}</Text>
                  <Text style={styles.detailPrice}>{detailProduct.priceLabel}</Text>
                  <Text style={styles.detailDesc}>
                    Livraison à {city}. Paiement à la livraison ou en ligne
                    (démo).
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.primaryBtnPressed,
                    ]}
                    onPress={() => {
                      const p = detailProduct;
                      addToCart(p, 1, { silent: true });
                      setDetailProduct(null);
                      Alert.alert('Panier', `${p.title} a été ajouté à votre panier.`);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Ajouter au panier</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => setDetailProduct(null)}
                  >
                    <Text style={styles.secondaryBtnText}>Fermer</Text>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Choix de la ville */}
      <Modal visible={cityModal} animationType="fade" transparent>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setCityModal(false)}
            accessibilityLabel="Fermer le choix de ville"
          />
          <View style={styles.sheetBox}>
            <Text style={styles.sheetTitle}>Ville de livraison</Text>
            <FlatList
              data={[...CITIES]}
              keyExtractor={(item) => item}
              style={styles.cityList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.cityRow,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => {
                    setCity(item);
                    setCityModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.cityRowText,
                      item === city && styles.cityRowTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === city && (
                    <Ionicons name="checkmark-circle" size={22} color={G} />
                  )}
                </Pressable>
              )}
            />
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setCityModal(false)}
            >
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeBg,
  },
  headerSafe: {
    backgroundColor: HEADER_END,
  },
  headerGreen: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LIME,
  },
  locationCity: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    maxWidth: 200,
    letterSpacing: -0.2,
  },
  notifBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.homeNotifBg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeSurface,
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 16,
    minHeight: 52,
    marginBottom: 20,
    ...cardElevation,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  catItem: {
    alignItems: 'center',
    width: '22%',
    minWidth: 68,
  },
  catCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(26,115,79,0.12)',
    backgroundColor: colors.homeSurface,
    ...Platform.select({
      ios: {
        shadowColor: '#1A734F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  catCircleActive: {
    borderColor: LIME,
    borderWidth: 3,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catLabel: {
    fontSize: 11,
    color: colors.homeMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: LIME,
  },
  clearFilter: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  clearFilterText: {
    fontSize: 13,
    color: G,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: HEADER_END,
    letterSpacing: -0.4,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: colors.homeMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  recCard: {
    width: '48%',
    backgroundColor: colors.homeSurface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0,
    marginBottom: 12,
    ...cardElevation,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(26,115,79,0.08)',
    borderWidth: 0,
  },
  quickAddBtnPressed: {
    opacity: 0.75,
  },
  quickAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: G,
  },
  recImage: {
    width: '100%',
    height: 128,
    backgroundColor: colors.homeCardBeige,
  },
  recBody: {
    padding: 12,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  recPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.homePrice,
  },
  tabBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  loyaltyBlankPage: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchPage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.homeBg,
  },
  searchHeroBand: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 44,
  },
  searchKicker: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(19, 66, 50, 0.85)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  searchHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: HEADER_END,
    letterSpacing: -0.8,
    lineHeight: 32,
    maxWidth: 320,
  },
  searchHeadlineAccent: {
    color: G,
  },
  searchPageOverlap: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: -36,
    paddingHorizontal: 18,
    paddingBottom: 8,
    zIndex: 2,
  },
  searchSurface: {
    backgroundColor: colors.homeSurface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 79, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#0f291c',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  searchWrapPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF6',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 115, 79, 0.22)',
    paddingHorizontal: 12,
    minHeight: 54,
  },
  searchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 115, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchInputPremium: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 12,
    letterSpacing: -0.2,
  },
  searchRayonLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginTop: 18,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  searchChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 6,
    flexWrap: 'nowrap',
  },
  searchChipV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#F1F5F4',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchChipV2On: {
    backgroundColor: G,
    borderColor: G,
    ...Platform.select({
      ios: {
        shadowColor: G,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  searchChipV2Text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.homeMuted,
    letterSpacing: -0.2,
  },
  searchChipV2TextOn: {
    color: colors.white,
  },
  searchChipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  searchSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  searchSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  searchCountPill: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 115, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCountPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: G,
  },
  searchCardPremium: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.homeSurface,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
    borderColor: 'rgba(26, 115, 79, 0.09)',
    borderLeftColor: G,
    ...Platform.select({
      ios: {
        shadowColor: '#0f291c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  searchCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  searchCardImageCol: {
    justifyContent: 'center',
    paddingLeft: 14,
    paddingVertical: 12,
  },
  searchCardImagePremium: {
    width: 92,
    height: 92,
    borderRadius: 18,
    backgroundColor: colors.homeCardBeige,
  },
  searchCardBodyPremium: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 14,
    paddingRight: 8,
    minWidth: 0,
    justifyContent: 'center',
  },
  searchCardTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26, 115, 79, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  searchCardTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: G,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  searchCardTitlePremium: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  searchCardPriceCol: {
    justifyContent: 'center',
    paddingRight: 14,
    paddingLeft: 4,
  },
  searchPricePill: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(183, 121, 31, 0.25)',
  },
  searchCardPricePremium: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.homePrice,
    letterSpacing: -0.3,
  },
  searchEmptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  searchEmptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.homeSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(26, 115, 79, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#0f291c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  searchEmptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 18,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  searchEmptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  searchList: {
    paddingBottom: 28,
  },
  searchListFlex: {
    flex: 1,
  },
  rowPressed: {
    opacity: 0.85,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeSurface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0,
    gap: 12,
    ...cardElevation,
  },
  searchThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.homeCardBeige,
  },
  searchRowText: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: G,
    marginTop: 12,
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 15,
    color: colors.homeMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: G,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.88,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: G,
    fontSize: 16,
    fontWeight: '600',
  },
  cartTab: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  cartListFlex: {
    flex: 1,
  },
  cartList: {
    paddingBottom: 16,
  },
  cartRow: {
    flexDirection: 'row',
    backgroundColor: colors.homeSurface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0,
    gap: 12,
    ...cardElevation,
  },
  cartThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.homeCardBeige,
  },
  cartMid: {
    flex: 1,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.homeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0DED8',
  },
  qtyBtnPressed: {
    opacity: 0.7,
    backgroundColor: '#E8E6E0',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: G,
  },
  qtyVal: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  cartFooter: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E4DF',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.homeMuted,
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '800',
    color: G,
    marginBottom: 10,
  },
  ordersTab: {
    flex: 1,
  },
  ordersList: {
    padding: 18,
    paddingBottom: 32,
  },
  ordersHint: {
    fontSize: 14,
    color: colors.homeMuted,
    marginBottom: 14,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.homeSurface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 0,
    ...cardElevation,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: 13,
    color: colors.homeMuted,
    marginTop: 4,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: G,
    marginBottom: 4,
  },
  loyaltyContent: {
    padding: 18,
    paddingBottom: 32,
  },
  loyaltyListContent: {
    padding: 18,
    paddingBottom: 40,
  },
  loyaltyRedeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: G,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  loyaltyRedeemBtnDisabled: {
    backgroundColor: '#E5E4DF',
  },
  loyaltyRedeemText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  loyaltyRedeemTextDisabled: {
    color: colors.homeMuted,
  },
  loyaltySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: G,
    marginBottom: 12,
    marginTop: 8,
  },
  loyaltyEmpty: {
    fontSize: 14,
    color: colors.homeMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  loyaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeSurface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0f291c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  loyaltyRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyRowIconEarn: {
    backgroundColor: '#ECFDF5',
  },
  loyaltyRowIconRedeem: {
    backgroundColor: '#FFFBEB',
  },
  loyaltyRowMid: {
    flex: 1,
    minWidth: 0,
  },
  loyaltyRowDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loyaltyRowDate: {
    fontSize: 12,
    color: colors.homeMuted,
    marginTop: 4,
  },
  loyaltyRowPts: {
    fontSize: 16,
    fontWeight: '800',
  },
  loyaltyPtsPos: {
    color: G,
  },
  loyaltyPtsNeg: {
    color: '#B45309',
  },
  loyaltyCard: {
    backgroundColor: colors.homeSurface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0,
    ...cardElevation,
  },
  loyaltyPts: {
    fontSize: 36,
    fontWeight: '800',
    color: G,
    marginTop: 12,
  },
  loyaltySub: {
    fontSize: 14,
    color: colors.homeMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.homeBg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LIME,
    borderRadius: 5,
  },
  loyaltyLegal: {
    fontSize: 12,
    color: colors.homeMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  loyaltyInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.homeSurface,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 0,
    gap: 8,
    ...cardElevation,
  },
  loyaltyInfoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: G,
  },
  tabSafe: {
    backgroundColor: colors.homeSurface,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  tabPressed: {
    opacity: 0.75,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIME,
    marginBottom: 2,
  },
  tabCartBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: G,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 9,
    color: colors.homeMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: G,
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.homeCardBeige,
  },
  detailScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.homePrice,
    marginTop: 8,
  },
  detailDesc: {
    fontSize: 15,
    color: colors.homeMuted,
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 22,
  },
  sheetBox: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  notifSheet: {
    maxHeight: '80%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  cityList: {
    maxHeight: 320,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E0',
  },
  cityRowText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  cityRowTextActive: {
    fontWeight: '700',
    color: G,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: G,
  },
  notifRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E0',
  },
  notifUnread: {
    backgroundColor: '#F0FDF4',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifBody: {
    fontSize: 14,
    color: colors.homeMuted,
    marginTop: 4,
  },
});
