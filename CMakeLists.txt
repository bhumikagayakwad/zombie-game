cmake_minimum_required(VERSION 3.14)
project(ZombieSurvival CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(SOURCES
    cpp/Entity.cpp
    cpp/Health.cpp
    cpp/Weapon.cpp
    cpp/Bullet.cpp
    cpp/Supply.cpp
    cpp/Zombie.cpp
    cpp/Player.cpp
    cpp/Game.cpp
    cpp/bindings.cpp
)

if(EMSCRIPTEN)
    add_executable(zombie_game ${SOURCES})
    set_target_properties(zombie_game PROPERTIES
        OUTPUT_NAME "zombie_game"
        SUFFIX ".js"
        LINK_FLAGS "-O3 --bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_RUNTIME_METHODS='[\"ccall\",\"cwrap\"]' -s NO_EXIT_RUNTIME=1 -s ENVIRONMENT='web'"
    )
    # Output to both public and dist directories
    set_target_properties(zombie_game PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/public"
    )
else()
    # Native target for desktop debugging or validation
    add_executable(zombie_game_native ${SOURCES})
endif()
