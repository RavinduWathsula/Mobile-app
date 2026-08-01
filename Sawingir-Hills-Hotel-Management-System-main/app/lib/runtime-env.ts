type ClientEnv = Record<string, string | undefined>;

function readImportMetaEnv(): ClientEnv {
  const meta = import.meta as ImportMeta & { env?: ClientEnv };
  return meta.env ?? {};
}

export function getClientEnv(name: string, fallback = ''): string {
  return readImportMetaEnv()[name] ?? fallback;
}
