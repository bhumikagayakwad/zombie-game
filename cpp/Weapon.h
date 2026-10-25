#ifndef WEAPON_H
#define WEAPON_H

/**
 * @file Weapon.h
 * @brief Manages ammunition, shooting cooldown, and damage for player weapons.
 * 
 * OOP Concepts Demonstrated:
 * - Encapsulation: Ammo counts and fire rates are protected against invalid states.
 * - Composition: Player "has-a" Weapon rather than "is-a" Weapon.
 */
class Weapon {
private:
    int m_ammo;             // Current rounds available
    int m_maxAmmo;          // Capacity limit
    float m_fireRate;       // Minimum seconds between shots (cooldown)
    float m_cooldownTimer;  // Time remaining until next shot can be fired
    float m_bulletDamage;   // Damage dealt per bullet
    float m_bulletSpeed;    // Travel speed for spawned bullets

public:
    // Constructors
    Weapon();
    Weapon(int maxAmmo, float fireRate, float bulletDamage, float bulletSpeed);

    // Core Behavior
    void update(float dt);
    bool canShoot() const;
    bool fire();
    void addAmmo(int amount);
    void reset();

    // Const-correct Getters
    int getAmmo() const { return m_ammo; }
    int getMaxAmmo() const { return m_maxAmmo; }
    float getCooldownProgress() const;
    float getBulletDamage() const { return m_bulletDamage; }
    float getBulletSpeed() const { return m_bulletSpeed; }
};

#endif // WEAPON_H
