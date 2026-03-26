const KNOWN_MAPPINGS: Record<string, string> = {
  whatsapp: "whatsapp",
  telegram: "telegram",
  facebook: "facebook",
  "twitter": "x",
  "x": "x",
  instagram: "instagram",
  tiktok: "tiktok",
  snapchat: "snapchat",
  linkedin: "linkedin",
  discord: "discord",
  signal: "signal",
  viber: "viber",
  wechat: "wechat",
  line: "line",
  google: "google",
  microsoft: "microsoft",
  apple: "apple",
  amazon: "amazon",
  netflix: "netflix",
  spotify: "spotify",
  youtube: "youtube",
  reddit: "reddit",
  pinterest: "pinterest",
  tinder: "tinder",
  bumble: "bumble",
  uber: "uber",
  airbnb: "airbnb",
  paypal: "paypal",
  stripe: "stripe",
};

export function normalizeServiceName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return KNOWN_MAPPINGS[slug] ?? slug;
}
