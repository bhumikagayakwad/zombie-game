#include "Entity.h"
#include <cmath>

Entity::Entity()
    : m_x(0.0f), m_y(0.0f), m_radius(10.0f), m_active(true) {
}

Entity::Entity(float x, float y, float radius)
    : m_x(x), m_y(y), m_radius(radius), m_active(true) {
}

bool Entity::checkCollision(const Entity& other) const {
    if (!m_active || !other.m_active) {
        return false;
    }
    float dx = m_x - other.m_x;
    float dy = m_y - other.m_y;
    float distSq = dx * dx + dy * dy;
    float radiusSum = m_radius + other.m_radius;
    return distSq <= (radiusSum * radiusSum);
}

float Entity::distanceTo(float targetX, float targetY) const {
    float dx = targetX - m_x;
    float dy = targetY - m_y;
    return std::sqrt(dx * dx + dy * dy);
}
