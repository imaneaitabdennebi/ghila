/** Villes livrées (Agadir en premier). */
export const DEFAULT_CITY = 'Agadir';

export const CITIES = [
  'Agadir',
] as const;

export type CategoryId = 'food' | 'courses' | 'pharma' | 'cadeaux';

export const CATEGORIES_META: { id: CategoryId; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'courses', label: 'Courses' },
  { id: 'pharma', label: 'Pharma' },
  { id: 'cadeaux', label: 'Cadeaux' },
];

export type Product = {
  id: string;
  title: string;
  priceLabel: string;
  priceMad: number;
  /** Image réelle (Unsplash, HTTPS). */
  image: string;
  category: CategoryId;
};

/** Photos libres de droits (Unsplash) — URLs stables. */
export const PRODUCTS: Product[] = [
  // —— Food ——
  {
    id: 'f1',
    title: 'Tacos XL',
    priceLabel: '25 DH',
    priceMad: 25,
    image:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f2',
    title: 'Jus frais',
    priceLabel: '15 DH',
    priceMad: 15,
    image:
      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f3',
    title: 'Burger maison',
    priceLabel: '45 DH',
    priceMad: 45,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f4',
    title: 'Pizza margherita',
    priceLabel: '55 DH',
    priceMad: 55,
    image:
      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f5',
    title: 'Sushi mix',
    priceLabel: '95 DH',
    priceMad: 95,
    image:
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f6',
    title: 'Salade César',
    priceLabel: '38 DH',
    priceMad: 38,
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f7',
    title: 'Sandwich club',
    priceLabel: '32 DH',
    priceMad: 32,
    image:
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  {
    id: 'f8',
    title: 'Café & pâtisserie',
    priceLabel: '28 DH',
    priceMad: 28,
    image:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'food',
  },
  // —— Courses ——
  {
    id: 'c1',
    title: 'Panier fruits & légumes',
    priceLabel: '35 DH',
    priceMad: 35,
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  {
    id: 'c2',
    title: 'Pain & viennoiseries',
    priceLabel: '12 DH',
    priceMad: 12,
    image:
      'https://images.unsplash.com/photo-1509440159756-075cda3da974?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  {
    id: 'c3',
    title: 'Produits laitiers',
    priceLabel: '42 DH',
    priceMad: 42,
    image:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  {
    id: 'c4',
    title: 'Épicerie salée',
    priceLabel: '48 DH',
    priceMad: 48,
    image:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  {
    id: 'c5',
    title: 'Eaux & boissons',
    priceLabel: '22 DH',
    priceMad: 22,
    image:
      'https://images.unsplash.com/photo-1548839140-29a475e62d29?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  {
    id: 'c6',
    title: 'Fromages & charcuterie',
    priceLabel: '65 DH',
    priceMad: 65,
    image:
      'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32f?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  {
    id: 'c7',
    title: 'Œufs & produits frais',
    priceLabel: '28 DH',
    priceMad: 28,
    image:
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'courses',
  },
  // —— Pharma (1 image Unsplash distincte par produit) ——
  {
    id: 'ph1',
    title: 'Kit premiers soins',
    priceLabel: '89 DH',
    priceMad: 89,
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'pharma',
  },
  {
    id: 'ph2',
    title: 'Compléments vitamines',
    priceLabel: '55 DH',
    priceMad: 55,
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'pharma',
  },
  {
    id: 'ph3',
    title: 'Gel hydroalcoolique',
    priceLabel: '35 DH',
    priceMad: 35,
    image:
      'https://images.unsplash.com/photo-1608571423902-eed4a5a81015?w=900&h=900&fm=jpg&fit=crop&q=85',
    category: 'pharma',
  },
  {
    id: 'ph4',
    title: 'Sirop & toux',
    priceLabel: '42 DH',
    priceMad: 42,
    image:
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=900&h=900&fm=jpg&fit=crop&q=85',
    category: 'pharma',
  },
  {
    id: 'ph5',
    title: 'Pansements & compresses',
    priceLabel: '28 DH',
    priceMad: 28,
    image:
      'https://images.unsplash.com/photo-1603397603519-d0bcd757af36?w=900&h=900&fm=jpg&fit=crop&q=85',
    category: 'pharma',
  },
  // —— Cadeaux (1 image distincte par article) ——
  {
    id: 'g1',
    title: 'Coffret cadeau',
    priceLabel: '120 DH',
    priceMad: 120,
    image:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'cadeaux',
  },
  {
    id: 'g2',
    title: 'Bouquet de fleurs',
    priceLabel: '180 DH',
    priceMad: 180,
    image:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'cadeaux',
  },
  {
    id: 'g3',
    title: 'Chocolats assortis',
    priceLabel: '95 DH',
    priceMad: 95,
    image:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'cadeaux',
  },
  {
    id: 'g4',
    title: 'Parfum coffret',
    priceLabel: '350 DH',
    priceMad: 350,
    image:
      'https://images.unsplash.com/photo-1595425959637-27324a4f24eb?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'cadeaux',
  },
  {
    id: 'g5',
    title: 'Bouteille premium',
    priceLabel: '220 DH',
    priceMad: 220,
    image:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'cadeaux',
  },
  {
    id: 'g6',
    title: 'Peluche & coffret naissance',
    priceLabel: '145 DH',
    priceMad: 145,
    image:
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=900&h=900&auto=format&fit=crop&q=85',
    category: 'cadeaux',
  },
];

/** Miniatures pour les ronds catégories (images dédiées, pas de doublon obligatoire avec un produit). */
export const CATEGORY_IMAGES: Record<CategoryId, string> = {
  food:
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&auto=format&fit=crop&q=85',
  courses:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&auto=format&fit=crop&q=85',
  pharma:
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&auto=format&fit=crop&q=85',
  cadeaux:
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&auto=format&fit=crop&q=85',
};

export type CartLine = { product: Product; qty: number };

export type OrderMock = {
  id: string;
  dateLabel: string;
  status: string;
  totalLabel: string;
};

export const INITIAL_ORDERS: OrderMock[] = [
  {
    id: 'CMD-1042',
    dateLabel: '12 avr. 2026',
    status: 'Livré',
    totalLabel: '68 DH',
  },
  {
    id: 'CMD-1038',
    dateLabel: '8 avr. 2026',
    status: 'En cours',
    totalLabel: '42 DH',
  },
];

export type NotifItem = { id: string; title: string; body: string; read: boolean };

export const INITIAL_NOTIFICATIONS: NotifItem[] = [
  {
    id: 'n1',
    title: 'Bienvenue sur Ghila',
    body: `Livraison disponible à ${DEFAULT_CITY} et dans toute la région.`,
    read: false,
  },
  {
    id: 'n2',
    title: '-20 % cette semaine',
    body: 'Profitez de la promo sur une sélection de restaurants.',
    read: false,
  },
];
