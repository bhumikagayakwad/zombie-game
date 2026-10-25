#include "Bullet.h"
#include <cmath>

Bullet::Bullet()
    : Entity(0.0f, 0.0f, 4.0f), m_vx(0.0f), m_vy(0.0f), m_damage(35.0f), m_lifetime(2.5f) {
}

Bullet::Bullet(float x, float y, float targetX, float targetY, float speed, float damage)
    : Entity(x, y, 4.0f), m_damage(damage), m_lifetime(2.5f) {
    float dx = targetX - x;
    float dy = targetY - y;
    float dist = std::sqrt(dx * dx + dy * dy);

    if (dist > 0.0001f) {
        m_vx = (dx / dist) * speed;
        m_vy = (dy / dist) * speed;
    } else {
        m_vx = speed;
        m_vy = 0.0f;
    }
}

void Bullet::update(float dt) {
    if (!m_active) return;

    m_x += m_vx * dt;
    m_y += m_vy * dt;

    m_lifetime -= dt;
    if (m_lifetime <= 0.0f) {
        m_active = false;
    }
}
