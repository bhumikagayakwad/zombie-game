#ifndef BULLET_H
#define BULLET_H

#include "Entity.h"

/**
 * @file Bullet.h
 * @brief Represents a projectile fired by the player.
 * 
 * OOP Concepts Demonstrated:
 * - Inheritance: Inherits position (m_x, m_y), radius, active state from Entity.
 * - Polymorphism: Overrides virtual update(float dt) for linear ballistic movement.
 */
class Bullet : public Entity {
private:
    float m_vx;         // Velocity X component
    float m_vy;         // Velocity Y component
    float m_damage;     // Damage dealt to a zombie on impact
    float m_lifetime;   // Maximum remaining lifespan in seconds

public:
    Bullet();
    Bullet(float x, float y, float targetX, float targetY, float speed, float damage);

    // Polymorphic update
    void update(float dt) override;

    float getDamage() const { return m_damage; }
};

#endif // BULLET_H
