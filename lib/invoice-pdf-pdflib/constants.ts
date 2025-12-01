import { rgb } from "pdf-lib";

// Dimensions de la page A4 (595.28 x 841.89 points)
export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 50;

// Couleurs de la charte graphique
export const COLORS = {
  primary: rgb(59 / 255, 130 / 255, 246 / 255), // #3B82F6 - Bleu primaire
  secondary: rgb(16 / 255, 185 / 255, 129 / 255), // #10B981 - Vert secondaire
  neutralDark: rgb(31 / 255, 41 / 255, 55 / 255), // #1F2937 - Gris foncé
  neutralMedium: rgb(107 / 255, 114 / 255, 128 / 255), // #6B7280 - Gris moyen
  neutralLight: rgb(229 / 255, 231 / 255, 235 / 255), // #E5E7EB - Gris clair
  primaryLight: rgb(239 / 255, 246 / 255, 255 / 255), // #EFF6FF - Bleu très clair
  white: rgb(1, 1, 1), // Blanc
  whiteOff: rgb(0.95, 0.95, 0.95), // Blanc cassé
} as const;

// Hauteurs et espacements
export const HEADER_HEIGHT = 100;
export const SECTION_SPACING = 30;
export const LINE_SPACING = 15;

