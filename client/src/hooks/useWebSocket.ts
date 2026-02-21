/**
 * Frontend WebSocket Hook
 * React hook for WebSocket real-time communication
 */

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  payload: any;
  hotelId?: number;
  deviceId?: string;
  timestamp: Date;
}

export interface UseWebSocketOptions {
  url?: string;
  type?: "device" | "client";
  hotelId?: number;
  roomNumber?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export interface WebSocketState {
  connected: boolean;
  clientId: string | null;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url,
    type = "client",
    hotelId,
    roomNumber,
    onMessage,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    clientId: null,
    error: null,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string | null>(null);

  const getWebSocketUrl = useCallback(() => {
    if (url) return url;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const params = new URLSearchParams({
      type,
      ...(hotelId && { hotelId: hotelId.toString() }),
      ...(roomNumber && { roomNumber }),
    });

    return `${protocol}//${host}/ws?${params.toString()}`;
  }, [url, type, hotelId, roomNumber]);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = getWebSocketUrl();
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[WebSocket] Connected");
        setState((prev) => ({ ...prev, connected: true, error: null }));
        onConnect?.();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          if (message.type === "connected") {
            clientIdRef.current = message.payload.clientId;
            setState((prev) => ({ ...prev, clientId: message.payload.clientId }));
          }

          onMessage?.(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      socket.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setState((prev) => ({ ...prev, connected: false }));
        onDisconnect?.();

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setState((prev) => ({ ...prev, error: "Connection error" }));
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
      setState((prev) => ({ ...prev, error: "Failed to connect" }));
    }
  }, [getWebSocketUrl, onConnect, onDisconnect, onMessage, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  const send = useCallback((type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date(),
        ...(hotelId && { hotelId }),
      };
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [hotelId]);

  const authenticate = useCallback((userId: number, hotelId?: number) => {
    return send("authenticate", { userId, hotelId });
  }, [send]);

  const refreshContent = useCallback((targetHotelId?: number) => {
    return send("refresh_content", {}, targetHotelId ? { hotelId: targetHotelId } : {});
  }, [send]);

  const startHeartbeat = useCallback(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        send("heartbeat", {});
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [send]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    send,
    authenticate,
    refreshContent,
    connect,
    disconnect,
    startHeartbeat,
  };
}

/**
 * Hook for device status updates
 */
export function useDeviceStatus(hotelId?: number) {
  const [devices, setDevices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const { connected, send } = useWebSocket({
    hotelId,
    onMessage: (message) => {
      switch (message.type) {
        case "device_connected":
          setDevices((prev) => [...prev, message.payload]);
          break;

        case "device_disconnected":
          setDevices((prev) => prev.filter((d) => d.deviceId !== message.payload.deviceId));
          break;

        case "device_status_update":
          setDevices((prev) =>
            prev.map((d) =>
              d.deviceId === message.payload.deviceId
                ? { ...d, ...message.payload }
                : d
            )
          );
          break;

        case "devices_list":
          setDevices(message.payload.devices);
          setStats(message.payload.stats);
          break;
      }
    },
  });

  return {
    devices,
    stats,
    connected,
  };
}
