/**
 * BULLETPROOF 10-DIGIT NUMBER NORMALIZER
 * Location: src/utils/phoneUtils.js
 */
export const getPure10Phone = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};

export default getPure10Phone;
