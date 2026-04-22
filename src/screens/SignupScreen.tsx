import GhilaSignup from '../components/GhilaSignup.jsx';

type Props = {
  onBack?: () => void;
  /** Appelé après connexion / inscription réussie (WhatsApp, OAuth, e-mail). */
  onAuthenticated?: () => void;
};

/**
 * Inscription / connexion — écran Ghila (Tailwind via NativeWind).
 */
export function SignupScreen({ onBack, onAuthenticated }: Props) {
  return (
    <GhilaSignup
      onClose={onBack}
      onAuthenticated={
        onAuthenticated ? () => onAuthenticated() : undefined
      }
    />
  );
}
