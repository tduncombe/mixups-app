export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
