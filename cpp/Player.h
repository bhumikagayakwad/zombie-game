#ifndef PLAYER_H
#define PLAYER_H

#include "Entity.h"
#include "Health.h"
#include "Weapon.h"

/**
 * @file Player.h
 * @brief Represents the player-controlled survivor.
 * 
 * OOP Concepts Demonstrated:
 * - Inheritance: Derived from Entity (x, y, radius, active).
 * - Composition: Strongly composes Health and Weapon classes.
 * - Encapsulation: Movement speed, invulnerability window, and state management.
 */
class Player : public Entity {
private:
    Health m_health;
    Weapon m_weapon;
    float m_speed;
    float m_invulnerableTimer;
    const float INVULNERABLE_DURATION = 0.8f; // Seconds of damage immunity after being hit

public:
    Player();
    Player(float x, float y);

    // Polymorphic update
    void update(float dt) override;

    // Movement constrained to arena boundaries
    void move(float dirX, float dirY, float dt, float arenaWidth, float arenaHeight);

    // Combat & Supplies
    bool takeDamage(float amount);
    void heal(float amount);
    void addAmmo(int amount);
    bool canShoot() const;
    bool fire();
    void reset(float startX, float startY);

    // Const-correct Queries
    bool isAlive() const { return m_health.isAlive(); }
    bool isInvulnerable() const { return m_invulnerableTimer > 0.0f; }
    float getInvulnerableTimer() const { return m_invulnerableTimer; }
    float getHealth() const { return m_health.getCurrent(); }
    float getMaxHealth() const { return m_health.getMax(); }
    int getAmmo() const { return m_weapon.getAmmo(); }
    int getMaxAmmo() const { return m_weapon.getMaxAmmo(); }
    float getSpeed() const { return m_speed; }
    float getBulletDamage() const { return m_weapon.getBulletDamage(); }
    float getBulletSpeed() const { return m_weapon.getBulletSpeed(); }

    const Weapon& getWeapon() const { return m_weapon; }
    const Health& getHealthComponent() const { return m_health; }
};

#endif // PLAYER_H
