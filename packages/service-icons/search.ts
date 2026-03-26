import { Ok, Err, type Result } from "@/packages/result";
import type { ServiceIconResult, IconifySearchResponse } from "./types";
import { getCachedIcon, setCachedIcon } from "./cache";
import { normalizeServiceName } from "./utils";

const ICONIFY_SEARCH_URL = "https://api.iconify.design/search";

export async function searchServiceIcon(
  serviceName: string,
): Promise<Result<ServiceIconResult | null>> {
  const slug = normalizeServiceName(serviceName);
  const cacheKey = slug;

  const cached = getCachedIcon(cacheKey);
  if (cached) {
    return Ok({
      iconName: cached.iconName,
      slug: cached.slug,
      url: cached.url,
      svg: cached.svg,
    });
  }

  try {
    const searchUrl = new URL(ICONIFY_SEARCH_URL);
    searchUrl.searchParams.set("query", slug);
    searchUrl.searchParams.set("prefixes", "simple-icons");
    searchUrl.searchParams.set("limit", "5");

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      return Ok(null);
    }

    const data: IconifySearchResponse = await response.json();

    if (data.icons.length === 0) {
      return Ok(null);
    }

    const iconName = data.icons[0];
    const iconSlug = iconName.replace("simple-icons:", "");
    const url = `https://api.iconify.design/simple-icons/${iconSlug}.svg`;

    setCachedIcon(cacheKey, {
      iconName,
      slug: iconSlug,
      svg: "",
      url,
      timestamp: Date.now(),
    });

    return Ok({
      iconName,
      slug: iconSlug,
      url,
      svg: null,
    });
  } catch (error) {
    return Err(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
