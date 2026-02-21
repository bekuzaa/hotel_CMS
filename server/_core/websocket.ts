/**
 * WebSocket Real-time Sync Service
 * Handles real-time communication between CMS and TV devices
 */

import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

export interface WebSocketMessage {
  type: string;
  payload: any;
  hotelId?: number;
  deviceId?: string;
  timestamp: Date;
}

export interface ConnectedDevice {
  id: string;
  hotelId: number;
  roomNumber?: string;
  socket: WebSocket;
  connectedAt: Date;
  lastHeartbeat: Date;
}

export interface ConnectedClient {
  id: string;
  userId: number;
  hotelId?: number;
  socket: WebSocket;
  connectedAt: Date;
}

// Store connected devices and clients
const connectedDevices = new Map<string, ConnectedDevice>();
const connectedClients = new Map<string, ConnectedClient>();

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const clientType = url.searchParams.get("type") || "device";
    const clientId = url.searchParams.get("id") || generateClientId();
    const hotelId = parseInt(url.searchParams.get("hotelId") || "0");
    const roomNumber = url.searchParams.get("roomNumber") || undefined;

    console.log(`[WebSocket] New ${clientType} connection: ${clientId}`);

    if (clientType === "device") {
      // TV Device connection
      if (hotelId) {
        connectedDevices.set(clientId, {
          id: clientId,
          hotelId,
          roomNumber,
          socket,
          connectedAt: new Date(),
          lastHeartbeat: new Date(),
        });

        // Notify CMS clients about new device
        broadcastToClients({
          type: "device_connected",
          payload: { deviceId: clientId, hotelId, roomNumber },
          hotelId,
          timestamp: new Date(),
        });
      }
    } else if (clientType === "client") {
      // CMS Client connection - will be authenticated via message
      connectedClients.set(clientId, {
        id: clientId,
        userId: 0,
        socket,
        connectedAt: new Date(),
      });
    }

    // Handle incoming messages
    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        handleMessage(clientId, clientType, message);
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    });

    // Handle disconnection
    socket.on("close", () => {
      console.log(`[WebSocket] ${clientType} disconnected: ${clientId}`);

      if (clientType === "device") {
        const device = connectedDevices.get(clientId);
        if (device) {
          broadcastToClients({
            type: "device_disconnected",
            payload: { deviceId: clientId, hotelId: device.hotelId },
            hotelId: device.hotelId,
            timestamp: new Date(),
          });
        }
        connectedDevices.delete(clientId);
      } else {
        connectedClients.delete(clientId);
      }
    });

    // Send welcome message
    sendMessage(socket, {
      type: "connected",
      payload: { clientId },
      timestamp: new Date(),
    });
  });

  // Heartbeat check every 30 seconds
  setInterval(() => {
    const now = new Date();
    connectedDevices.forEach((device, id) => {
      const elapsed = now.getTime() - device.lastHeartbeat.getTime();
      if (elapsed > 60000) {
        // No heartbeat for 60 seconds
        console.log(`[WebSocket] Device ${id} timed out`);
        device.socket.terminate();
        connectedDevices.delete(id);
      }
    });
  }, 30000);

  return wss;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(clientId: string, clientType: string, message: WebSocketMessage) {
  switch (message.type) {
    case "heartbeat":
      // Update device heartbeat
      const device = connectedDevices.get(clientId);
      if (device) {
        device.lastHeartbeat = new Date();
        sendMessage(device.socket, { type: "heartbeat_ack", payload: {}, timestamp: new Date() });
      }
      break;

    case "authenticate":
      // Authenticate CMS client
      const client = connectedClients.get(clientId);
      if (client && message.payload.userId) {
        client.userId = message.payload.userId;
        client.hotelId = message.payload.hotelId;
        sendMessage(client.socket, {
          type: "authenticated",
          payload: { success: true },
          timestamp: new Date(),
        });
      }
      break;

    case "device_status":
      // Device status update
      const statusDevice = connectedDevices.get(clientId);
      if (statusDevice) {
        broadcastToClients({
          type: "device_status_update",
          payload: {
            deviceId: clientId,
            hotelId: statusDevice.hotelId,
            ...message.payload,
          },
          hotelId: statusDevice.hotelId,
          timestamp: new Date(),
        });
      }
      break;

    case "content_update":
      // Content update from CMS - broadcast to devices
      if (message.hotelId) {
        broadcastToDevices(message.hotelId, {
          type: "content_update",
          payload: message.payload,
          hotelId: message.hotelId,
          timestamp: new Date(),
        });
      }
      break;

    case "refresh_content":
      // Force devices to refresh content
      if (message.hotelId) {
        broadcastToDevices(message.hotelId, {
          type: "refresh_content",
          payload: message.payload,
          hotelId: message.hotelId,
          timestamp: new Date(),
        });
      }
      break;

    default:
      console.log(`[WebSocket] Unknown message type: ${message.type}`);
  }
}

/**
 * Send message to a WebSocket
 */
function sendMessage(socket: WebSocket, message: WebSocketMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

/**
 * Broadcast message to all connected CMS clients
 */
export function broadcastToClients(message: WebSocketMessage): void {
  connectedClients.forEach((client) => {
    if (!message.hotelId || client.hotelId === message.hotelId || !client.hotelId) {
      sendMessage(client.socket, message);
    }
  });
}

/**
 * Broadcast message to all devices in a hotel
 */
export function broadcastToDevices(hotelId: number, message: WebSocketMessage): void {
  connectedDevices.forEach((device) => {
    if (device.hotelId === hotelId) {
      sendMessage(device.socket, message);
    }
  });
}

/**
 * Send message to a specific device
 */
export function sendToDevice(deviceId: string, message: WebSocketMessage): boolean {
  const device = connectedDevices.get(deviceId);
  if (device) {
    sendMessage(device.socket, message);
    return true;
  }
  return false;
}

/**
 * Get all connected devices for a hotel
 */
export function getConnectedDevices(hotelId?: number): ConnectedDevice[] {
  const devices = Array.from(connectedDevices.values());
  if (hotelId) {
    return devices.filter((d) => d.hotelId === hotelId);
  }
  return devices;
}

/**
 * Get device by room number
 */
export function getDeviceByRoom(hotelId: number, roomNumber: string): ConnectedDevice | undefined {
  return Array.from(connectedDevices.values()).find(
    (d) => d.hotelId === hotelId && d.roomNumber === roomNumber
  );
}

/**
 * Get connection statistics
 */
export function getConnectionStats(): {
  totalDevices: number;
  totalClients: number;
  devicesByHotel: Record<number, number>;
} {
  const devicesByHotel: Record<number, number> = {};

  connectedDevices.forEach((device) => {
    devicesByHotel[device.hotelId] = (devicesByHotel[device.hotelId] || 0) + 1;
  });

  return {
    totalDevices: connectedDevices.size,
    totalClients: connectedClients.size,
    devicesByHotel,
  };
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Close WebSocket server
 */
export function closeWebSocket(): void {
  if (wss) {
    wss.close();
    wss = null;
    connectedDevices.clear();
    connectedClients.clear();
  }
}
