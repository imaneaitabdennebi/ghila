import type { ImageSourcePropType } from 'react-native';

export type OnboardingPage = {
  key: string;
  title: string;
  body: string;
  image: ImageSourcePropType;
};

export const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    key: '1',
    title: 'Livraison rapide',
    body: 'Recevez vos plats préférés en quelques minutes où que vous soyez.',
    image: require('../../assets/onboarding/livraison-rapide.png'),
  },
  {
    key: '2',
    title: 'Large choix',
    body: 'Découvrez les meilleurs restaurants près de chez vous.',
    image: require('../../assets/onboarding/large-choix.png'),
  },
  {
    key: '3',
    title: 'Suivi en temps réel',
    body: "Suivez votre commande en direct jusqu'à votre porte.",
    image: require('../../assets/onboarding/suivi-temps-reel.png'),
  },
];
