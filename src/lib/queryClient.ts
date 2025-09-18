import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

async function throwIfResNotOk(res: AxiosResponse) {
    if (res.status > 400) {
        const text = (await res.data()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}

export async function apiRequest(
    method: string,
    url: string,
    data?: unknown | undefined,
): Promise<AxiosResponse> {
    const res = await axios(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        data: data ? JSON.stringify(data) : undefined,
        withCredentials: true,
    });

    await throwIfResNotOk(res);
    return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
    on401: UnauthorizedBehavior;
}) => QueryFunction<T | null> =
    ({ on401: unauthorizedBehavior }) =>
        async ({ queryKey }) => {
            const res = await axios(queryKey.join("/") as string, {
                withCredentials: true,
            });

            if (unauthorizedBehavior === "returnNull" && res.status === 401) {
                return null;
            }

            await throwIfResNotOk(res);
            return res.data;
        };

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
