#include "Zombie.h"
#include <cmath>

Zombie::Zombie()
    : Entity(0.0f, 0.0f, 16.0f), m_type(ZombieType::NORMAL), m_health(70.0f),
      m_speed(90.0f), m_damage(15.0f), m_pointsValue(100), m_targetX(0.0f), m_targetY(0.0f) {
}

Zombie::Zombie(float x, float y, ZombieType type, float speedMultiplier, float healthMultiplier)
    : Entity(x, y, 16.0f), m_type(type), m_targetX(x), m_targetY(y) {
    
    switch (type) {
        case ZombieType::RUNNER:
            m_radius = 14.0f;
            m_health = Health(45.0f * healthMultiplier);
            m_speed = 145.0f * speedMultiplier;
            m_damage = 10.0f;
            m_pointsValue = 150;
            break;
            
        case ZombieType::TANK:
            m_radius = 24.0f;
            m_health = Health(180.0f * healthMultiplier);
            m_speed = 65.0f * speedMultiplier;
            m_damage = 25.0f;
            m_pointsValue = 300;
            break;

        case ZombieType::NORMAL:
        default:
            m_radius = 16.0f;
            m_health = Health(75.0f * healthMultiplier);
            m_speed = 95.0f * speedMultiplier;
            m_damage = 15.0f;
            m_pointsValue = 100;
            break;
    }
}

void Zombie::setTarget(float x, float y) {
    m_targetX = x;
    m_targetY = y;
}

void Zombie::update(float dt) {
    if (!m_active) return;

    // Vector towards target
    float dx = m_targetX - m_x;
    float dy = m_targetY - m_y;
    float dist = std::sqrt(dx * dx + dy * dy);

    if (dist > 1.0f) {
        float dirX = dx / dist;
        float dirY = dy / dist;
        m_x += dirX * m_speed * dt;
        m_y += dirY * m_speed * dt;
    }
}

void Zombie::takeDamage(float amount) {
    m_health.takeDamage(amount);
    if (!m_health.isAlive()) {
        m_active = false;
    }
}
