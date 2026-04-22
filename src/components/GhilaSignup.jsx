import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { createClient } from '@supabase/supabase-js';
import { GhilaSignupLogo } from './GhilaSignupLogo';

/** Vert principal (maquette) */
const GHILA_GREEN = '#1A734F';

const PRESETS = [
  { id: 'MA', dial: '+212', label: 'MA', name: 'Maroc' },
  { id: 'FR', dial: '+33', label: 'FR', name: 'France' },
  { id: 'US', dial: '+1', label: 'US', name: 'États-Unis' },
];

/** URLs publiques (légal). */
const URLS = {
  terms: 'https://www.whatsapp.com/legal/',
  privacy: 'https://www.whatsapp.com/legal/privacy-policy',
  cookies: 'https://www.whatsapp.com/legal/cookies',
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

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
  const [signupEmailErr, setSignupEmailErr] = useState('');
  const [signupPasswordErr, setSignupPasswordErr] = useState('');
  const [signupConfirmErr, setSignupConfirmErr] = useState('');
  const [emailSignupBusy, setEmailSignupBusy] = useState(false);
  const [emailLoginBusy, setEmailLoginBusy] = useState(false);
  const [emailServerNotice, setEmailServerNotice] = useState('');
  const [emailServerErr, setEmailServerErr] = useState('');
  const [emailSignupSuccess, setEmailSignupSuccess] = useState(false);
  const [emailDoneEmail, setEmailDoneEmail] = useState('');

  /** OAuth réel Google/Facebook */
  const [oauthBusyProvider, setOauthBusyProvider] = useState(
    /** @type {null | 'google' | 'facebook'} */ (null),
  );
  const [oauthError, setOauthError] = useState('');
  const oauthSessionHandled = useRef(false);

  /** Flux WhatsApp (OTP simulé — branchez votre API / Twilio / WhatsApp Business ici) */
  const [phoneError, setPhoneError] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpPhoneE164, setOtpPhoneE164] = useState('');
  const [resendSec, setResendSec] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  useEffect(() => {
    if (resendSec <= 0) return undefined;
    const t = setInterval(() => {
      setResendSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  /** Succès WhatsApp : fermeture automatique + callback */
  useEffect(() => {
    if (!otpSuccess || !otpPhoneE164) return undefined;
    const t = setTimeout(() => {
      setOtpModalOpen(false);
      setOtpSuccess(false);
      setOtpCode('');
      setExpectedOtp('');
      setOtpError('');
      onAuthenticated?.({ provider: 'whatsapp', phone: otpPhoneE164 });
    }, 1400);
    return () => clearTimeout(t);
  }, [otpSuccess, otpPhoneE164, onAuthenticated]);

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;

    const mapProvider = (raw) => {
      if (raw === 'google' || raw === 'facebook' || raw === 'email') return raw;
      return 'email';
    };

    const notifyIfVerified = (session) => {
      if (!mounted || !session?.user || oauthSessionHandled.current) return;
      if (!session.user.email_confirmed_at) return;
      oauthSessionHandled.current = true;
      const provider = mapProvider(session.user.app_metadata?.provider);
      onAuthenticated?.({ provider, email: session.user.email || undefined });
    };

    void supabase.auth.getSession().then(({ data }) => {
      notifyIfVerified(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      notifyIfVerified(session);
      setOauthBusyProvider(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onAuthenticated]);

  useEffect(() => {
    if (!emailSignupSuccess || !emailDoneEmail) return undefined;
    const t = setTimeout(() => {
      onAuthenticated?.({ provider: 'email', email: emailDoneEmail });
      setEmailModalOpen(false);
      setEmailSignupSuccess(false);
      setEmailDoneEmail('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSignupEmailErr('');
      setSignupPasswordErr('');
      setSignupConfirmErr('');
      setEmailServerErr('');
      setEmailServerNotice('');
    }, 1400);
    return () => clearTimeout(t);
  }, [emailSignupSuccess, emailDoneEmail, onAuthenticated]);

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
        setPhoneError(v.error);
        return;
      }
      setPhoneError('');
      setOtpError('');
      const code = randomSixDigitOtp();
      setWaSending(true);
      try {
        /** Simule l’appel API « envoi OTP sur WhatsApp » — branchez votre backend ici */
        await new Promise((r) => setTimeout(r, 1200));
        setExpectedOtp(code);
        setOtpPhoneE164(v.e164);
        setOtpCode('');
        setOtpSuccess(false);
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
    setOtpError('');
    const entered = otpCode.replace(/\D/g, '');
    if (entered.length !== 6) {
      setOtpError('Saisissez les 6 chiffres du code.');
      return;
    }
    if (entered !== expectedOtp) {
      setOtpError('Code incorrect. Réessayez.');
      return;
    }
    setOtpError('');
    setOtpSuccess(true);
  };

  const handleResendOtp = () => {
    if (resendSec > 0) return;
    void sendWhatsAppOtp();
  };

  const startOAuth = async (provider) => {
    setOauthError('');
    if (!supabase) {
      setOauthError(
        'Configuration Supabase manquante. Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }

    setOauthBusyProvider(provider);
    try {
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) {
        setOauthError(error.message || `Connexion ${provider} impossible.`);
        setOauthBusyProvider(null);
      }
    } catch {
      setOauthError(`Connexion ${provider} impossible.`);
      setOauthBusyProvider(null);
    }
  };

  const handleGoogle = () => {
    void startOAuth('google');
  };

  const handleFacebook = () => {
    void startOAuth('facebook');
  };

  const handleEmailSignup = async () => {
    setSignupEmailErr('');
    setSignupPasswordErr('');
    setSignupConfirmErr('');
    setEmailServerErr('');
    setEmailServerNotice('');

    if (!supabase) {
      setEmailServerErr(
        'Configuration Supabase manquante. Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }

    const ev = validateEmailFormat(email);
    if (!ev.ok) {
      setSignupEmailErr(ev.error);
      return;
    }
    if (!password.trim()) {
      setSignupPasswordErr('Saisissez un mot de passe.');
      return;
    }
    if (password.length < 8) {
      setSignupPasswordErr('Au moins 8 caractères.');
      return;
    }
    if (!confirmPassword.trim()) {
      setSignupConfirmErr('Confirmez le mot de passe.');
      return;
    }
    if (password !== confirmPassword) {
      setSignupConfirmErr('Les mots de passe ne correspondent pas.');
      return;
    }
    setEmailSignupBusy(true);
    try {
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : undefined;
      const { error } = await supabase.auth.signUp({
        email: ev.email,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });
      if (error) {
        setEmailServerErr(error.message || 'Inscription impossible.');
        return;
      }
      setEmailServerNotice(
        `Un lien de vérification a été envoyé à ${ev.email}. Vérifiez votre boîte puis connectez-vous.`,
      );
    } finally {
      setEmailSignupBusy(false);
    }
  };

  const handleEmailLoginVerified = async () => {
    setSignupEmailErr('');
    setSignupPasswordErr('');
    setEmailServerErr('');
    setEmailServerNotice('');

    if (!supabase) {
      setEmailServerErr(
        'Configuration Supabase manquante. Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }

    const ev = validateEmailFormat(email);
    if (!ev.ok) {
      setSignupEmailErr(ev.error);
      return;
    }
    if (!password.trim()) {
      setSignupPasswordErr('Saisissez un mot de passe.');
      return;
    }

    setEmailLoginBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ev.email,
        password,
      });
      if (error) {
        setEmailServerErr(error.message || 'Connexion impossible.');
        return;
      }
      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        setEmailServerErr(
          'E-mail non vérifié. Ouvrez le lien reçu par e-mail avant de vous connecter.',
        );
        return;
      }
      setEmailDoneEmail(ev.email);
      setEmailSignupSuccess(true);
    } finally {
      setEmailLoginBusy(false);
    }
  };

  const handleMainClose = () => {
    if (otpModalOpen) {
      setOtpModalOpen(false);
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
              <GhilaSignupLogo size={56} />
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
                  onPress={() => {
                    setPickerOpen(true);
                    if (phoneError) setPhoneError('');
                  }}
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
                  onChangeText={(t) => {
                    setPhone(t);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder="Numéro de téléphone"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="phone-pad"
                  className="h-12 rounded-full border bg-white px-4 text-[15px] text-neutral-900"
                  style={{
                    borderColor: phoneError ? '#dc2626' : '#e5e5e5',
                    borderWidth: 1,
                  }}
                />
              </View>
            </View>
            {phoneError ? (
              <Text className="mt-1.5 text-xs text-red-600">{phoneError}</Text>
            ) : null}

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
                disabled={oauthBusyProvider !== null}
                className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <GoogleLogo size={22} />
                <Text className="text-[15px] font-semibold text-neutral-800">
                  Google
                </Text>
                {oauthBusyProvider === 'google' ? (
                  <ActivityIndicator color="#4285F4" />
                ) : null}
              </Pressable>
              <Pressable
                onPress={handleFacebook}
                disabled={oauthBusyProvider !== null}
                className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#1877F2]">
                  <Ionicons name="logo-facebook" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-[15px] font-semibold text-neutral-800">
                  Facebook
                </Text>
                {oauthBusyProvider === 'facebook' ? (
                  <ActivityIndicator color="#1877F2" />
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => {
                  setSignupEmailErr('');
                  setSignupPasswordErr('');
                  setSignupConfirmErr('');
                  setEmailServerErr('');
                  setEmailServerNotice('');
                  setEmailSignupSuccess(false);
                  setEmailDoneEmail('');
                  setEmailModalOpen(true);
                }}
                className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <Ionicons name="mail-outline" size={22} color="#404040" />
                <Text className="text-[15px] font-semibold text-neutral-800">
                  E-mail
                </Text>
              </Pressable>
            </View>
            {oauthError ? (
              <Text className="mt-2 text-center text-xs text-red-600">{oauthError}</Text>
            ) : null}

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
            {otpSuccess ? (
              <View className="items-center py-8">
                <Ionicons name="checkmark-circle" size={72} color={GHILA_GREEN} />
                <Text className="mt-4 text-center text-lg font-bold text-neutral-900">
                  Connexion réussie
                </Text>
                <Text className="mt-2 text-center text-sm text-neutral-600">
                  {otpPhoneE164}
                </Text>
              </View>
            ) : (
              <>
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
                  Saisissez le code à 6 chiffres pour{' '}
                  <Text className="font-semibold text-neutral-900">
                    {otpPhoneE164 || fullNumberDisplay}
                  </Text>
                  .
                </Text>
                <View className="mb-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2">
                  <Text className="text-xs text-neutral-500">
                    Mode démo : code affiché ici (pas de SMS réel). Code :{' '}
                    <Text className="font-mono text-base font-bold text-neutral-900">
                      {expectedOtp || '------'}
                    </Text>
                  </Text>
                </View>
                <TextInput
                  value={otpCode}
                  onChangeText={(t) => {
                    setOtpCode(t.replace(/\D/g, '').slice(0, 6));
                    if (otpError) setOtpError('');
                  }}
                  placeholder="000000"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="mb-1 h-14 rounded-xl border px-3 text-center text-2xl font-semibold tracking-widest text-neutral-900"
                  style={{
                    borderColor: otpError ? '#dc2626' : '#e5e5e5',
                    borderWidth: 1,
                  }}
                />
                {otpError ? (
                  <Text className="mb-3 text-xs text-red-600">{otpError}</Text>
                ) : (
                  <View className="mb-3" />
                )}
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
                      color:
                        resendSec > 0 || waSending ? '#a3a3a3' : GHILA_GREEN,
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
              </>
            )}
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
                Compte e-mail sécurisé
              </Text>
              <Pressable
                onPress={() => setEmailModalOpen(false)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
              >
                <Text className="text-2xl text-neutral-700">×</Text>
              </Pressable>
            </View>
            {emailSignupSuccess ? (
              <View className="items-center py-8">
                <Ionicons name="checkmark-circle" size={72} color={GHILA_GREEN} />
                <Text className="mt-4 text-center text-lg font-bold text-neutral-900">
                  Compte créé
                </Text>
                <Text className="mt-2 text-center text-sm text-neutral-600">
                  {emailDoneEmail}
                </Text>
              </View>
            ) : (
              <>
                <Text className="mb-3 text-sm text-neutral-600">
                  Inscription sécurisée : un lien de vérification est envoyé.
                  Tant que l&apos;e-mail n&apos;est pas confirmé, la connexion est refusée.
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (signupEmailErr) setSignupEmailErr('');
                    if (emailServerErr) setEmailServerErr('');
                    if (emailServerNotice) setEmailServerNotice('');
                  }}
                  placeholder="E-mail"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="mb-1 h-12 rounded-xl border px-3 text-[15px] text-neutral-900"
                  style={{
                    borderColor: signupEmailErr ? '#dc2626' : '#e5e5e5',
                    borderWidth: 1,
                  }}
                />
                <View className="mb-2 min-h-[18px]">
                  {signupEmailErr ? (
                    <Text className="text-xs text-red-600">{signupEmailErr}</Text>
                  ) : null}
                </View>
                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (signupPasswordErr) setSignupPasswordErr('');
                    if (emailServerErr) setEmailServerErr('');
                  }}
                  placeholder="Mot de passe"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  className="mb-1 h-12 rounded-xl border px-3 text-[15px] text-neutral-900"
                  style={{
                    borderColor: signupPasswordErr ? '#dc2626' : '#e5e5e5',
                    borderWidth: 1,
                  }}
                />
                <View className="mb-2 min-h-[18px]">
                  {signupPasswordErr ? (
                    <Text className="text-xs text-red-600">{signupPasswordErr}</Text>
                  ) : null}
                </View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (signupConfirmErr) setSignupConfirmErr('');
                    if (emailServerErr) setEmailServerErr('');
                  }}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  className="mb-1 h-12 rounded-xl border px-3 text-[15px] text-neutral-900"
                  style={{
                    borderColor: signupConfirmErr ? '#dc2626' : '#e5e5e5',
                    borderWidth: 1,
                  }}
                />
                <View className="mb-4 min-h-[18px]">
                  {signupConfirmErr ? (
                    <Text className="text-xs text-red-600">{signupConfirmErr}</Text>
                  ) : null}
                </View>
                {emailServerErr ? (
                  <Text className="mb-3 text-xs text-red-600">{emailServerErr}</Text>
                ) : null}
                {emailServerNotice ? (
                  <Text className="mb-3 text-xs text-emerald-700">{emailServerNotice}</Text>
                ) : null}
                <Pressable
                  onPress={() => void handleEmailSignup()}
                  disabled={emailSignupBusy}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-full active:opacity-90"
                  style={{
                    backgroundColor: GHILA_GREEN,
                    opacity: emailSignupBusy ? 0.85 : 1,
                  }}
                >
                  {emailSignupBusy ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : null}
                  <Text className="text-base font-bold text-white">
                    S&apos;inscrire (envoyer vérification)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleEmailLoginVerified()}
                  disabled={emailLoginBusy}
                  className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white active:bg-neutral-50"
                  style={{ opacity: emailLoginBusy ? 0.85 : 1 }}
                >
                  {emailLoginBusy ? (
                    <ActivityIndicator color={GHILA_GREEN} />
                  ) : null}
                  <Text className="text-base font-semibold text-neutral-800">
                    Se connecter (e-mail vérifié)
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
