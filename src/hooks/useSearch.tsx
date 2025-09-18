import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSearch(query: string, filters: any) {
    const [page, setPage] = useState(0);
    const [allResults, setAllResults] = useState<any[]>([]);
    const pageSize = 10;

    useEffect(() => {
        setPage(0);
        setAllResults([]);
    }, [query, filters]);

    const { data, isLoading, error } = useQuery({
        queryKey: ["/api/search", query, filters, page],
        queryFn: () => {
            if (!query.trim()) return { results: [] };

            return api.search(query, {
                ...filters,
                limit: pageSize,
                offset: page * pageSize
            });
        },
        enabled: !!query.trim(),
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (data?.results) {
            if (page === 0) {
                setAllResults(data.results);
            } else {
                setAllResults(prev => [...prev, ...data.results]);
            }
        }
    }, [data, page]);

    const loadMore = () => {
        setPage(prev => prev + 1);
    };

    const hasMore = data?.results?.length === pageSize;

    return {
        searchResults: allResults,
        isLoading: isLoading && page === 0,
        isLoadingMore: isLoading && page > 0,
        error,
        hasMore,
        loadMore,
        totalCount: data?.total || 0,
    };
}
