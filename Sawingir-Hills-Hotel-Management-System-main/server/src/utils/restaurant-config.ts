import fs from 'node:fs/promises';
import path from 'node:path';
import { PaymentMethodType } from '@prisma/client';

export type RestaurantSettingsConfig = {
  taxRate: number;
  serviceChargeRate: number;
  supportedPaymentMethods: PaymentMethodType[];
  supportedLabels: string[];
  qrAssetMode: string;
  specialInstructionsEnabled: boolean;
  roomChargePolicy: string;
  modifierPresets: string[];
  publicMenuPath: string;
  publicMenuTitle: string;
  publicMenuDescription: string;
  assetCollectionNotes: string;
};

export type RestaurantTableConfig = {
  id: number;
  code: string;
  name: string;
  area: string;
  capacity: number;
  isActive: boolean;
  sortOrder: number;
};

export type RestaurantConfig = {
  settings: RestaurantSettingsConfig;
  tables: RestaurantTableConfig[];
};

const defaultRestaurantSettings: RestaurantSettingsConfig = {
  taxRate: 0.1,
  serviceChargeRate: 0.1,
  supportedPaymentMethods: [
    PaymentMethodType.cash,
    PaymentMethodType.card,
    PaymentMethodType.bank_transfer,
    PaymentMethodType.online,
    PaymentMethodType.room_charge,
  ],
  supportedLabels: ['vegetarian', 'spicy'],
  qrAssetMode: 'image_url_only',
  specialInstructionsEnabled: true,
  roomChargePolicy: 'Room charge orders stay unpaid until they are settled on the guest folio.',
  modifierPresets: ['No onion', 'Less spicy', 'Extra spicy', 'No ice', 'Urgent'],
  publicMenuPath: '/qr-menu',
  publicMenuTitle: 'Sawingir Hills Restaurant',
  publicMenuDescription: 'Live menu with current dishes, pricing, and dietary labels.',
  assetCollectionNotes: 'Use public image URLs so dishes stay visible in POS, back office, and QR menu screens.',
};

const defaultRestaurantTables: RestaurantTableConfig[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  code: String(index + 1),
  name: `Table ${index + 1}`,
  area: index < 6 ? 'Main Hall' : 'Garden Deck',
  capacity: index % 3 === 0 ? 6 : 4,
  isActive: true,
  sortOrder: index + 1,
}));

const configPath = path.resolve(process.cwd(), 'data', 'restaurant-config.json');

let configCache: RestaurantConfig | null = null;

function normalizeSettings(settings?: Partial<RestaurantSettingsConfig>): RestaurantSettingsConfig {
  return {
    ...defaultRestaurantSettings,
    ...settings,
    supportedPaymentMethods: Array.isArray(settings?.supportedPaymentMethods) && settings.supportedPaymentMethods.length > 0
      ? settings.supportedPaymentMethods
      : defaultRestaurantSettings.supportedPaymentMethods,
    supportedLabels: Array.isArray(settings?.supportedLabels) && settings.supportedLabels.length > 0
      ? settings.supportedLabels.map((label) => label.trim()).filter(Boolean)
      : defaultRestaurantSettings.supportedLabels,
    modifierPresets: Array.isArray(settings?.modifierPresets)
      ? settings.modifierPresets.map((label) => label.trim()).filter(Boolean)
      : defaultRestaurantSettings.modifierPresets,
    publicMenuPath: settings?.publicMenuPath?.trim() || defaultRestaurantSettings.publicMenuPath,
    publicMenuTitle: settings?.publicMenuTitle?.trim() || defaultRestaurantSettings.publicMenuTitle,
    publicMenuDescription: settings?.publicMenuDescription?.trim() || defaultRestaurantSettings.publicMenuDescription,
    assetCollectionNotes: settings?.assetCollectionNotes?.trim() || defaultRestaurantSettings.assetCollectionNotes,
  };
}

function normalizeTables(tables?: Array<Partial<RestaurantTableConfig>>): RestaurantTableConfig[] {
  const source = Array.isArray(tables) && tables.length > 0 ? tables : defaultRestaurantTables;

  return source
    .map((table, index) => ({
      id: Number(table.id) || index + 1,
      code: String(table.code || table.id || index + 1).trim(),
      name: String(table.name || `Table ${table.code || table.id || index + 1}`).trim(),
      area: String(table.area || 'Restaurant').trim(),
      capacity: Math.max(1, Number(table.capacity) || 2),
      isActive: table.isActive !== false,
      sortOrder: Number(table.sortOrder) || index,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .map((table, index) => ({
      ...table,
      id: index + 1,
      sortOrder: table.sortOrder || index + 1,
    }));
}

function normalizeConfig(config?: Partial<RestaurantConfig>): RestaurantConfig {
  return {
    settings: normalizeSettings(config?.settings),
    tables: normalizeTables(config?.tables),
  };
}

async function persistConfig(config: RestaurantConfig) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

export async function readRestaurantConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<RestaurantConfig>;
    configCache = normalizeConfig(parsed);
  } catch {
    configCache = normalizeConfig();
  }

  await persistConfig(configCache);
  return configCache;
}

export async function writeRestaurantConfig(nextConfig: { settings?: Partial<RestaurantSettingsConfig>; tables?: RestaurantTableConfig[] }) {
  const current = await readRestaurantConfig();
  const merged = normalizeConfig({
    settings: { ...current.settings, ...nextConfig.settings },
    tables: nextConfig.tables ?? current.tables,
  });

  configCache = merged;
  await persistConfig(merged);
  return merged;
}

export function getDefaultRestaurantConfig() {
  return normalizeConfig();
}

