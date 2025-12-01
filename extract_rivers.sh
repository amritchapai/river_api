INPUT_PBF="src/data/nepal-latest.osm.pbf"             # existing OSM file
FILTERED_PBF="src/data/nepal_waterway_temp.osm.pbf"   # temporary filtered PBF (will be deleted)
FINAL_GEOJSON="src/data/nepal_rivers_for_api.geojson" # Final output file for your API

# Focus on linear features relevant for proximity search (rivers/streams/canals/drain/ditch)
WATERWAY_TYPES="river,stream,canal,drain,ditch"

#check file
echo "Checking PBF file..."
if [ ! -f "$INPUT_PBF" ]; then
  echo "ERROR: $INPUT_PBF NOT FOUND!"
  exit 1
fi
echo "Found: $INPUT_PBF"


echo "xtracting LINEAR waterway features (ways only) using osmium..."
# This excludes nodes/points (like waterfalls) which are not useful for river distance calculations
osmium tags-filter "$INPUT_PBF" w/waterway=$WATERWAY_TYPES -o "$FILTERED_PBF"

echo "Filtered file info (should contain ONLY ways representing linear waterways):"
osmium fileinfo "$FILTERED_PBF"

echo "Converting filtered LINEAR waterways to final GeoJSON..."
# osmium export will convert the filtered WAYS from the PBF into GeoJSON LineStrings/MultiLineStrings
osmium export -f geojson "$FILTERED_PBF" -o "$FINAL_GEOJSON"

# Filter for named waterways AND ensure they have linear geometry

if command -v jq >/dev/null 2>&1; then
  echo "Post-processing: Filtering only NAMED waterways with LINEAR geometry..."
  
  # Create a temporary file for the filtered output
  TEMP_NAMED_GEOJSON="src/data/temp_named_rivers.geojson"
  
  # Select features that:
  # 1. Have a non-empty 'name' property
  # 2. Have geometry type 'LineString' or 'MultiLineString'
  # 3. Actually have waterway property (safety check)
  jq '
    .features |= map(select(
      (.properties.name != null and .properties.name != "") and
      (.properties.waterway != null) and
      (.geometry.type == "LineString" or .geometry.type == "MultiLineString")
    ))
  ' "$FINAL_GEOJSON" > "$TEMP_NAMED_GEOJSON"

  # Replace the original file with the filtered version
  mv "$TEMP_NAMED_GEOJSON" "$FINAL_GEOJSON"

  echo "Final GeoJSON ($FINAL_GEOJSON) now contains only NAMED LINEAR waterways."
  echo "Number of named linear waterways in final file:"
  jq '.features | length' "$FINAL_GEOJSON"
else
  echo "jq not installed — skipping filtering. Manual verification required."
fi

echo "Checking the first few features in the final GeoJSON file:"
if command -v jq >/dev/null 2>&1; then
  echo "Sample features:"
  jq '.features[0:3]' "$FINAL_GEOJSON"
else
  head -n 50 "$FINAL_GEOJSON"
fi

echo "Checking geometry types in the final file (MUST be LineString or MultiLineString):"
if command -v jq >/dev/null 2>&1; then
  jq '.features[] | .geometry.type' "$FINAL_GEOJSON" | sort | uniq -c
else
  echo "Cannot check geometry types without jq."
fi

echo "Checking waterway types in the final file:"
if command -v jq >/dev/null 2>&1; then
  jq '.features[] | .properties.waterway' "$FINAL_GEOJSON" | sort | uniq -c
else
  echo "Cannot check waterway types without jq."
fi

echo "Cleaning temporary files..."
#removing temporary file
rm -f "$FILTERED_PBF" 

echo ""
echo "DONE! outputt file is ready:"
echo "  - $FINAL_GEOJSON"
