import * as crypto from 'crypto';
// Function to generate SHA-256 hash
export const generateSHA256Hash = (text: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
};
