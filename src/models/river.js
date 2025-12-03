import mongoose from "mongoose";
const riverSchema = new mongoose.Schema(
  {
    osmId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["river", "stream", "canal", "drain", "ditch", "waterway"],
    },
    geometry: {
      type: {
        type: String,
        enum: ["LineString", "MultiLineString"],
        required: true,
      },
      coordinates: {
        type: Array,
        required: true,
      },
    },

    properties: {
      length: {
        type: Number,
        default: 0,
      },
      width: String,
      waterway: String,
    },
    boundingBox: {
      minLat: Number,
      maxLat: Number,
      minLng: Number,
      maxLng: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "rivers",
    timestamps: true,
    autoIndex: true,
  }
);

riverSchema.index({ geometry: "2dsphere" });

riverSchema.index({ name: "text" });

riverSchema.index({
  "boundingBox.minLat": 1,
  "boundingBox.maxLat": 1,
  "boundingBox.minLng": 1,
  "boundingBox.maxLng": 1,
});

const River = mongoose.models.River || mongoose.model("River", riverSchema);

export default River;
