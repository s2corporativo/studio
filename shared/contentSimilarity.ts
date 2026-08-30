function significantWords(text: string) {
  return new Set(text.toLocaleLowerCase("pt-BR").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]/g, " ").split(/\s+/).filter((word) => word.length >= 4));
}

export function hasSimilarContent(candidate: string, existing: string, minimumSharedWords = 3) {
  const candidateWords = significantWords(candidate);
  const existingWords = significantWords(existing);
  const sharedWords = Array.from(candidateWords).filter((word) => existingWords.has(word));
  return { similar: sharedWords.length >= minimumSharedWords, sharedWords };
}
