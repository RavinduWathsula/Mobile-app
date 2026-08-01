import dotenv from 'dotenv';

dotenv.config();

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set before starting the API server`);
  }
  return value;
}
