const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animation length in ms, or 0 when the visitor asked for less motion. @param {number} duration */
export const ms = (duration) => (reduced ? 0 : duration);
