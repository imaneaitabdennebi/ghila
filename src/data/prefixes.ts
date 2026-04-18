export type CountryPrefix = {
  id: string;
  /** Emoji drapeau */
  flag: string;
  dial: string;
  name: string;
};

/** Ordre : Maroc en premier pour Ghila */
export const COUNTRY_PREFIXES: CountryPrefix[] = [
  { id: 'MA', flag: '🇲🇦', dial: '+212', name: 'Maroc' },
  { id: 'FR', flag: '🇫🇷', dial: '+33', name: 'France' },
  { id: 'ES', flag: '🇪🇸', dial: '+34', name: 'Espagne' },
  { id: 'BE', flag: '🇧🇪', dial: '+32', name: 'Belgique' },
  { id: 'IT', flag: '🇮🇹', dial: '+39', name: 'Italie' },
  { id: 'DE', flag: '🇩🇪', dial: '+49', name: 'Allemagne' },
];
