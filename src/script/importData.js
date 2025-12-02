import mongoose from "mongoose";
import fs from "fs";
import dotenv from "dotenv";
import River from "../models/river.js";

import { fileURLToPath } from "url";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const GEOJSON_FILE =
  process.env.GEOJSON_FILE || "src/data/nepal_rivers_for_api.geojson";
//batch size to put in database
const BATCH_SIZE = 500;

function calculateBoundingBox(coordinates) {
  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;

  // Handle both LineString and MultiLineString
  const processCoords = (coords) => {
    //two conditions for line stirng and multi line string but we only have line string data
    if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") {
      coords.forEach((coord) => {
        const [lng, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    } else if (Array.isArray(coords[0][0])) {
      coords.forEach((line) => {
        line.forEach((coord) => {
          const [lng, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });
    }
  };

  processCoords(coordinates);

  return { minLat, maxLat, minLng, maxLng };
}

function calculateLength(coordinates) {
  let totalLength = 0;

  //haversine distance instead of distance formula
  const haversineDistance = (coord1, coord2) => {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //returning with meter
    return R * c * 1000;
  };

  // Handle LineString
  if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === "number") {
    for (let i = 1; i < coordinates.length; i++) {
      totalLength += haversineDistance(coordinates[i - 1], coordinates[i]);
    }
  }
  // Handle MultiLineString to be on safe side not required here
  else if (Array.isArray(coordinates[0][0])) {
    coordinates.forEach((line) => {
      for (let i = 1; i < line.length; i++) {
        totalLength += haversineDistance(line[i - 1], line[i]);
      }
    });
  }

  return Math.round(totalLength);
}

function validateFeature(feature) {
  // check if geometry is present
  if (!feature.geometry || !feature.geometry.coordinates) {
    return false;
  }

  // Must be LineString or MultiLineString
  if (!["LineString", "MultiLineString"].includes(feature.geometry.type)) {
    return false;
  }

  // Must have a name
  if (!feature.properties || !feature.properties.name) {
    return false;
  }

  // Must have waterway type
  if (!feature.properties.waterway) {
    return false;
  }

  // Validate coordinates
  const coords = feature.geometry.coordinates;
  if (feature.geometry.type === "LineString") {
    if (!Array.isArray(coords) || coords.length < 2) return false;
    if (!coords.every((coord) => Array.isArray(coord) && coord.length === 2))
      return false;
  } else if (feature.geometry.type === "MultiLineString") {
    if (!Array.isArray(coords) || coords.length === 0) return false;
    if (!coords.every((line) => Array.isArray(line) && line.length >= 2))
      return false;
  }

  return true;
}

async function importData() {
  let connection;
  try {
    //mongodb connection
    connection = await mongoose.connect(process.env.MONGODB_URI);

    // deleting existing data completely
    const deleteResult = await River.deleteMany({});

    // check for existence of file
    if (!fs.existsSync(GEOJSON_FILE)) {
      throw new Error(`GeoJSON file not found: ${GEOJSON_FILE}`);
    }

    //read file
    const fileContent = fs.readFileSync(GEOJSON_FILE, "utf8");
    const geoData = JSON.parse(fileContent);

    if (!geoData.features || !Array.isArray(geoData.features)) {
      throw new Error("Invalid GeoJSON format: No features array found");
    }

    // validation check for waterways and not validated is added as skipped
    const validWaterways = [];
    let skippedCount = 0;
    for (let i = 0; i < geoData.features.length; i++) {
      const feature = geoData.features[i];

      // Validate data
      if (!validateFeature(feature)) {
        skippedCount++;
        continue;
      }

      // set osm id if provided in feature (which is not ) but check or set your own
      const osmId = feature.id ? feature.id : `way_${i}`;

      // bounding box call
      const boundingBox = calculateBoundingBox(feature.geometry.coordinates);

      // length call
      const length = calculateLength(feature.geometry.coordinates);

      // Create waterways object
      const waterwayObj = {
        osmId: osmId,
        name: feature.properties.name.trim(),
        type: feature.properties.waterway,
        geometry: {
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates,
        },
        properties: {
          length: length,
          width: feature.properties.width || null,
          waterway: feature.properties.waterway,
        },
        boundingBox: boundingBox,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validWaterways.push(waterwayObj);

      // //just to debug
      // if (i % 1000 === 0 && i > 0) {
      //   console.log(`Processed  features...`, i);
      // }
    }

    // inseting in database with different batches
    for (let i = 0; i < validWaterways.length; i += BATCH_SIZE) {
      const batch = validWaterways.slice(i, i + BATCH_SIZE);
      await River.insertMany(batch, { ordered: false });

      // delay in database to ease it
      if (i + BATCH_SIZE < validWaterways.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // creating indexes here instead of in configuration so that index are set up during data import
    const db = mongoose.connection.db;
    await db.collection("rivers").createIndex({ geometry: "2dsphere" });
    await db.collection("rivers").createIndex({ osmId: 1 });
    await db.collection("rivers").createIndex({ name: "text" });
    await db.collection("rivers").createIndex({
      "boundingBox.minLat": 1,
      "boundingBox.maxLat": 1,
      "boundingBox.minLng": 1,
      "boundingBox.maxLng": 1,
    });
  } catch (error) {
    console.error("error encountered while importing data", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log("Disconnected from database");
    }
  }
}

// Run the main function
if (process.argv[1] === __filename) {
  importData();
}

export default importData;
