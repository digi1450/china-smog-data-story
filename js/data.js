export const [D, GEO] = await Promise.all([
  d3.json(new URL('../data/processed/analysis.json', import.meta.url)),
  d3.json(new URL('../data/processed/map.geojson', import.meta.url))
]);
