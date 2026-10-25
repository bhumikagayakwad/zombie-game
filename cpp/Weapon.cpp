#include "Weapon.h"
#include <algorithm>

Weapon::Weapon()
    : m_ammo(30), m_maxAmmo(60), m_fireRate(0.18f),
      m_cooldownTimer(0.0f), m_bulletDamage(35.0f), m_bulletSpeed(650.0f) {
}

Weapon::Weapon(int maxAmmo, float fireRate, float bulletDamage, float bulletSpeed)
    : m_ammo(maxAmmo / 2), m_maxAmmo(maxAmmo), m_fireRate(fireRate),
      m_cooldownTimer(0.0f), m_bulletDamage(bulletDamage), m_bulletSpeed(bulletSpeed) {
}

void Weapon::update(float dt) {
    if (m_cooldownTimer > 0.0f) {
        m_cooldownTimer -= dt;
        if (m_cooldownTimer < 0.0f) {
            m_cooldownTimer = 0.0f;
        }
    }
}

bool Weapon::canShoot() const {
    return (m_ammo > 0) && (m_cooldownTimer <= 0.0f);
}

bool Weapon::fire() {
    if (!canShoot()) {
        return false;
    }
    m_ammo--;
    m_cooldownTimer = m_fireRate;
    return true;
}

void Weapon::addAmmo(int amount) {
    if (amount <= 0) return;
    m_ammo = std::min(m_ammo + amount, m_maxAmmo);
}

void Weapon::reset() {
    m_ammo = m_maxAmmo / 2;
    m_cooldownTimer = 0.0f;
}

float Weapon::getCooldownProgress() const {
    if (m_fireRate <= 0.0f) return 1.0f;
    return 1.0f - (m_cooldownTimer / m_fireRate);
}
