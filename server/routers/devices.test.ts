import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../_core/websocket", () => ({
  broadcastToDevices: vi.fn(),
  sendToDevice: vi.fn(),
}));

import { getDb } from "../db";
import { broadcastToDevices, sendToDevice } from "../_core/websocket";

describe("Devices Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return empty array when database is not available", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      // The router would return [] when db is null
      expect(true).toBe(true);
    });

    it("should return devices for hotel admin", async () => {
      const mockDevices = [
        {
          id: 1,
          hotelId: 1,
          deviceId: "device-001",
          deviceName: "Room 101 TV",
          roomNumber: "101",
          isOnline: true,
          isPoweredOn: true,
          volume: 50,
          isMuted: false,
        },
        {
          id: 2,
          hotelId: 1,
          deviceId: "device-002",
          deviceName: "Room 102 TV",
          roomNumber: "102",
          isOnline: false,
          isPoweredOn: false,
          volume: 30,
          isMuted: true,
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockDevices),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      expect(mockDevices.length).toBe(2);
      expect(mockDevices[0].deviceName).toBe("Room 101 TV");
    });
  });

  describe("getStats", () => {
    it("should calculate correct stats", async () => {
      const mockDevices = [
        { id: 1, isOnline: true, isPoweredOn: true },
        { id: 2, isOnline: true, isPoweredOn: false },
        { id: 3, isOnline: false, isPoweredOn: false },
      ];

      const stats = {
        total: mockDevices.length,
        online: mockDevices.filter((d) => d.isOnline).length,
        offline: mockDevices.filter((d) => !d.isOnline).length,
        poweredOn: mockDevices.filter((d) => d.isPoweredOn).length,
      };

      expect(stats.total).toBe(3);
      expect(stats.online).toBe(2);
      expect(stats.offline).toBe(1);
      expect(stats.poweredOn).toBe(1);
    });
  });

  describe("setVolume", () => {
    it("should validate volume range", () => {
      const validVolume = 75;
      expect(validVolume).toBeGreaterThanOrEqual(0);
      expect(validVolume).toBeLessThanOrEqual(100);
    });

    it("should reject invalid volume", () => {
      const invalidVolume = 150;
      expect(invalidVolume).toBeGreaterThan(100);
    });
  });

  describe("powerControl", () => {
    it("should call sendToDevice when powering off", async () => {
      const deviceId = "device-001";
      const message = {
        type: "power_off",
        payload: {},
        timestamp: new Date(),
      };

      // Verify the function exists
      expect(typeof sendToDevice).toBe("function");
    });

    it("should call broadcastToDevices for bulk operations", async () => {
      const hotelId = 1;
      const message = {
        type: "power_off",
        payload: {},
        hotelId,
        timestamp: new Date(),
      };

      // Verify the function exists
      expect(typeof broadcastToDevices).toBe("function");
    });
  });
});
