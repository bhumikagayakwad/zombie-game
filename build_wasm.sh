#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Compiling Zombie Survival C++ to WASM... "
echo "=========================================="

if ! command -v emcc &> /dev/null; then
    echo "[ERROR] 'emcc' (Emscripten Compiler) was not found in your PATH."
    echo ""
    echo "To compile C++ to WebAssembly, install and activate Emscripten:"
    echo "  1. git clone https://github.com/emscripten-core/emsdk.git"
    echo "  2. cd emsdk"
    echo "  3. ./emsdk install latest"
    echo "  4. ./emsdk activate latest"
    echo "  5. source ./emsdk_env.sh"
    echo "  6. Return to this folder and rerun: ./build_wasm.sh"
    echo ""
    echo "NOTE: The game includes an identical JavaScript OOP engine fallback,"
    echo "so you can run and test the website immediately using: npm run dev"
    exit 1
fi

mkdir -p public dist

emcc \
  -O3 \
  -std=c++17 \
  --bind \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s ENVIRONMENT='web' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  cpp/Entity.cpp \
  cpp/Health.cpp \
  cpp/Weapon.cpp \
  cpp/Bullet.cpp \
  cpp/Supply.cpp \
  cpp/Zombie.cpp \
  cpp/Player.cpp \
  cpp/Game.cpp \
  cpp/bindings.cpp \
  -o public/zombie_game.js

echo "[SUCCESS] WebAssembly compiled to public/zombie_game.js and public/zombie_game.wasm"
cp public/zombie_game.js dist/ 2>/dev/null || true
cp public/zombie_game.wasm dist/ 2>/dev/null || true
