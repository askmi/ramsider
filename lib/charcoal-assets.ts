/** Subject-safe background cuts; the lower image blends across 160 identical source rows. */
export const charcoalHeights = [2250, 2250, 1900, 2150] as const;
export const charcoalCuts = [1800, 1650, 1400, 1600] as const;
export const charcoalTiles = charcoalHeights.map((height, index) => [
  {src: `/art/charcoal/v2-${index + 1}-0.webp`, top: 0, height: charcoalCuts[index]},
  {src: `/art/charcoal/v2-${index + 1}-1.webp`, top: charcoalCuts[index]-160, height: height-charcoalCuts[index]+160},
]);
