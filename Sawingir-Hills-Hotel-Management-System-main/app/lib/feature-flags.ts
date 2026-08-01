import { getClientEnv } from './runtime-env';

const prototypeModulesFlag = getClientEnv('VITE_ENABLE_PROTOTYPE_MODULES');
const isDev = import.meta.env.DEV;

export const prototypeModulesEnabled = isDev
  ? prototypeModulesFlag !== 'false'
  : prototypeModulesFlag === 'true';
