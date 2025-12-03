# River Finder API

Find nearest rivers using OpenStreetMap data (Nepal).

## Features

- `GET /api/rivers/nearby?lat=&lng=&radius=` returns nearest rivers within `radius` km.
- MongoDB geospatial indexing.
- Data ingestion script to import waterways GeoJSON into MongoDB.

## Requirements

- MongoDB (local or docker).
- `osmium-tool` (for conversion from .osm.pbf to GeoJSON) — or use Overpass/other approach.
- `jq` tool recommended to installation for validating

## Quick start

- Clone the repository
  git clone 'link'
- Install required repositories with npm install or pnpm install
- for data injection download osm.pbf data form https://drive.google.com/drive/folders/14Z4lFJTqIZsTvGcAiNUxPymK1PUoyJma or from here https://download.geofabrik.de/asia/nepal.html but remeber the file name should be nepal-latest.osm.pbf
- place this file inside `src/data`
- update .env file taking .env.example as reference
- for first time and one time setup at very beginning do npm import-data
- then start server with npm run dev


  ## Project Structure
├── .env  
├── extract_rivers.sh  
├── package.json  
├── package-lock.json  
├── pnpm-lock.yaml  
├── README.md  
├── vitest.config.js  
├── src  
│ ├── app.js  
│ ├── index.js  
│ ├── config  
│ │ └── database.js  
│ ├── controllers  
│ │ └── rivers.controllers.js  
│ ├── data  
│ │ ├── nepal-latest.osm.pbf  
│ │ └── nepal_rivers_for_api.geojson  
│ ├── middleware  
│ │ └── validation.js  
│ ├── models  
│ │ └── river.js  
│ ├── routes  
│ │ └── rivers.routes.js  
│ ├── script  
│ │ └── importData.js  
│ ├── tests  
│ │ ├── distance.test.js  
│ │ ├── nearby-rivers.test.js  
│ │ ├── setup.js  
│ │ └── testData.js  
│ └── utils  
│ └── distance.js
