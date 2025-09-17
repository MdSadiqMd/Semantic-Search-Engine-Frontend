interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: Map<string, MessageHandler[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private url: string;

    constructor() {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        this.url = `${protocol}//${window.location.host}/ws`;
        this.connect();
    }

    private connect() {
        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.emit('connected', {});
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.emit('disconnected', {});
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', { error });
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached', {});
        }
    }

    private handleMessage(message: WebSocketMessage) {
        const handlers = this.handlers.get(message.type) || [];
        handlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in WebSocket message handler:', error);
            }
        });

        // emit messages to generic message handlers
        const allHandlers = this.handlers.get('*') || [];
        allHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in generic WebSocket message handler:', error);
            }
        });
    }

    public on(type: string, handler: MessageHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(handler);

        return () => this.off(type, handler);
    }

    public off(type: string, handler: MessageHandler) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    public send(message: WebSocketMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
            }
        } else {
            console.warn('WebSocket is not connected');
        }
    }

    public subscribeToProject(projectId: string) {
        this.send({
            type: 'subscribe_project',
            projectId
        });
    }

    public ping() {
        this.send({ type: 'ping' });
    }

    private emit(type: string, data: any) {
        this.handleMessage({ type, ...data });
    }

    public close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    public getReadyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
    if (!wsClient) {
        wsClient = new WebSocketClient();
    }
    return wsClient;
}

export function closeWebSocketClient() {
    if (wsClient) {
        wsClient.close();
        wsClient = null;
    }
}
