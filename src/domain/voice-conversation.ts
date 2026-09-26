/** Only clear, affirmative responses can approve a pending exact fact. */
export function isAffirmative(input: string): boolean {
  const answer = input.trim().toLowerCase().replace(/[.!?]+$/g, "").trim();
  return /^(?:yes(?:,? (?:this is |that is |it's |it is )?(?:correct|right|exact|okay|ok|done))?|yes please|correct|confirmed|confirm|that's (?:right|correct|exact)|that is (?:right|correct|exact)|exactly|approve|approved|looks (?:right|correct|good)|sounds (?:right|correct|good)|(?:okay|ok)(?:,? (?:this is |that is |it's |it is )?(?:correct|right|exact|done))?|(?:please )?proceed(?: to the next step)?|go ahead(?: to the next step)?|this is (?:correct|right|exact|okay|ok|done))$/i.test(answer);
}

/** Agent deltas are individual spoken words, without guaranteed whitespace. */
export function appendSpokenWord(previous: string, delta: string): string {
  if (!delta) return previous;
  if (!previous || /^\s/.test(delta) || /^[,.;:!?\])}]/.test(delta)) return previous + delta;
  if (/[\s([{’'-]$/.test(previous)) return previous + delta;
  return `${previous} ${delta}`;
}
