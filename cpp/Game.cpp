#include "Game.h"
#include <cmath>
#include <algorithm>

Game::Game()
    : m_arenaWidth(1200.0f), m_arenaHeight(800.0f),
      m_player(600.0f, 400.0f),
      m_state(GameState::MENU),
      m_score(0),
      m_survivalTime(0.0f),
      m_wave(0),
      m_zombiesRemainingToSpawn(0),
      m_spawnInterval(1.5f),
      m_spawnTimer(0.0f),
      m_waveTransitionTimer(0.0f),
      m_inWaveTransition(false),
      m_supplyTimer(5.0f),
      m_rng(1337) {
}

Game::Game(float arenaWidth, float arenaHeight)
    : m_arenaWidth(arenaWidth), m_arenaHeight(arenaHeight),
      m_player(arenaWidth / 2.0f, arenaHeight / 2.0f),
      m_state(GameState::MENU),
      m_score(0),
      m_survivalTime(0.0f),
      m_wave(0),
      m_zombiesRemainingToSpawn(0),
      m_spawnInterval(1.5f),
      m_spawnTimer(0.0f),
      m_waveTransitionTimer(0.0f),
      m_inWaveTransition(false),
      m_supplyTimer(5.0f),
      m_rng(1337) {
}

void Game::init(float arenaWidth, float arenaHeight) {
    m_arenaWidth = arenaWidth;
    m_arenaHeight = arenaHeight;
    restart();
}

void Game::start() {
    restart();
    m_state = GameState::PLAYING;
}

void Game::pause() {
    if (m_state == GameState::PLAYING) {
        m_state = GameState::PAUSED;
    }
}

void Game::resume() {
    if (m_state == GameState::PAUSED) {
        m_state = GameState::PLAYING;
    }
}

void Game::restart() {
    m_score = 0;
    m_survivalTime = 0.0f;
    m_wave = 0;
    m_zombiesRemainingToSpawn = 0;
    m_spawnTimer = 0.0f;
    m_supplyTimer = 6.0f;
    m_inWaveTransition = false;
    m_waveTransitionTimer = 0.0f;

    m_zombies.clear();
    m_bullets.clear();
    m_supplies.clear();

    m_player.reset(m_arenaWidth / 2.0f, m_arenaHeight / 2.0f);
    events.clear();

    m_state = GameState::PLAYING;
    startNextWave();
}

void Game::startNextWave() {
    m_wave++;
    m_inWaveTransition = true;
    m_waveTransitionTimer = 3.0f; // 3 seconds countdown between waves

    // Wave scaling formula: smooth and beginner-friendly
    int count = 5 + (m_wave - 1) * 3;
    if (count > 40) count = 40; // Upper limit to ensure 60fps performance
    m_zombiesRemainingToSpawn = count;

    // Spawn rate speeds up slightly with waves
    m_spawnInterval = std::max(0.45f, 1.6f - (m_wave * 0.12f));
    m_spawnTimer = 0.2f;

    events.waveStarted = true;
}

void Game::spawnZombie() {
    if (m_zombiesRemainingToSpawn <= 0) return;

    std::uniform_real_distribution<float> sideDist(0.0f, 4.0f);
    std::uniform_real_distribution<float> widthDist(0.0f, m_arenaWidth);
    std::uniform_real_distribution<float> heightDist(0.0f, m_arenaHeight);

    float spawnX = 0.0f;
    float spawnY = 0.0f;
    int side = static_cast<int>(sideDist(m_rng));

    const float PADDING = 30.0f;
    switch (side) {
        case 0: // Top
            spawnX = widthDist(m_rng);
            spawnY = -PADDING;
            break;
        case 1: // Right
            spawnX = m_arenaWidth + PADDING;
            spawnY = heightDist(m_rng);
            break;
        case 2: // Bottom
            spawnX = widthDist(m_rng);
            spawnY = m_arenaHeight + PADDING;
            break;
        case 3: // Left
        default:
            spawnX = -PADDING;
            spawnY = heightDist(m_rng);
            break;
    }

    // Determine type based on current wave
    ZombieType type = ZombieType::NORMAL;
    std::uniform_int_distribution<int> typeRoll(0, 100);
    int roll = typeRoll(m_rng);

    if (m_wave >= 3 && roll > 75) {
        type = ZombieType::TANK;
    } else if (m_wave >= 2 && roll > 50) {
        type = ZombieType::RUNNER;
    }

    // Gradual difficulty scaling
    float speedMultiplier = 1.0f + (m_wave * 0.035f);
    float healthMultiplier = 1.0f + (m_wave * 0.05f);

    m_zombies.emplace_back(spawnX, spawnY, type, speedMultiplier, healthMultiplier);
    m_zombiesRemainingToSpawn--;
}

void Game::spawnSupply() {
    std::uniform_real_distribution<float> xDist(60.0f, m_arenaWidth - 60.0f);
    std::uniform_real_distribution<float> yDist(60.0f, m_arenaHeight - 60.0f);
    std::uniform_int_distribution<int> typeDist(0, 1);

    SupplyType type = (typeDist(m_rng) == 0) ? SupplyType::HEALTH : SupplyType::AMMO;
    m_supplies.emplace_back(xDist(m_rng), yDist(m_rng), type, 30.0f, 22.0f);
}

void Game::handlePlayerInput(float dirX, float dirY, float dt) {
    if (m_state != GameState::PLAYING) return;
    m_player.move(dirX, dirY, dt, m_arenaWidth, m_arenaHeight);
}

bool Game::shoot(float targetX, float targetY) {
    if (m_state != GameState::PLAYING) return false;

    if (m_player.fire()) {
        float px = m_player.getX();
        float py = m_player.getY();
        m_bullets.emplace_back(px, py, targetX, targetY, m_player.getBulletSpeed(), m_player.getBulletDamage());
        events.playerShot = true;
        return true;
    }
    return false;
}

void Game::update(float dt) {
    events.clear();

    if (m_state != GameState::PLAYING) return;

    // Survival time clock
    m_survivalTime += dt;

    // Update Player
    m_player.update(dt);
    if (!m_player.isAlive()) {
        m_state = GameState::GAME_OVER;
        events.gameOver = true;
        return;
    }

    // Wave transition countdown
    if (m_inWaveTransition) {
        m_waveTransitionTimer -= dt;
        if (m_waveTransitionTimer <= 0.0f) {
            m_inWaveTransition = false;
        }
    } else {
        // Zombie spawning logic
        if (m_zombiesRemainingToSpawn > 0) {
            m_spawnTimer -= dt;
            if (m_spawnTimer <= 0.0f) {
                spawnZombie();
                m_spawnTimer = m_spawnInterval;
            }
        } else if (m_zombies.empty()) {
            // Wave cleared!
            m_score += 500 * m_wave; // Wave survival bonus
            startNextWave();
        }
    }

    // Supply spawning timer
    m_supplyTimer -= dt;
    if (m_supplyTimer <= 0.0f) {
        if (m_supplies.size() < 4) { // Cap on-screen supplies
            spawnSupply();
        }
        m_supplyTimer = SUPPLY_INTERVAL;
    }

    // Update Zombies (AI target tracking)
    float px = m_player.getX();
    float py = m_player.getY();
    for (auto& zombie : m_zombies) {
        zombie.setTarget(px, py);
        zombie.update(dt);
    }

    // Update Bullets
    for (auto& bullet : m_bullets) {
        bullet.update(dt);
    }

    // Update Supplies (lifespan expiration)
    for (auto& supply : m_supplies) {
        supply.update(dt);
    }

    // Collision Detection and Physics
    checkCollisions();

    // Clean up dead/inactive entities
    cleanupInactiveEntities();
}

void Game::checkCollisions() {
    // 1. Bullet vs Zombie collisions
    for (auto& bullet : m_bullets) {
        if (!bullet.isActive()) continue;

        for (auto& zombie : m_zombies) {
            if (!zombie.isActive()) continue;

            if (bullet.checkCollision(zombie)) {
                bullet.setActive(false);
                zombie.takeDamage(bullet.getDamage());
                events.zombieHit = true;

                if (!zombie.isAlive()) {
                    m_score += zombie.getPointsValue();
                    events.zombieKilled = true;
                }
                break; // One bullet hits one zombie
            }
        }
    }

    // 2. Zombie vs Player collisions
    for (auto& zombie : m_zombies) {
        if (!zombie.isActive()) continue;

        if (m_player.checkCollision(zombie)) {
            if (m_player.takeDamage(zombie.getDamage())) {
                events.playerDamaged = true;
                if (!m_player.isAlive()) {
                    m_state = GameState::GAME_OVER;
                    events.gameOver = true;
                    return;
                }
            }
        }
    }

    // 3. Player vs Supply collisions
    for (auto& supply : m_supplies) {
        if (!supply.isActive()) continue;

        if (m_player.checkCollision(supply)) {
            supply.setActive(false);
            events.supplyPickedUp = true;
            events.lastSupplyType = supply.getTypeValue();

            if (supply.getType() == SupplyType::HEALTH) {
                m_player.heal(supply.getValue());
            } else if (supply.getType() == SupplyType::AMMO) {
                m_player.addAmmo(static_cast<int>(supply.getValue()));
            }
            m_score += 50; // Small bonus for collecting supplies
        }
    }
}

void Game::cleanupInactiveEntities() {
    // Remove inactive bullets
    m_bullets.erase(
        std::remove_if(m_bullets.begin(), m_bullets.end(),
            [](const Bullet& b) { return !b.isActive(); }),
        m_bullets.end()
    );

    // Remove dead zombies
    m_zombies.erase(
        std::remove_if(m_zombies.begin(), m_zombies.end(),
            [](const Zombie& z) { return !z.isActive(); }),
        m_zombies.end()
    );

    // Remove collected or expired supplies
    m_supplies.erase(
        std::remove_if(m_supplies.begin(), m_supplies.end(),
            [](const Supply& s) { return !s.isActive(); }),
        m_supplies.end()
    );
}

int Game::getRemainingZombies() const {
    return static_cast<int>(m_zombies.size()) + m_zombiesRemainingToSpawn;
}

// Accessors for entity arrays (index-safe)
float Game::getZombieX(size_t index) const {
    return index < m_zombies.size() ? m_zombies[index].getX() : 0.0f;
}
float Game::getZombieY(size_t index) const {
    return index < m_zombies.size() ? m_zombies[index].getY() : 0.0f;
}
float Game::getZombieRadius(size_t index) const {
    return index < m_zombies.size() ? m_zombies[index].getRadius() : 0.0f;
}
int Game::getZombieType(size_t index) const {
    return index < m_zombies.size() ? m_zombies[index].getTypeValue() : 0;
}
float Game::getZombieHealth(size_t index) const {
    return index < m_zombies.size() ? m_zombies[index].getHealth() : 0.0f;
}
float Game::getZombieMaxHealth(size_t index) const {
    return index < m_zombies.size() ? m_zombies[index].getMaxHealth() : 0.0f;
}

float Game::getBulletX(size_t index) const {
    return index < m_bullets.size() ? m_bullets[index].getX() : 0.0f;
}
float Game::getBulletY(size_t index) const {
    return index < m_bullets.size() ? m_bullets[index].getY() : 0.0f;
}
float Game::getBulletRadius(size_t index) const {
    return index < m_bullets.size() ? m_bullets[index].getRadius() : 0.0f;
}

float Game::getSupplyX(size_t index) const {
    return index < m_supplies.size() ? m_supplies[index].getX() : 0.0f;
}
float Game::getSupplyY(size_t index) const {
    return index < m_supplies.size() ? m_supplies[index].getY() : 0.0f;
}
float Game::getSupplyRadius(size_t index) const {
    return index < m_supplies.size() ? m_supplies[index].getRadius() : 0.0f;
}
int Game::getSupplyType(size_t index) const {
    return index < m_supplies.size() ? m_supplies[index].getTypeValue() : 0;
}
