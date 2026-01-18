import { describe, it, expect, vi } from "vitest";
import provider, { type InitOptions } from "../index.js";

const mockS3 = {
  putObject: vi.fn().mockResolvedValue({}),
  deleteObject: vi.fn().mockResolvedValue(true),
  objectExists: vi.fn().mockResolvedValue(true),
};

// Mock s3mini
vi.mock("s3mini", () => {
  return {
    S3mini: vi.fn().mockImplementation(() => {
      return mockS3;
    }),
  };
});

describe("Strapi Provider Upload DO Space", () => {
  const config: InitOptions = {
    key: "test-key",
    secret: "test-secret",
    endpoint: "https://nyc3.digitaloceanspaces.com",
    region: "nyc3",
    bucket: "test-space",
    cdnEndpoint: "https://nyc3-cdn.digitaloceanspaces.com",
    directory: "directory",
  };

  const createMockFile = () => ({
    hash: "test-hash",
    ext: ".png",
    mime: "image/png",
    buffer: Buffer.from("test-content"),
    url: "",
  } as any);

  it("should initialize correctly", () => {
    const p = provider.init(config);
    expect(p).toHaveProperty("upload");
    expect(p).toHaveProperty("delete");
    expect(p).toHaveProperty("check");
  });

  it("should upload a file and set the URL", async () => {
    const p = provider.init(config);
    const mockFile = createMockFile();
    await p.upload(mockFile);
    expect(mockFile.url).toBe("https://test-space.nyc3.digitaloceanspaces.com/test-hash.png");
  });

  it("should handle directory option", async () => {
    const p = provider.init({ ...config, directory: "uploads" });
    const mockFile = createMockFile();
    await p.upload(mockFile);
    expect(mockFile.url).toBe("https://test-space.nyc3.digitaloceanspaces.com/uploads/test-hash.png");
  });

  it("should use cdnEndpoint if provided", async () => {
    const p = provider.init({ ...config, cdnEndpoint: "https://cdn.example.com" });
    const mockFile = createMockFile();
    await p.upload(mockFile);
    expect(mockFile.url).toBe("https://cdn.example.com/test-hash.png");
  });

  it("should check if object exists", async () => {
    const p = provider.init(config);
    const mockFile = createMockFile();
    const exists = await p.check(mockFile);
    expect(exists).toBe(true);
  });
});
