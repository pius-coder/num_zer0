import { Ok, Err, type Result } from "@/packages/result";
import { getCachedIcon, setCachedIcon } from "./cache";
import { normalizeServiceName } from "./utils";

const ICONIFY_CDN_URL = "https://api.iconify.design/simple-icons";

export function getServiceIconUrl(iconName: string): string {
  const slug = iconName.replace("simple-icons:", "");
  return `${ICONIFY_CDN_URL}/${slug}.svg`;
}

export async function fetchServiceIconSvg(
  iconName: string,
): Promise<Result<string>> {
  const slug = iconName.replace("simple-icons:", "");
  const cacheKey = slug;

  const cached = getCachedIcon(cacheKey);
  if (cached && cached.svg) {
    return Ok(cached.svg);
  }

  try {
    const url = getServiceIconUrl(iconName);
    const response = await fetch(url);

    if (!response.ok) {
      return Err(new Error(`Failed to fetch icon: ${response.status}`));
    }

    const svg = await response.text();

    if (cached) {
      setCachedIcon(cacheKey, {
        ...cached,
        svg,
        timestamp: Date.now(),
      });
    } else {
      setCachedIcon(cacheKey, {
        iconName,
        slug,
        svg,
        url,
        timestamp: Date.now(),
      });
    }

    return Ok(svg);
  } catch (error) {
    return Err(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
