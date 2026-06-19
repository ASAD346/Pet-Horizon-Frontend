/** First pet is free; additional pets require Premium. */
export function canAddAnotherPet(petCount: number, isPremium: boolean): boolean {
  return petCount === 0 || isPremium;
}
