export const visualCompositionFamilies = [
  {
    key: "architectural_context",
    prompt: "Use architectural or environmental context as the main visual language, with depth, restrained geometry and one strong focal point instead of symbolic props.",
  },
  {
    key: "human_workplace",
    prompt: "Use an authentic professional workplace or natural human presence without depicting a client, testimonial or staged success; prioritize credible gestures and real materials.",
  },
  {
    key: "material_editorial",
    prompt: "Build an editorial still-life around texture, paper, glass, metal, wood or fabric with refined negative space; avoid a pile of legal symbols.",
  },
  {
    key: "local_environment",
    prompt: "Anchor the composition in a believable Brazilian local or business environment related to the topic, using place and atmosphere rather than generic legal iconography.",
  },
  {
    key: "information_system",
    prompt: "Use a clean information-oriented composition with restrained abstract data, process, timeline or document-system cues; keep it legible and visually minimal.",
  },
] as const;

export const overusedLegalMotifs = ["shield", "magnifying glass", "clock", "padlock", "scales of justice", "envelope"] as const;

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function compositionDirectiveFor(seed: string) {
  const normalized = seed.normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
  return visualCompositionFamilies[stableHash(normalized) % visualCompositionFamilies.length];
}

export function antiRepetitionDirective() {
  return `ANTI-REPETITION: do not default to recurring legal props (${overusedLegalMotifs.join(", ")}). Use at most one of them only when semantically essential. Vary composition, environment, camera distance, texture and focal subject so the grid does not look like repeated AI templates.`;
}
