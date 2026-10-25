/**
 * @file bindings.cpp
 * @brief Emscripten bindings and C-export bridge between C++ and JavaScript.
 * 
 * Exposes the C++ Game simulation to the WebAssembly JavaScript environment.
 */

#include "Game.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

// Global singleton instance for simple C-API access if desired
static Game* g_game = nullptr;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void game_init(float width, float height) {
    if (!g_game) {
        g_game = new Game(width, height);
    } else {
        g_game->init(width, height);
    }
}

EMSCRIPTEN_KEEPALIVE
void game_start() {
    if (g_game) g_game->start();
}

EMSCRIPTEN_KEEPALIVE
void game_pause() {
    if (g_game) g_game->pause();
}

EMSCRIPTEN_KEEPALIVE
void game_resume() {
    if (g_game) g_game->resume();
}

EMSCRIPTEN_KEEPALIVE
void game_restart() {
    if (g_game) g_game->restart();
}

EMSCRIPTEN_KEEPALIVE
void game_update(float dt) {
    if (g_game) g_game->update(dt);
}

EMSCRIPTEN_KEEPALIVE
void game_move_player(float dirX, float dirY, float dt) {
    if (g_game) g_game->handlePlayerInput(dirX, dirY, dt);
}

EMSCRIPTEN_KEEPALIVE
int game_shoot(float targetX, float targetY) {
    if (g_game) return g_game->shoot(targetX, targetY) ? 1 : 0;
    return 0;
}

// Queries
EMSCRIPTEN_KEEPALIVE int game_get_state() { return g_game ? g_game->getStateValue() : 0; }
EMSCRIPTEN_KEEPALIVE int game_get_score() { return g_game ? g_game->getScore() : 0; }
EMSCRIPTEN_KEEPALIVE int game_get_wave() { return g_game ? g_game->getWave() : 0; }
EMSCRIPTEN_KEEPALIVE float game_get_survival_time() { return g_game ? g_game->getSurvivalTime() : 0.0f; }
EMSCRIPTEN_KEEPALIVE int game_get_remaining_zombies() { return g_game ? g_game->getRemainingZombies() : 0; }
EMSCRIPTEN_KEEPALIVE int game_is_wave_transition() { return (g_game && g_game->isInWaveTransition()) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE float game_get_wave_transition_timer() { return g_game ? g_game->getWaveTransitionTimer() : 0.0f; }

// Player Queries
EMSCRIPTEN_KEEPALIVE float game_get_player_x() { return g_game ? g_game->getPlayerX() : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_player_y() { return g_game ? g_game->getPlayerY() : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_player_radius() { return g_game ? g_game->getPlayerRadius() : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_player_health() { return g_game ? g_game->getPlayerHealth() : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_player_max_health() { return g_game ? g_game->getPlayerMaxHealth() : 0.0f; }
EMSCRIPTEN_KEEPALIVE int game_get_player_ammo() { return g_game ? g_game->getPlayerAmmo() : 0; }
EMSCRIPTEN_KEEPALIVE int game_get_player_max_ammo() { return g_game ? g_game->getPlayerMaxAmmo() : 0; }
EMSCRIPTEN_KEEPALIVE int game_is_player_invulnerable() { return (g_game && g_game->isPlayerInvulnerable()) ? 1 : 0; }

// Zombies
EMSCRIPTEN_KEEPALIVE int game_get_zombie_count() { return g_game ? static_cast<int>(g_game->getZombieCount()) : 0; }
EMSCRIPTEN_KEEPALIVE float game_get_zombie_x(int i) { return g_game ? g_game->getZombieX(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_zombie_y(int i) { return g_game ? g_game->getZombieY(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_zombie_radius(int i) { return g_game ? g_game->getZombieRadius(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE int game_get_zombie_type(int i) { return g_game ? g_game->getZombieType(i) : 0; }
EMSCRIPTEN_KEEPALIVE float game_get_zombie_health(int i) { return g_game ? g_game->getZombieHealth(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_zombie_max_health(int i) { return g_game ? g_game->getZombieMaxHealth(i) : 0.0f; }

// Bullets
EMSCRIPTEN_KEEPALIVE int game_get_bullet_count() { return g_game ? static_cast<int>(g_game->getBulletCount()) : 0; }
EMSCRIPTEN_KEEPALIVE float game_get_bullet_x(int i) { return g_game ? g_game->getBulletX(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_bullet_y(int i) { return g_game ? g_game->getBulletY(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_bullet_radius(int i) { return g_game ? g_game->getBulletRadius(i) : 0.0f; }

// Supplies
EMSCRIPTEN_KEEPALIVE int game_get_supply_count() { return g_game ? static_cast<int>(g_game->getSupplyCount()) : 0; }
EMSCRIPTEN_KEEPALIVE float game_get_supply_x(int i) { return g_game ? g_game->getSupplyX(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_supply_y(int i) { return g_game ? g_game->getSupplyY(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE float game_get_supply_radius(int i) { return g_game ? g_game->getSupplyRadius(i) : 0.0f; }
EMSCRIPTEN_KEEPALIVE int game_get_supply_type(int i) { return g_game ? g_game->getSupplyType(i) : 0; }

// Audio / Visual Event Flags
EMSCRIPTEN_KEEPALIVE int game_event_player_shot() { return (g_game && g_game->events.playerShot) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_zombie_hit() { return (g_game && g_game->events.zombieHit) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_zombie_killed() { return (g_game && g_game->events.zombieKilled) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_player_damaged() { return (g_game && g_game->events.playerDamaged) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_supply_picked() { return (g_game && g_game->events.supplyPickedUp) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_wave_started() { return (g_game && g_game->events.waveStarted) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_game_over() { return (g_game && g_game->events.gameOver) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int game_event_supply_type() { return g_game ? g_game->events.lastSupplyType : 0; }

} // extern "C"

// Also expose via modern C++ Embind for object-oriented JS usage
EMSCRIPTEN_BINDINGS(zombie_game_module) {
    enum_<GameState>("GameState")
        .value("MENU", GameState::MENU)
        .value("PLAYING", GameState::PLAYING)
        .value("PAUSED", GameState::PAUSED)
        .value("GAME_OVER", GameState::GAME_OVER);

    enum_<ZombieType>("ZombieType")
        .value("NORMAL", ZombieType::NORMAL)
        .value("RUNNER", ZombieType::RUNNER)
        .value("TANK", ZombieType::TANK);

    enum_<SupplyType>("SupplyType")
        .value("HEALTH", SupplyType::HEALTH)
        .value("AMMO", SupplyType::AMMO);

    class_<Game>("Game")
        .constructor<float, float>()
        .function("init", &Game::init)
        .function("start", &Game::start)
        .function("pause", &Game::pause)
        .function("resume", &Game::resume)
        .function("restart", &Game::restart)
        .function("update", &Game::update)
        .function("handlePlayerInput", &Game::handlePlayerInput)
        .function("shoot", &Game::shoot)
        .function("getStateValue", &Game::getStateValue)
        .function("getScore", &Game::getScore)
        .function("getWave", &Game::getWave)
        .function("getSurvivalTime", &Game::getSurvivalTime)
        .function("isInWaveTransition", &Game::isInWaveTransition)
        .function("getWaveTransitionTimer", &Game::getWaveTransitionTimer)
        .function("getRemainingZombies", &Game::getRemainingZombies)
        .function("getPlayerX", &Game::getPlayerX)
        .function("getPlayerY", &Game::getPlayerY)
        .function("getPlayerRadius", &Game::getPlayerRadius)
        .function("getPlayerHealth", &Game::getPlayerHealth)
        .function("getPlayerMaxHealth", &Game::getPlayerMaxHealth)
        .function("getPlayerAmmo", &Game::getPlayerAmmo)
        .function("getPlayerMaxAmmo", &Game::getPlayerMaxAmmo)
        .function("isPlayerInvulnerable", &Game::isPlayerInvulnerable)
        .function("getZombieCount", &Game::getZombieCount)
        .function("getZombieX", &Game::getZombieX)
        .function("getZombieY", &Game::getZombieY)
        .function("getZombieRadius", &Game::getZombieRadius)
        .function("getZombieType", &Game::getZombieType)
        .function("getZombieHealth", &Game::getZombieHealth)
        .function("getZombieMaxHealth", &Game::getZombieMaxHealth)
        .function("getBulletCount", &Game::getBulletCount)
        .function("getBulletX", &Game::getBulletX)
        .function("getBulletY", &Game::getBulletY)
        .function("getBulletRadius", &Game::getBulletRadius)
        .function("getSupplyCount", &Game::getSupplyCount)
        .function("getSupplyX", &Game::getSupplyX)
        .function("getSupplyY", &Game::getSupplyY)
        .function("getSupplyRadius", &Game::getSupplyRadius)
        .function("getSupplyType", &Game::getSupplyType);
}

#else

// Native fallback main or test runner when compiled without Emscripten
#include <iostream>
int main() {
    std::cout << "Zombie Survival Game - C++ Native Simulation Engine" << std::endl;
    Game game(1200.0f, 800.0f);
    game.start();
    std::cout << "Game started successfully. Wave: " << game.getWave() 
              << ", Player Health: " << game.getPlayerHealth() << std::endl;
    
    // Simulate 50 frames
    for (int i = 0; i < 50; ++i) {
        game.update(0.016f);
    }
    std::cout << "50 frames simulated. Zombies: " << game.getZombieCount() 
              << ", Score: " << game.getScore() << std::endl;
    return 0;
}

#endif
