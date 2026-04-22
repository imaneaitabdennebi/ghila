/** Règles du programme fidélité Ghila (cohérent avec le checkout). */

/** Points nécessaires pour débloquer une réduction. */
export const LOYALTY_REDEEM_POINTS = 200;

/** Valeur de la réduction en DH. */
export const LOYALTY_REDEEM_DH = 20;

/** 1 DH dépensé → 0,5 pt arrondi : 1 pt tous les 2 DH (plafond par commande). */
export const LOYALTY_MAX_POINTS_PER_ORDER = 150;

export function pointsEarnedFromOrder(totalMad: number): number {
  const raw = Math.floor(totalMad / 2);
  return Math.min(Math.max(0, raw), LOYALTY_MAX_POINTS_PER_ORDER);
}

/** Points à gagner avant le prochain palier (0 = palier atteint, réduction utilisable si solde ≥ 200). */
export function pointsUntilNextReward(balance: number): number {
  if (balance === 0) return LOYALTY_REDEEM_POINTS;
  const mod = balance % LOYALTY_REDEEM_POINTS;
  if (mod === 0) return 0;
  return LOYALTY_REDEEM_POINTS - mod;
}

/** Pourcentage de remplissage de la jauge jusqu’au prochain palier (0–100). */
export function loyaltyProgressPercent(balance: number): number {
  if (balance === 0) return 0;
  const mod = balance % LOYALTY_REDEEM_POINTS;
  if (mod === 0) return 100;
  return (mod / LOYALTY_REDEEM_POINTS) * 100;
}

export function formatLoyaltyDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
