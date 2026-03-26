import { parseAsInteger, parseAsString, parseAsArrayOf, useQueryStates } from "nuqs";
import { useMemo, useEffect, useCallback } from "react";

const SERVICES_FILTERS_STORAGE_KEY = "services-filters";

// Type pour les filtres persistés
interface PersistedFilters {
    categories?: string[] | null;
    locations?: string[] | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    order?: string | null;
    display?: string;
}

// Fonction pour sauvegarder les filtres
function saveFiltersToStorage(filters: PersistedFilters) {
    if (typeof window === "undefined") return;
    try {
        const filtersToSave: PersistedFilters = {
            categories: filters.categories,
            locations: filters.locations,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            order: filters.order,
            display: filters.display,
        };
        // Ne sauvegarder que s'il y a des filtres actifs
        const hasActiveFilters =
            (filters.categories?.length ?? 0) > 0 ||
            (filters.locations?.length ?? 0) > 0 ||
            filters.minPrice != null ||
            filters.maxPrice != null ||
            (filters.order && filters.order !== "relevance");

        if (hasActiveFilters) {
            sessionStorage.setItem(SERVICES_FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
        }
    } catch (error) {
        console.warn("Failed to save filters to sessionStorage:", error);
    }
}

// Fonction pour charger les filtres
function loadFiltersFromStorage(): PersistedFilters | null {
    if (typeof window === "undefined") return null;
    try {
        const saved = sessionStorage.getItem(SERVICES_FILTERS_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.warn("Failed to load filters from sessionStorage:", error);
    }
    return null;
}

// Fonction pour effacer les filtres
function clearFiltersFromStorage() {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.removeItem(SERVICES_FILTERS_STORAGE_KEY);
    } catch (error) {
        console.warn("Failed to clear filters from sessionStorage:", error);
    }
}

export function useGlobalQueryParams() {
    const [searchParams, setSearchParams] = useQueryStates(
        {
            limit: parseAsInteger.withDefault(12),
            next: parseAsInteger.withDefault(1),
            maxPrice: parseAsInteger,
            minPrice: parseAsInteger,
            order: parseAsString.withDefault("relevance"),
            evaluation: parseAsString,
            extl_id: parseAsString,
            categories: parseAsArrayOf(parseAsString),
            locations: parseAsArrayOf(parseAsString),
            display: parseAsString.withDefault("list"),
            active_tab: parseAsString,
            q: parseAsString.withDefault(""),
        },
        {
            history: "push",
            shallow: false,
        },
    );

    // Restaurer les filtres depuis sessionStorage au mount
    useEffect(() => {
        const hasFiltersInUrl =
            (searchParams.categories?.length ?? 0) > 0 ||
            (searchParams.locations?.length ?? 0) > 0 ||
            searchParams.minPrice != null ||
            searchParams.maxPrice != null ||
            (searchParams.order && searchParams.order !== "relevance");

        if (!hasFiltersInUrl) {
            const savedFilters = loadFiltersFromStorage();
            if (savedFilters) {
                const hasActiveFilters =
                    (savedFilters.categories?.length ?? 0) > 0 ||
                    (savedFilters.locations?.length ?? 0) > 0 ||
                    savedFilters.minPrice != null ||
                    savedFilters.maxPrice != null ||
                    (savedFilters.order && savedFilters.order !== "relevance");

                if (hasActiveFilters) {
                    setSearchParams((prev) => ({
                        ...prev,
                        categories: savedFilters.categories,
                        locations: savedFilters.locations,
                        minPrice: savedFilters.minPrice,
                        maxPrice: savedFilters.maxPrice,
                        order: savedFilters.order,
                    }));
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sauvegarder les filtres quand ils changent
    useEffect(() => {
        saveFiltersToStorage({
            categories: searchParams.categories,
            locations: searchParams.locations,
            minPrice: searchParams.minPrice,
            maxPrice: searchParams.maxPrice,
            order: searchParams.order,
            display: searchParams.display,
        });
    }, [
        searchParams.categories,
        searchParams.locations,
        searchParams.minPrice,
        searchParams.maxPrice,
        searchParams.order,
        searchParams.display,
    ]);

    const queryLength = useMemo(() => {
        const { categories, locations, minPrice, maxPrice, order } = searchParams;
        let count = 0;

        if (categories?.length) count++;
        if (locations?.length) count++;
        if (minPrice != null) count++;
        if (maxPrice != null) count++;
        if (order && order !== "relevance") count++;

        return count;
    }, [searchParams]);

    // Fonction pour réinitialiser les filtres (efface aussi le storage)
    const clearFilters = useCallback(() => {
        clearFiltersFromStorage();
        setSearchParams((prev) => ({
            ...prev,
            categories: null,
            locations: null,
            minPrice: null,
            maxPrice: null,
            order: null,
            q: null,
        }));
    }, [setSearchParams]);

    return {
        searchParams,
        setSearchParams,
        queryLength,
        clearFilters,
    };
}
