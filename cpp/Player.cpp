#include "Player.h"
#include <cmath>
#include <algorithm>

Player::Player()
    : Entity(0.0f, 0.0f, 18.0f),
      m_health(100.0f),
      m_weapon(60, 0.18f, 35.0f, 650.0f),
      m_speed(210.0f),
      m_invulnerableTimer(0.0f) {
}

Player::Player(float x, float y)
    : Entity(x, y, 18.0f),
      m_health(100.0f),
      m_weapon(60, 0.18f, 35.0f, 650.0f),
      m_speed(210.0f),
      m_invulnerableTimer(0.0f) {
}

void Player::update(float dt) {
    if (!m_active) return;

    // Tick weapon cooldown
    m_weapon.update(dt);

    // Tick invulnerability timer
    if (m_invulnerableTimer > 0.0f) {
        m_invulnerableTimer -= dt;
        if (m_invulnerableTimer < 0.0f) {
            m_invulnerableTimer = 0.0f;
        }
    }
}

void Player::move(float dirX, float dirY, float dt, float arenaWidth, float arenaHeight) {
    if (!m_active) return;

    // Normalize directional input vector if moving diagonally
    float length = std::sqrt(dirX * dirX + dirY * dirY);
    if (length > 0.0001f) {
        dirX /= length;
        dirY /= length;
    }

    m_x += dirX * m_speed * dt;
    m_y += dirY * m_speed * dt;

    // Enforce arena boundaries
    m_x = std::max(m_radius, std::min(m_x, arenaWidth - m_radius));
    m_y = std::max(m_radius, std::min(m_y, arenaHeight - m_radius));
}

bool Player::takeDamage(float amount) {
    // If still in i-frames, damage is mitigated
    if (isInvulnerable() || !m_active) {
        return false;
    }

    m_health.takeDamage(amount);
    m_invulnerableTimer = INVULNERABLE_DURATION;

    if (!m_health.isAlive()) {
        m_active = false;
    }
    return true;
}

void Player::heal(float amount) {
    m_health.heal(amount);
}

void Player::addAmmo(int amount) {
    m_weapon.addAmmo(amount);
}

bool Player::canShoot() const {
    return m_active && m_weapon.canShoot();
}

bool Player::fire() {
    return m_active && m_weapon.fire();
}

void Player::reset(float startX, float startY) {
    m_x = startX;
    m_y = startY;
    m_active = true;
    m_health.reset();
    m_weapon.reset();
    m_invulnerableTimer = 0.0f;
}
