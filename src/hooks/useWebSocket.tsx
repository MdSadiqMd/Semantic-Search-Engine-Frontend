import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getWebSocketClient, WebSocketClient } from "@/lib/webocket";
import { WS_EVENTS } from "@/constants/webSocketEvents";

export function useWebSocket() {
    const queryClient = useQueryClient();
    const wsClient = useRef<WebSocketClient | null>(null);

    useEffect(() => {
        wsClient.current = getWebSocketClient();
        const client = wsClient.current;

        const handleConnected = () => {
            console.log("WebSocket connected");
        };

        const handleDisconnected = () => {
            console.log("WebSocket disconnected");
        };

        const handleError = (message: any) => {
            console.error("WebSocket error:", message.error);
        };

        const handleMaxReconnectAttempts = () => {
            toast.warning("Connection Lost", {
                description: "Unable to connect to the server. Please refresh the page.",
            });
        };

        const handleAnalysisUpdate = (message: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });

            if (message.status === "completed") {
                toast.success("Analysis Complete", {
                    description: "Project analysis has finished successfully.",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
                queryClient.invalidateQueries({ queryKey: ["/api/search"] });
            } else if (message.status === "failed") {
                toast.error("Analysis Failed", {
                    description: message.error || "Project analysis failed.",
                });
            }
        };

        const handleProjectUpdate = (message: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
            toast.info("Project Updated", {
                description: `Project ${message.projectName} has been updated.`,
            });
        };

        const handleSearchUpdate = (message: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/search"] });
        };

        const handleKnowledgeGraphUpdate = (message: any) => {
            queryClient.invalidateQueries({
                queryKey: ["/api/projects", message.projectId, "graph"],
            });
        };

        client.on(WS_EVENTS.CONNECTED, handleConnected);
        client.on(WS_EVENTS.DISCONNECTED, handleDisconnected);
        client.on(WS_EVENTS.ERROR, handleError);
        client.on(WS_EVENTS.MAX_RECONNECT_ATTEMPTS, handleMaxReconnectAttempts);
        client.on(WS_EVENTS.ANALYSIS_UPDATE, handleAnalysisUpdate);
        client.on(WS_EVENTS.PROJECT_UPDATE, handleProjectUpdate);
        client.on(WS_EVENTS.SEARCH_UPDATE, handleSearchUpdate);
        client.on(WS_EVENTS.KNOWLEDGE_GRAPH_UPDATE, handleKnowledgeGraphUpdate);

        const pingInterval = setInterval(() => {
            if (client.isConnected()) {
                client.ping();
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            client.off(WS_EVENTS.CONNECTED, handleConnected);
            client.off(WS_EVENTS.DISCONNECTED, handleDisconnected);
            client.off(WS_EVENTS.ERROR, handleError);
            client.off(WS_EVENTS.MAX_RECONNECT_ATTEMPTS, handleMaxReconnectAttempts);
            client.off(WS_EVENTS.ANALYSIS_UPDATE, handleAnalysisUpdate);
            client.off(WS_EVENTS.PROJECT_UPDATE, handleProjectUpdate);
            client.off(WS_EVENTS.SEARCH_UPDATE, handleSearchUpdate);
            client.off(WS_EVENTS.KNOWLEDGE_GRAPH_UPDATE, handleKnowledgeGraphUpdate);
        };
    }, [queryClient, toast]);

    return {
        subscribeToProject: (projectId: string) => {
            wsClient.current?.subscribeToProject(projectId);
        },
        isConnected: () => wsClient.current?.isConnected() ?? false,
        send: (message: any) => wsClient.current?.send(message),
    };
}
