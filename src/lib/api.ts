import { apiRequest } from "./queryClient";

export const api = {
    getProjects: async () => {
        const res = await apiRequest("GET", "/api/projects");
        return res.data;
    },

    getProject: async (id: string) => {
        const res = await apiRequest("GET", `/api/projects/${id}`);
        return res.data;
    },

    createProject: async (data: any) => {
        const res = await apiRequest("POST", "/api/projects", data);
        return res.data;
    },

    analyzeProject: async (projectId: string) => {
        const res = await apiRequest("POST", `/api/projects/${projectId}/analyze`);
        return res.data;
    },

    getProjectStats: async (projectId: string) => {
        const res = await apiRequest("GET", `/api/projects/${projectId}/stats`);
        return res.data;
    },

    search: async (query: string, filters: any = {}) => {
        const res = await apiRequest("POST", "/api/search", {
            query,
            ...filters
        });
        return res.data;
    },

    getCodeElements: async (projectId: string, filters: any = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value));
        });

        const url = `/api/projects/${projectId}/elements${params.toString() ? `?${params}` : ''}`;
        const res = await apiRequest("GET", url);
        return res.data;
    },

    getKnowledgeGraph: async (projectId: string, options: any = {}) => {
        const params = new URLSearchParams();
        if (options.elementTypes) params.append('elementTypes', options.elementTypes.join(','));
        if (options.relationTypes) params.append('relationTypes', options.relationTypes.join(','));
        if (options.depth) params.append('depth', String(options.depth));

        const url = `/api/projects/${projectId}/graph${params.toString() ? `?${params}` : ''}`;
        const res = await apiRequest("GET", url);
        return res.data;
    },

    getElementConnections: async (elementId: string, depth: number = 2) => {
        const res = await apiRequest("GET", `/api/elements/${elementId}/connections?depth=${depth}`);
        return res.data;
    },

    getAnalysisJob: async (jobId: string) => {
        const res = await apiRequest("GET", `/api/jobs/${jobId}`);
        return res.data;
    },

    getHealth: async () => {
        const res = await apiRequest("GET", "/api/health");
        return res.data;
    },
};
