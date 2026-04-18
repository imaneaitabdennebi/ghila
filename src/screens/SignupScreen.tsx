import GhilaSignup from '../components/GhilaSignup.jsx';

type Props = {
  onBack?: () => void;
};

/**
 * Inscription / connexion — écran Ghila (Tailwind via NativeWind).
 */
export function SignupScreen({ onBack }: Props) {
  return <GhilaSignup onClose={onBack} />;
}
