import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ghila/loyalty_v1';

export type LoyaltyTransaction = {
  id: string;
  at: string;
  type: 'earn' | 'redeem';
  /** Positif (gain) ou négatif (échange). */
  points: number;
  detail: string;
};

export type LoyaltyPersisted = {
  balance: number;
  transactions: LoyaltyTransaction[];
};

export async function loadLoyalty(): Promise<LoyaltyPersisted | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return null;
    const data = JSON.parse(raw) as LoyaltyPersisted;
    if (typeof data.balance !== 'number' || !Array.isArray(data.transactions)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveLoyalty(data: LoyaltyPersisted): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silencieux : l’app reste utilisable sans persistance
  }
}
