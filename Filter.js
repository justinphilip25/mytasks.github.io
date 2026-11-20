// Each filter is a valid CSS `filter` value, applied both to the live
// <video> preview and to the canvas when a photo is captured, so what you
// see is exactly what you get.
export const FILTERS = [
  { id: "none", label: "Original", css: "none" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.1)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.75) saturate(1.3) contrast(1.05)" },
  { id: "cool", label: "Cool", css: "saturate(1.2) hue-rotate(190deg) brightness(1.05)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.4) brightness(0.9)" },
  { id: "invert", label: "Invert", css: "invert(1)" },
];

export function getFilterCss(id) {
  return FILTERS.find((f) => f.id === id)?.css ?? "none";
}
