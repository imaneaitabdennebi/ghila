import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COUNTRY_PREFIXES, type CountryPrefix } from '../data/prefixes';
import { colors } from '../theme/colors';
import { GlovoOutlineButton } from './GlovoOutlineButton';

export type PhoneAuthPayload = {
  dialCode: string;
  phone: string;
  countryId: string;
};

type Props = {
  fullScreen?: boolean;
  defaultPrefixId?: string;
  onWhatsAppPress?: (payload: PhoneAuthPayload) => void;
  onGooglePress?: () => void;
  onFacebookPress?: () => void;
  onEmailPress?: () => void;
  onPrivacyPress?: () => void;
  onTermsPress?: () => void;
  onCookiesPress?: () => void;
};

export function SignupBottomSheet({
  fullScreen = false,
  defaultPrefixId = 'MA',
  onWhatsAppPress,
  onGooglePress,
  onFacebookPress,
  onEmailPress,
  onPrivacyPress,
  onTermsPress,
  onCookiesPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const initial =
    COUNTRY_PREFIXES.find((p) => p.id === defaultPrefixId) ?? COUNTRY_PREFIXES[0];
  const [prefix, setPrefix] = useState<CountryPrefix>(initial);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const waScale = useRef(new Animated.Value(1)).current;
  const waIn = () =>
    Animated.spring(waScale, {
      toValue: 0.98,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  const waOut = () =>
    Animated.spring(waScale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();

  const handleWhatsApp = () => {
    onWhatsAppPress?.({
      dialCode: prefix.dial,
      phone: phone.trim(),
      countryId: prefix.id,
    });
  };

  const sheetBg = fullScreen ? styles.sheetFull : null;
  const bottomPad = Math.max(insets.bottom, 20);
  const teal = colors.glovoTeal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <View style={[styles.sheet, sheetBg]}>
        {!fullScreen ? <View style={styles.handle} /> : null}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        >
          <View style={styles.contentColumn}>
          <Text style={styles.title}>Bienvenue</Text>
          <Text style={styles.subtitle}>
            Continuez avec l'une des options suivantes
          </Text>

          <View style={styles.phoneRow}>
            <View style={styles.prefixCol}>
              <Text style={styles.fieldLabel}>Préfixe</Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={({ pressed }) => [
                  styles.inputPill,
                  styles.prefixPill,
                  pressed && styles.inputPressed,
                ]}
              >
                <Text style={styles.prefixFlag}>{prefix.flag}</Text>
                <Text style={styles.prefixDial} numberOfLines={1}>
                  {prefix.dial}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.mutedGrey} />
              </Pressable>
            </View>
            <View style={styles.phoneCol}>
              <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Numéro de téléphone"
                placeholderTextColor={colors.mutedGrey}
                style={[
                  styles.inputPill,
                  styles.phoneInput,
                  phoneFocused && styles.inputFocused,
                ]}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>
          </View>

          <Text style={styles.recaptchaLine}>
            Le site est protégé par reCAPTCHA et la{' '}
            <Text style={styles.linkTeal} onPress={onPrivacyPress}>
              politique de confidentialité
            </Text>{' '}
            et les{' '}
            <Text style={styles.linkTeal} onPress={onTermsPress}>
              {"conditions d'utilisation"}
            </Text>{' '}
            de Google s'appliquent.
          </Text>

          <Pressable onPress={handleWhatsApp} onPressIn={waIn} onPressOut={waOut}>
            <Animated.View
              style={[
                styles.waBtn,
                { transform: [{ scale: waScale }] },
              ]}
            >
              <Text style={styles.waBtnText}>Continuer avec WhatsApp</Text>
            </Animated.View>
          </Pressable>

          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>ou avec</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.socialStack}>
            <GlovoOutlineButton variant="google" onPress={onGooglePress} />
            <View style={styles.socialGap} />
            <GlovoOutlineButton variant="facebook" onPress={onFacebookPress} />
            <View style={styles.socialGap} />
            <GlovoOutlineButton variant="email" onPress={onEmailPress} />
          </View>

          <Text style={styles.footerBlock}>
            En créant un compte, vous acceptez automatiquement nos{' '}
            <Text style={styles.linkTeal} onPress={onTermsPress}>
              Conditions d'utilisation
            </Text>
            , notre{' '}
            <Text style={styles.linkTeal} onPress={onPrivacyPress}>
              Politique de confidentialité
            </Text>{' '}
            et notre{' '}
            <Text style={styles.linkTeal} onPress={onCookiesPress}>
              Politique en matière de cookies
            </Text>
          </Text>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerOpen(false)}
            accessibilityLabel="Fermer"
          />
          <View style={[styles.modalCardWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.modalCard}>
              <View style={styles.modalGrabber} />
              <Text style={styles.modalTitle}>Indicatif pays</Text>
              <Text style={styles.modalHint}>Choisissez le pays associé à votre ligne</Text>
              <View style={styles.modalListOuter}>
                <FlatList
                  data={COUNTRY_PREFIXES}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  style={styles.modalList}
                  nestedScrollEnabled
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalRow,
                        prefix.id === item.id && styles.modalRowSelected,
                        pressed && styles.modalRowPressed,
                      ]}
                      onPress={() => {
                        setPrefix(item);
                        setPickerOpen(false);
                      }}
                    >
                      <Text style={styles.modalFlag}>{item.flag}</Text>
                      <View style={styles.modalRowTextWrap}>
                        <Text style={styles.modalName}>{item.name}</Text>
                        <Text style={styles.modalDial}>{item.dial}</Text>
                      </View>
                      {prefix.id === item.id ? (
                        <Ionicons name="checkmark-circle" size={24} color={teal} />
                      ) : (
                        <View style={styles.radioOuter} />
                      )}
                    </Pressable>
                  )}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetFull: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8E0D4',
    marginBottom: 16,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  contentColumn: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.glovoText,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.glovoText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  prefixCol: {
    width: '34%',
    maxWidth: 130,
  },
  phoneCol: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.glovoText,
    marginBottom: 8,
  },
  inputPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 28,
    minHeight: 52,
    justifyContent: 'center',
  },
  prefixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  inputPressed: {
    opacity: 0.92,
  },
  inputFocused: {
    borderColor: colors.glovoTeal,
  },
  prefixFlag: {
    fontSize: 20,
  },
  prefixDial: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.glovoText,
  },
  phoneInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.glovoText,
    fontWeight: '500',
  },
  recaptchaLine: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.mutedGrey,
    marginBottom: 22,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  linkTeal: {
    color: colors.glovoTeal,
    fontWeight: '700',
  },
  waBtn: {
    backgroundColor: colors.glovoTealDark,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  waBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
  },
  orText: {
    marginHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedGrey,
  },
  socialStack: {
    width: '100%',
  },
  socialGap: {
    height: 12,
  },
  footerBlock: {
    marginTop: 28,
    fontSize: 12,
    lineHeight: 18,
    color: colors.mutedGrey,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCardWrap: {
    paddingHorizontal: 12,
    width: '100%',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 8,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    marginTop: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.glovoText,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 13,
    color: colors.mutedGrey,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalListOuter: {
    maxHeight: 320,
    minHeight: 120,
  },
  modalList: {
    flexGrow: 0,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 14,
  },
  modalFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  modalRowTextWrap: {
    flex: 1,
  },
  modalName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.glovoText,
  },
  modalDial: {
    fontSize: 14,
    color: colors.mutedGrey,
    marginTop: 2,
  },
  modalRowSelected: {
    backgroundColor: colors.inputBg,
  },
  modalRowPressed: {
    opacity: 0.85,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderSoft,
  },
});
