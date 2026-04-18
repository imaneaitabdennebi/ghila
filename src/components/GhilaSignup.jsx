import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

/** Vert principal (maquette) */
const GHILA_GREEN = '#1A734F';

const PRESETS = [
  { id: 'MA', dial: '+212', label: 'MA', name: 'Maroc' },
  { id: 'FR', dial: '+33', label: 'FR', name: 'France' },
  { id: 'US', dial: '+1', label: 'US', name: 'États-Unis' },
];

/** URLs (pages publiques — remplacez par les vôtres en production) */
const URLS = {
  terms: 'https://www.whatsapp.com/legal/',
  privacy: 'https://www.whatsapp.com/legal/privacy-policy',
  cookies: 'https://www.whatsapp.com/legal/cookies',
  googleOAuth:
    'https://accounts.google.com/signin/oauth/identifier?flowName=GeneralOAuthFlow',
  facebookOAuth: 'https://www.facebook.com/login.php',
};

function showAppAlert(title, message) {
  const body =
    message !== undefined && message !== '' ? `${title}\n${message}` : title;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(body);
    return;
  }
  if (message !== undefined && message !== '') {
    Alert.alert(title, message);
  } else {
    Alert.alert(title);
  }
}

async function openUrl(url) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    showAppAlert('Erreur', "Impossible d'ouvrir le lien.");
  }
}

function randomSixDigitOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailFormat(raw) {
  const s = raw.trim();
  if (!s) return { ok: false, error: 'Saisissez une adresse e-mail.' };
  if (!EMAIL_RE.test(s)) return { ok: false, error: 'Adresse e-mail invalide.' };
  return { ok: true, email: s };
}

/**
 * @param {{ id: string, dial: string }} prefix
 * @param {string} rawPhone
 * @returns {{ ok: true, e164: string, nationalDigits: string } | { ok: false, error: string }}
 */
function validatePhone(prefix, rawPhone) {
  let d = rawPhone.replace(/\D/g, '');
  if (!d) {
    return { ok: false, error: 'Saisissez votre numéro de téléphone.' };
  }

  if (prefix.id === 'MA') {
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length !== 9) {
      return {
        ok: false,
        error:
          'Numéro marocain : 9 chiffres après l’indicatif (ex. 612345678 ou 0612345678).',
      };
    }
  } else if (prefix.id === 'FR') {
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length !== 9) {
      return {
        ok: false,
        error: 'Numéro français : 9 chiffres (ex. 612345678 ou 0612345678).',
      };
    }
  } else if (prefix.id === 'US') {
    if (d.length !== 10) {
      return {
        ok: false,
        error: 'Numéro US : 10 chiffres.',
      };
    }
  }

  const dialDigits = prefix.dial.replace(/\D/g, '');
  const e164 = `+${dialDigits}${d}`;
  return { ok: true, e164, nationalDigits: d };
}

/** wa.me : numéro international sans + ni espaces */
function e164ToWaDigits(e164) {
  return e164.replace(/\D/g, '');
}

/** Logo Google multicolore (24×24) */
function GoogleLogo({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

/**
 * @param {{
 *   onClose?: () => void;
 *   onAuthenticated?: (payload: {
 *     provider: 'whatsapp' | 'google' | 'facebook' | 'email';
 *     phone?: string;
 *     email?: string;
 *   }) => void;
 * }} props
 */
export default function GhilaSignup({ onClose, onAuthenticated }) {
  const initial = PRESETS[0];
  const [prefix, setPrefix] = useState(initial);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /** OAuth Google / Facebook (démo — branchez @react-native-google-signin / FB SDK en prod) */
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState('');
  const [googleOAuthBusy, setGoogleOAuthBusy] = useState(false);
  const [facebookModalOpen, setFacebookModalOpen] = useState(false);
  const [facebookAccountEmail, setFacebookAccountEmail] = useState('');
  const [facebookOAuthBusy, setFacebookOAuthBusy] = useState(false);

  /** Flux WhatsApp (OTP simulé — branchez votre API / Twilio / WhatsApp Business ici) */
  const [waSending, setWaSending] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpPhoneE164, setOtpPhoneE164] = useState('');
  const [resendSec, setResendSec] = useState(0);

  useEffect(() => {
    if (resendSec <= 0) return undefined;
    const t = setInterval(() => {
      setResendSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const fullNumberDisplay = useMemo(() => {
    const v = validatePhone(prefix, phone);
    if (v.ok) return v.e164;
    const dial = prefix.dial.replace(/\D/g, '');
    const d = phone.replace(/\D/g, '');
    return d ? `+${dial}${d}` : prefix.dial;
  }, [prefix, phone]);

  const sendWhatsAppOtp = useCallback(
    async () => {
      const v = validatePhone(prefix, phone);
      if (!v.ok) {
        showAppAlert('Numéro invalide', v.error);
        return;
      }
      const code = randomSixDigitOtp();
      setWaSending(true);
      try {
        /** Simule l’appel API « envoi OTP sur WhatsApp » — branchez votre backend ici */
        await new Promise((r) => setTimeout(r, 1200));
        setExpectedOtp(code);
        setOtpPhoneE164(v.e164);
        setOtpCode('');
        setOtpModalOpen(true);
        setResendSec(60);
      } finally {
        setWaSending(false);
      }
    },
    [prefix, phone],
  );

  const openWhatsAppChat = useCallback(() => {
    if (!otpPhoneE164) return;
    const waDigits = e164ToWaDigits(otpPhoneE164);
    const text = encodeURIComponent(
      `Ghila — ma connexion. Numéro : ${otpPhoneE164}`,
    );
    void openUrl(`https://wa.me/${waDigits}?text=${text}`);
  }, [otpPhoneE164]);

  const handleWhatsApp = () => {
    void sendWhatsAppOtp();
  };

  const handleVerifyOtp = () => {
    const entered = otpCode.replace(/\D/g, '');
    if (entered.length !== 6) {
      showAppAlert('Code', 'Saisissez les 6 chiffres du code.');
      return;
    }
    if (entered !== expectedOtp) {
      showAppAlert('Code incorrect', 'Le code ne correspond pas. Réessayez.');
      return;
    }
    setOtpModalOpen(false);
    showAppAlert(
      'Connexion réussie',
      `Votre numéro ${otpPhoneE164} est vérifié.`,
    );
    onAuthenticated?.({ provider: 'whatsapp', phone: otpPhoneE164 });
  };

  const handleResendOtp = () => {
    if (resendSec > 0) return;
    void sendWhatsAppOtp();
  };

  const handleGoogle = () => {
    setGoogleAccountEmail('');
    setGoogleModalOpen(true);
  };

  const handleGoogleOpenBrowser = () => {
    void openUrl(URLS.googleOAuth);
  };

  const handleGoogleFinish = async () => {
    const v = validateEmailFormat(googleAccountEmail);
    if (!v.ok) {
      showAppAlert('Google', v.error);
      return;
    }
    setGoogleOAuthBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setGoogleModalOpen(false);
      showAppAlert(
        'Google',
        `Connexion réussie avec ${v.email} (démo — branchez votre OAuth Google en production).`,
      );
      onAuthenticated?.({ provider: 'google', email: v.email });
    } finally {
      setGoogleOAuthBusy(false);
    }
  };

  const handleFacebook = () => {
    setFacebookAccountEmail('');
    setFacebookModalOpen(true);
  };

  const handleFacebookOpenBrowser = () => {
    void openUrl(URLS.facebookOAuth);
  };

  const handleFacebookFinish = async () => {
    const v = validateEmailFormat(facebookAccountEmail);
    if (!v.ok) {
      showAppAlert('Facebook', v.error);
      return;
    }
    setFacebookOAuthBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setFacebookModalOpen(false);
      showAppAlert(
        'Facebook',
        `Connexion réussie avec ${v.email} (démo — branchez Facebook Login en production).`,
      );
      onAuthenticated?.({ provider: 'facebook', email: v.email });
    } finally {
      setFacebookOAuthBusy(false);
    }
  };

  const handleEmailSignup = () => {
    const ev = validateEmailFormat(email);
    if (!ev.ok) {
      showAppAlert('E-mail', ev.error);
      return;
    }
    if (!password.trim() || !confirmPassword.trim()) {
      showAppAlert('Champs requis', 'Remplissez le mot de passe et la confirmation.');
      return;
    }
    if (password.length < 8) {
      showAppAlert('Mot de passe', 'Au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      showAppAlert(
        'Mots de passe',
        'Les mots de passe ne correspondent pas.',
      );
      return;
    }
    setEmailModalOpen(false);
    showAppAlert(
      'Inscription',
      `Compte créé pour ${ev.email} (simulation — ajoutez votre API d’inscription).`,
    );
    onAuthenticated?.({ provider: 'email', email: ev.email });
  };

  const handleMainClose = () => {
    if (otpModalOpen) {
      setOtpModalOpen(false);
      return;
    }
    if (googleModalOpen) {
      setGoogleModalOpen(false);
      return;
    }
    if (facebookModalOpen) {
      setFacebookModalOpen(false);
      return;
    }
    if (emailModalOpen) {
      setEmailModalOpen(false);
      return;
    }
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    onClose?.();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          className="flex-1"
        >
          <View className="w-full max-w-[390px] self-center flex-1 px-5">
            <View className="flex-row items-center justify-between pt-2 pb-6">
              <View
                className="h-14 w-14 items-center justify-center rounded-2xl px-2"
                style={{ backgroundColor: GHILA_GREEN }}
              >
                <View className="flex-row items-center gap-1">
                  <Ionicons name="bulb-outline" size={22} color="#FFFFFF" />
                  <Text className="text-[15px] font-bold text-white">Gh|la</Text>
                </View>
              </View>
              <Pressable
                onPress={handleMainClose}
                accessibilityLabel="Fermer"
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 active:opacity-80"
              >
                <Text className="text-2xl leading-none text-neutral-700">×</Text>
              </Pressable>
            </View>

            <Text className="text-center text-3xl font-bold text-neutral-900">
              Bienvenue
            </Text>
            <Text className="mt-2 text-center text-[15px] text-neutral-500">
              Continuez avec l&apos;une des options suivantes
            </Text>

            <View className="mt-8 flex-row gap-2">
              <View className="min-w-[124px] max-w-[40%] shrink-0">
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  className="h-12 flex-row items-center justify-center gap-1 rounded-full border border-neutral-200 bg-white px-3 active:bg-neutral-50"
                >
                  <Text
                    className="text-[13px] font-medium text-neutral-800"
                    numberOfLines={1}
                  >
                    {prefix.label} {prefix.dial}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#737373" />
                </Pressable>
              </View>
              <View className="min-w-0 flex-1">
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Numéro de téléphone"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="phone-pad"
                  className="h-12 rounded-full border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900"
                />
              </View>
            </View>

            <Text className="mt-2 text-xs leading-5 text-neutral-500">
              Ce site est protégé par reCAPTCHA. Consultez notre{' '}
              <Text
                style={{ color: GHILA_GREEN }}
                className="font-medium"
                onPress={() => void openUrl(URLS.privacy)}
              >
                politique de confidentialité
              </Text>{' '}
              et nos{' '}
              <Text
                style={{ color: GHILA_GREEN }}
                className="font-medium"
                onPress={() => void openUrl(URLS.terms)}
              >
                conditions d&apos;utilisation
              </Text>
              .
            </Text>

            <Pressable
              onPress={handleWhatsApp}
              disabled={waSending}
              className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-full active:opacity-90"
              style={{
                backgroundColor: GHILA_GREEN,
                opacity: waSending ? 0.85 : 1,
              }}
            >
              {waSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : null}
              <Text className="text-base font-bold text-white">
                Continuer avec WhatsApp
              </Text>
            </Pressable>

            <View className="my-7 flex-row items-center">
              <View className="h-px flex-1 bg-neutral-200" />
              <Text className="mx-3 text-sm text-neutral-500">ou avec</Text>
              <View className="h-px flex-1 bg-neutral-200" />
            </View>

            <View className="gap-3">
              <Pressable
                onPress={handleGoogle}
                className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <GoogleLogo size={22} />
                <Text className="text-[15px] font-semibold text-neutral-800">
                  Google
                </Text>
              </Pressable>
              <Pressable
                onPress={handleFacebook}
                className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#1877F2]">
                  <Ionicons name="logo-facebook" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-[15px] font-semibold text-neutral-800">
                  Facebook
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setEmailModalOpen(true)}
                className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <Ionicons name="mail-outline" size={22} color="#404040" />
                <Text className="text-[15px] font-semibold text-neutral-800">
                  E-mail
                </Text>
              </Pressable>
            </View>

            <Text className="mt-10 text-center text-xs leading-5 text-neutral-500">
              En continuant, vous acceptez nos{' '}
              <Text
                style={{ color: GHILA_GREEN }}
                className="font-medium"
                onPress={() => void openUrl(URLS.terms)}
              >
                Conditions d&apos;utilisation
              </Text>
              , notre{' '}
              <Text
                style={{ color: GHILA_GREEN }}
                className="font-medium"
                onPress={() => void openUrl(URLS.privacy)}
              >
                Politique de confidentialité
              </Text>{' '}
              et notre{' '}
              <Text
                style={{ color: GHILA_GREEN }}
                className="font-medium"
                onPress={() => void openUrl(URLS.cookies)}
              >
                Politique en matière de cookies
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sélecteur de préfixe */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-3 text-center text-base font-semibold text-neutral-900">
              Indicatif pays
            </Text>
            {PRESETS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setPrefix(p);
                  setPickerOpen(false);
                }}
                className="flex-row items-center gap-3 border-b border-neutral-100 py-3 active:bg-neutral-50"
              >
                <Text className="text-base font-medium text-neutral-900">
                  {p.name} · {p.label} {p.dial}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal OTP WhatsApp (démo — code généré côté app) */}
      <Modal
        visible={otpModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setOtpModalOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/50"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1" onPress={() => setOtpModalOpen(false)} />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-neutral-900">
                Code WhatsApp
              </Text>
              <Pressable
                onPress={() => setOtpModalOpen(false)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
              >
                <Text className="text-2xl text-neutral-700">×</Text>
              </Pressable>
            </View>
            <Text className="mb-1 text-sm text-neutral-600">
              Saisissez le code à 6 chiffres envoyé au{' '}
              <Text className="font-semibold text-neutral-900">
                {otpPhoneE164 || fullNumberDisplay}
              </Text>
              .
            </Text>
            <View
              className="mb-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2"
            >
              <Text className="text-xs text-neutral-500">
                Mode démo : le code est généré dans l’app (pas de SMS réel).
                Code actuel :{' '}
                <Text className="font-mono text-base font-bold text-neutral-900">
                  {expectedOtp || '------'}
                </Text>
              </Text>
            </View>
            <TextInput
              value={otpCode}
              onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor="#a3a3a3"
              keyboardType="number-pad"
              maxLength={6}
              className="mb-4 h-14 rounded-xl border border-neutral-200 px-3 text-center text-2xl font-semibold tracking-widest text-neutral-900"
            />
            <Pressable
              onPress={handleVerifyOtp}
              className="mb-3 h-12 items-center justify-center rounded-full active:opacity-90"
              style={{ backgroundColor: GHILA_GREEN }}
            >
              <Text className="text-base font-bold text-white">
                Vérifier le code
              </Text>
            </Pressable>
            <Pressable
              onPress={handleResendOtp}
              disabled={resendSec > 0 || waSending}
              className="items-center py-2"
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: resendSec > 0 || waSending ? '#a3a3a3' : GHILA_GREEN,
                }}
              >
                {resendSec > 0
                  ? `Renvoyer le code (${resendSec}s)`
                  : 'Renvoyer le code'}
              </Text>
            </Pressable>
            <Pressable
              onPress={openWhatsAppChat}
              className="mt-2 items-center py-2"
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: GHILA_GREEN }}
              >
                Ouvrir WhatsApp avec ce numéro
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Google — saisie + navigateur + finalisation (démo) */}
      <Modal
        visible={googleModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setGoogleModalOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/50"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            className="flex-1"
            onPress={() => setGoogleModalOpen(false)}
          />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <GoogleLogo size={28} />
                <Text className="text-lg font-bold text-neutral-900">
                  Google
                </Text>
              </View>
              <Pressable
                onPress={() => setGoogleModalOpen(false)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
              >
                <Text className="text-2xl text-neutral-700">×</Text>
              </Pressable>
            </View>
            <Text className="mb-3 text-sm leading-5 text-neutral-600">
              Saisissez l’e-mail du compte Google, puis finalisez. Vous pouvez
              aussi ouvrir la page de connexion Google dans le navigateur.
            </Text>
            <TextInput
              value={googleAccountEmail}
              onChangeText={setGoogleAccountEmail}
              placeholder="vous@gmail.com"
              placeholderTextColor="#a3a3a3"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="mb-3 h-12 rounded-xl border border-neutral-200 px-3 text-[15px] text-neutral-900"
            />
            <Pressable
              onPress={handleGoogleOpenBrowser}
              className="mb-3 h-11 items-center justify-center rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
            >
              <Text className="text-sm font-semibold text-neutral-800">
                Ouvrir Google dans le navigateur
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void handleGoogleFinish()}
              disabled={googleOAuthBusy}
              className="h-12 flex-row items-center justify-center gap-2 rounded-full active:opacity-90"
              style={{
                backgroundColor: '#4285F4',
                opacity: googleOAuthBusy ? 0.85 : 1,
              }}
            >
              {googleOAuthBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : null}
              <Text className="text-base font-bold text-white">
                Continuer avec Google
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Facebook — même principe */}
      <Modal
        visible={facebookModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFacebookModalOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/50"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            className="flex-1"
            onPress={() => setFacebookModalOpen(false)}
          />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-[#1877F2]">
                  <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
                </View>
                <Text className="text-lg font-bold text-neutral-900">
                  Facebook
                </Text>
              </View>
              <Pressable
                onPress={() => setFacebookModalOpen(false)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
              >
                <Text className="text-2xl text-neutral-700">×</Text>
              </Pressable>
            </View>
            <Text className="mb-3 text-sm leading-5 text-neutral-600">
              Saisissez l’e-mail lié à votre compte Facebook, puis finalisez.
              Vous pouvez aussi ouvrir Facebook dans le navigateur.
            </Text>
            <TextInput
              value={facebookAccountEmail}
              onChangeText={setFacebookAccountEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor="#a3a3a3"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="mb-3 h-12 rounded-xl border border-neutral-200 px-3 text-[15px] text-neutral-900"
            />
            <Pressable
              onPress={handleFacebookOpenBrowser}
              className="mb-3 h-11 items-center justify-center rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
            >
              <Text className="text-sm font-semibold text-neutral-800">
                Ouvrir Facebook dans le navigateur
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void handleFacebookFinish()}
              disabled={facebookOAuthBusy}
              className="h-12 flex-row items-center justify-center gap-2 rounded-full active:opacity-90"
              style={{
                backgroundColor: '#1877F2',
                opacity: facebookOAuthBusy ? 0.85 : 1,
              }}
            >
              {facebookOAuthBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : null}
              <Text className="text-base font-bold text-white">
                Continuer avec Facebook
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal e-mail / mot de passe */}
      <Modal
        visible={emailModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModalOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/45"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            className="flex-1"
            onPress={() => setEmailModalOpen(false)}
          />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-neutral-900">
                S&apos;inscrire par e-mail
              </Text>
              <Pressable
                onPress={() => setEmailModalOpen(false)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
              >
                <Text className="text-2xl text-neutral-700">×</Text>
              </Pressable>
            </View>
            <Text className="mb-3 text-sm text-neutral-600">
              E-mail valide, mot de passe d&apos;au moins 8 caractères, puis
              confirmation.
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor="#a3a3a3"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-3 h-12 rounded-xl border border-neutral-200 px-3 text-[15px] text-neutral-900"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe"
              placeholderTextColor="#a3a3a3"
              secureTextEntry
              className="mb-3 h-12 rounded-xl border border-neutral-200 px-3 text-[15px] text-neutral-900"
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#a3a3a3"
              secureTextEntry
              className="mb-5 h-12 rounded-xl border border-neutral-200 px-3 text-[15px] text-neutral-900"
            />
            <Pressable
              onPress={handleEmailSignup}
              className="h-12 items-center justify-center rounded-full active:opacity-90"
              style={{ backgroundColor: GHILA_GREEN }}
            >
              <Text className="text-base font-bold text-white">S&apos;inscrire</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
