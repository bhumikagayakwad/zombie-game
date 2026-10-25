#ifndef SUPPLY_H
#define SUPPLY_H

#include "Entity.h"

/**
 * @file Supply.h
 * @brief Represents collectible supplies (Health Kits and Ammo Crates).
 * 
 * OOP Concepts Demonstrated:
 * - Inheritance: Derives from Entity for position, bounding radius, active status.
 * - Encapsulation: Supply type and value are protected.
 */
enum class SupplyType {
    HEALTH = 0,
    AMMO = 1
};

class Supply : public Entity {
private:
    SupplyType m_type;
    float m_value;          // Amount of health (+30) or ammo (+30) restored
    float m_lifespan;       // Time in seconds before supply disappears

public:
    Supply();
    Supply(float x, float y, SupplyType type, float value = 30.0f, float lifespan = 20.0f);

    void update(float dt) override;

    SupplyType getType() const { return m_type; }
    int getTypeValue() const { return static_cast<int>(m_type); }
    float getValue() const { return m_value; }
    float getLifespan() const { return m_lifespan; }
};

#endif // SUPPLY_H
