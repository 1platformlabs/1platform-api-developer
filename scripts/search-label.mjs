/** Callers collect only input.navbar__search-input, never unrelated buttons. */
export function searchLabelFindings(labels) {
  if (labels.length === 0) return ['search input missing'];
  return labels.flatMap((label, index) => label === 'Buscar' ? [] : [`search input ${index + 1} needs the Spanish accessible name`]);
}
