import { haversineDistance } from "../utils/distance.js";

describe("Distance Calculation", () => {
  it("should calculate accurate distance", () => {
    const d = haversineDistance([85.3241, 27.7172], [85.325, 27.718]);
    //d comes in merters so converting to km
    expect(d / 1000).toBeCloseTo(0.12, 1);
  });
});
