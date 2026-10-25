# PowerShell build script for compiling C++ to WebAssembly with Emscripten

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Compiling Zombie Survival C++ to WASM... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if emcc is available in PATH
$emccCmd = Get-Command emcc -ErrorAction SilentlyContinue
if (-not $emccCmd) {
    Write-Host "[ERROR] 'emcc' (Emscripten Compiler) was not found in your PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "To compile C++ to WebAssembly, install and activate Emscripten:" -ForegroundColor Yellow
    Write-Host "  1. git clone https://github.com/emscripten-core/emsdk.git"
    Write-Host "  2. cd emsdk"
    Write-Host "  3. .\emsdk install latest"
    Write-Host "  4. .\emsdk activate latest"
    Write-Host "  5. .\emsdk_env.ps1"
    Write-Host "  6. Return to this folder and rerun: .\build_wasm.ps1"
    Write-Host ""
    Write-Host "NOTE: The game includes an identical JavaScript OOP engine fallback," -ForegroundColor Green
    Write-Host "so you can run and play the game immediately via: npm run dev" -ForegroundColor Green
    exit 1
}

$outputDir = "public"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$sources = @(
    "cpp/Entity.cpp",
    "cpp/Health.cpp",
    "cpp/Weapon.cpp",
    "cpp/Bullet.cpp",
    "cpp/Supply.cpp",
    "cpp/Zombie.cpp",
    "cpp/Player.cpp",
    "cpp/Game.cpp",
    "cpp/bindings.cpp"
)

$args = @(
    "-O3",
    "-std=c++17",
    "--bind",
    "-s", "WASM=1",
    "-s", "ALLOW_MEMORY_GROWTH=1",
    "-s", "NO_EXIT_RUNTIME=1",
    "-s", "ENVIRONMENT='web'",
    "-s", "EXPORTED_RUNTIME_METHODS=['ccall','cwrap']",
    "-o", "$outputDir/zombie_game.js"
) + $sources

Write-Host "Executing: emcc $($args -join ' ')" -ForegroundColor Gray
& emcc @args

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] WebAssembly compiled to $outputDir/zombie_game.js and $outputDir/zombie_game.wasm" -ForegroundColor Green
    # Also copy to dist if dist exists
    if (Test-Path "dist") {
        Copy-Item "$outputDir/zombie_game.js" -Destination "dist/" -Force
        Copy-Item "$outputDir/zombie_game.wasm" -Destination "dist/" -Force
    }
} else {
    Write-Host "[FAILED] Emscripten compilation failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
