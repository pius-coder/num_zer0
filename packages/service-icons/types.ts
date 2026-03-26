export type ServiceIconResult = {
  iconName: string;
  slug: string;
  url: string;
  svg: string | null;
};

export type ServiceIconCacheEntry = {
  iconName: string;
  slug: string;
  svg: string;
  url: string;
  timestamp: number;
};

export type IconifySearchResponse = {
  icons: string[];
  total: number;
  limit: number;
  start: number;
  prefix: string;
};
