#ifndef GAME_H
#define GAME_H

#include <vector>
#include <random>
#include "Player.h"
#include "Zombie.h"
#include "Bullet.h"
#include "Supply.h"

/**
 * @file Game.h
 * @brief Master simulation controller for the Zombie Survival arena.
 * 
 * OOP Concepts Demonstrated:
 * - Composition & Aggregation: Game holds Player, std::vector of Zombies, Bullets, Supplies.
 * - Encapsulation: Game state transitions, wave progression, and physics interactions.
 * - Single Responsibility: Game coordinates time delta steps, entity lifecycles, and scoring.
 */
enum class GameState {
    MENU = 0,
    PLAYING = 1,
    PAUSED = 2,
    GAME_OVER = 3
};

// Event flags communicated to JavaScript for sound effects and particles
struct GameEvents {
    bool playerShot = false;
    bool zombieHit = false;
    bool zombieKilled = false;
    bool playerDamaged = false;
    bool supplyPickedUp = false;
    bool waveStarted = false;
    bool gameOver = false;
    int lastSupplyType = 0; // 0 for Health, 1 for Ammo

    void clear() {
        playerShot = false;
        zombieHit = false;
        zombieKilled = false;
        playerDamaged = false;
        supplyPickedUp = false;
        waveStarted = false;
        gameOver = false;
    }
};

class Game {
private:
    float m_arenaWidth;
    float m_arenaHeight;

    Player m_player;
    std::vector<Zombie> m_zombies;
    std::vector<Bullet> m_bullets;
    std::vector<Supply> m_supplies;

    GameState m_state;
    int m_score;
    float m_survivalTime;

    // Wave Progression
    int m_wave;
    int m_zombiesRemainingToSpawn;
    float m_spawnInterval;
    float m_spawnTimer;
    float m_waveTransitionTimer;
    bool m_inWaveTransition;

    // Supply Management
    float m_supplyTimer;
    const float SUPPLY_INTERVAL = 14.0f; // Seconds between supply spawns

    // PRNG for deterministic or pseudorandom spawning
    std::mt19937 m_rng;

    // Internal simulation helpers
    void spawnZombie();
    void spawnSupply();
    void startNextWave();
    void checkCollisions();
    void cleanupInactiveEntities();

public:
    GameEvents events;

    // Constructors
    Game();
    Game(float arenaWidth, float arenaHeight);

    // Lifecycle
    void init(float arenaWidth, float arenaHeight);
    void start();
    void pause();
    void resume();
    void restart();

    // Frame update with delta-time
    void update(float dt);

    // Player Actions
    void handlePlayerInput(float dirX, float dirY, float dt);
    bool shoot(float targetX, float targetY);

    // State Queries (Const-correct)
    GameState getState() const { return m_state; }
    int getStateValue() const { return static_cast<int>(m_state); }
    int getScore() const { return m_score; }
    int getWave() const { return m_wave; }
    float getSurvivalTime() const { return m_survivalTime; }
    bool isInWaveTransition() const { return m_inWaveTransition; }
    float getWaveTransitionTimer() const { return m_waveTransitionTimer; }
    int getRemainingZombies() const;

    // Player state queries
    float getPlayerX() const { return m_player.getX(); }
    float getPlayerY() const { return m_player.getY(); }
    float getPlayerRadius() const { return m_player.getRadius(); }
    float getPlayerHealth() const { return m_player.getHealth(); }
    float getPlayerMaxHealth() const { return m_player.getMaxHealth(); }
    int getPlayerAmmo() const { return m_player.getAmmo(); }
    int getPlayerMaxAmmo() const { return m_player.getMaxAmmo(); }
    bool isPlayerInvulnerable() const { return m_player.isInvulnerable(); }

    // Entity Collections queries (for rendering buffer extraction)
    size_t getZombieCount() const { return m_zombies.size(); }
    float getZombieX(size_t index) const;
    float getZombieY(size_t index) const;
    float getZombieRadius(size_t index) const;
    int getZombieType(size_t index) const;
    float getZombieHealth(size_t index) const;
    float getZombieMaxHealth(size_t index) const;

    size_t getBulletCount() const { return m_bullets.size(); }
    float getBulletX(size_t index) const;
    float getBulletY(size_t index) const;
    float getBulletRadius(size_t index) const;

    size_t getSupplyCount() const { return m_supplies.size(); }
    float getSupplyX(size_t index) const;
    float getSupplyY(size_t index) const;
    float getSupplyRadius(size_t index) const;
    int getSupplyType(size_t index) const;

    // Direct object references
    const Player& getPlayer() const { return m_player; }
    const std::vector<Zombie>& getZombies() const { return m_zombies; }
    const std::vector<Bullet>& getBullets() const { return m_bullets; }
    const std::vector<Supply>& getSupplies() const { return m_supplies; }
};

#endif // GAME_H
