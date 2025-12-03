import request from "supertest";
import app from "../app.js";
import River from "../models/river.js";

import "../tests/setup.js";

describe("GET /api/rivers/nearby", () => {
  beforeEach(async () => {
    await River.insertMany(testRivers);
    await River.collection.createIndex({ geometry: "2dsphere" });
    await River.collection.createIndex({ name: "text" });
    await River.collection.createIndex({
      "boundingBox.minLat": 1,
      "boundingBox.maxLat": 1,
      "boundingBox.minLng": 1,
      "boundingBox.maxLng": 1,
    });

    // ensure 2dsphere index
  });

  it("should return nearby rivers", async () => {
    const res = await request(app).get(
      "/api/rivers/nearby?lat=27.7172&lng=85.3241&radius=5"
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0); // rivers are returned
    res.body.data.forEach((river) => {
      expect(river.distance).toBeDefined();
      expect(river.distance).toBeLessThanOrEqual(5);
    });
  });

  it("should return missing params error", async () => {
    const res = await request(app).get("/api/rivers/nearby");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
