import River from "../models/river.js";

export const getNearbyRivers = async (req, res) => {
  try {
    const { lat, lng, radius } = req.validatedQuery;

    // Convert radius from km to meters 
    const radiusInMeters = radius * 1000;

    // Use $geoNear aggregation for accurate distance calculations
    const rivers = await River.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
          distanceMultiplier: 0.001, // Convert meters to kilometers
        },
      },
      {
        $match: {
          "geometry.type": { $in: ["LineString", "MultiLineString"] },
        },
      },
      {
        $project: {
          _id: 0,
          id: { $concat: ["river_", "$osmId"] },
          name: 1,
          type: 1,
          distance: { $round: ["$distance", 2] },
          coordinates: "$geometry.coordinates",
          properties: 1,
        },
      },
      {
        $sort: { distance: 1 },
      },
      {
        $limit: 1000,
      },
    ]);

    const response = {
      success: true,
      data: rivers.map((river) => ({
        id: river.id,
        name: river.name,
        type: river.type,
        distance: river.distance,
        coordinates: river.coordinates,
        properties: river.properties,
      })),
      total: rivers.length,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("get nearby river error", error);

    if (error.code === 2) {
      // MongoDB geospatial error
      return res.status(400).json({
        success: false,
        error: "invalid_coordinates",
        message: "Invalid coordinates provided for geospatial query",
      });
    }

    res.status(500).json({
      success: false,
      error: "server_error",
      message: "An unexpected error occurred while processing your request",
    });
  }
};
