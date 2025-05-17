#!/bin/bash

# Sass compiler location
SASS_EXEC="./assets/scss/dart-sass/sass"

# Source and destination files
SRC="./assets/scss/index.scss"
DEST="./assets/styles/main.css"

# Check if compiler is found
if [ ! -f "$SASS_EXEC" ]; then
  echo "❌ Error : Sass compiler not found at $SASS_EXEC"
  echo "➡️  Make sure Dart Sass is in the right folder."
  exit 1
fi

# Start watching
echo "✅ Watch Sass started. Compiling from $SRC to $DEST"
$SASS_EXEC "$SRC" "$DEST" --watch
