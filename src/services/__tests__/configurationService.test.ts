import {
  checkStorageHealth,
  clearStorageAndReloadDefaults,
} from "../configurationService";

// Mock localStorage for testing
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: function (key: string) {
    return this.data[key] || null;
  },
  setItem: function (key: string, value: string) {
    this.data[key] = value;
  },
  removeItem: function (key: string) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
  get length() {
    return Object.keys(this.data).length;
  },
  key: function (index: number) {
    return Object.keys(this.data)[index] || null;
  },
};

// Mock window object
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("Storage Management Functions", () => {
  beforeEach(() => {
    // Clear mock localStorage before each test
    mockLocalStorage.clear();
  });

  describe("checkStorageHealth", () => {
    it("should return healthy status when storage is empty", () => {
      const health = checkStorageHealth();

      expect(health.healthy).toBe(true);
      expect(health.currentSize).toBe(0);
      expect(health.usagePercentage).toBe(0);
      expect(health.message).toContain("normal");
    });

    it("should return warning status when storage usage is high", () => {
      // Fill up storage to simulate high usage
      const largeData = "x".repeat(4 * 1024 * 1024); // 4MB
      mockLocalStorage.setItem("test-key", largeData);

      const health = checkStorageHealth();

      expect(health.healthy).toBe(false);
      expect(health.usagePercentage).toBeGreaterThan(90);
      expect(health.message).toContain("high");
    });

    it("should handle server environment", () => {
      // Temporarily remove window object
      const originalWindow = global.window;
      delete (global as any).window;

      const health = checkStorageHealth();

      expect(health.healthy).toBe(false);
      expect(health.message).toContain("server environment");

      // Restore window object
      (global as any).window = originalWindow;
    });
  });

  describe("clearStorageAndReloadDefaults", () => {
    it("should clear storage and return success", () => {
      // Add some test data
      mockLocalStorage.setItem(
        "tse-demo-builder-app-config",
        '{"test": "data"}'
      );
      mockLocalStorage.setItem(
        "tse-demo-builder-home-page-config",
        '{"test": "data"}'
      );

      const result = clearStorageAndReloadDefaults();

      expect(result.success).toBe(true);
      expect(result.message).toContain("cleared successfully");

      // Verify storage was cleared
      expect(
        mockLocalStorage.getItem("tse-demo-builder-app-config")
      ).toBeNull();
      expect(
        mockLocalStorage.getItem("tse-demo-builder-home-page-config")
      ).toBeNull();
    });

    it("should handle errors gracefully", () => {
      // Mock localStorage to throw an error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = () => {
        throw new Error("Storage error");
      };

      const result = clearStorageAndReloadDefaults();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to clear storage");

      // Restore original function
      mockLocalStorage.setItem = originalSetItem;
    });
  });
});
