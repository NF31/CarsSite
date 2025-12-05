"use client";

/**
 * Composant Motion optimisé qui utilise LazyMotion pour réduire la taille du bundle
 * Utilise uniquement domAnimation (plus léger que les animations complètes)
 * 
 * Ce wrapper réexporte m de framer-motion qui est déjà optimisé via MotionProvider
 * avec LazyMotion et domAnimation pour réduire la taille du bundle JavaScript.
 */
export { m as motion } from "framer-motion";

