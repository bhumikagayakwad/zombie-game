#ifndef ZOMBIE_H
#define ZOMBIE_H

#include "Entity.h"
#include "Health.h"

/**
 * @file Zombie.h
 * @brief Enemy entity that tracks and attacks the player.
 * 
 * OOP Concepts Demonstrated:
 * - Inheritance: Inherits spatial attributes from Entity.
 * - Composition: Contains a Health object ("has-a" relationship).
 * - Polymorphism: Implements custom chase & collision physics in update().
 */
enum class ZombieType {
    NORMAL = 0,
    RUNNER = 1,
    TANK = 2
};

class Zombie : public Entity {
private:
    ZombieType m_type;
    Health m_health;
    float m_speed;
    float m_damage;
    int m_pointsValue;
    float m_targetX;
    float m_targetY;

public:
    Zombie();
    Zombie(float x, float y, ZombieType type, float speedMultiplier = 1.0f, float healthMultiplier = 1.0f);

    // Polymorphic update
    void update(float dt) override;

    // AI navigation target
    void setTarget(float x, float y);

    // Damage handling delegation to Health component
    void takeDamage(float amount);
    bool isAlive() const { return m_health.isAlive(); }

    // Const-correct queries
    ZombieType getType() const { return m_type; }
    int getTypeValue() const { return static_cast<int>(m_type); }
    float getHealth() const { return m_health.getCurrent(); }
    float getMaxHealth() const { return m_health.getMax(); }
    float getSpeed() const { return m_speed; }
    float getDamage() const { return m_damage; }
    int getPointsValue() const { return m_pointsValue; }
};

#endif // ZOMBIE_H
