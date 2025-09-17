export const WS_EVENTS = {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    ERROR: "error",
    MAX_RECONNECT_ATTEMPTS: "maxReconnectAttemptsReached",

    ANALYSIS_UPDATE: "analysis_update",
    PROJECT_UPDATE: "project_update",
    SEARCH_UPDATE: "search_update",
    KNOWLEDGE_GRAPH_UPDATE: "knowledge_graph_update",
} as const;

export type WebSocketEvent = typeof WS_EVENTS[keyof typeof WS_EVENTS];
