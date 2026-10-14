/** Native strips overlap by two source rows to cover fractional browser edges. */
export const charcoalHeights = [2250, 2250, 1900, 2150] as const;
export const charcoalTiles = charcoalHeights.map((height, index) => Array.from({ length: Math.ceil(height / 750) }, (_, tile) => {
  const top = Math.max(0, tile * 750 - 2);
  return {
    src: `/art/charcoal/${index + 1}-${tile}.png`,
    top,
    height: Math.min(height, (tile + 1) * 750 + 2) - top,
  };
}));
