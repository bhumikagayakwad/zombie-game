#include "Supply.h"

Supply::Supply()
    : Entity(0.0f, 0.0f, 15.0f), m_type(SupplyType::HEALTH), m_value(30.0f), m_lifespan(20.0f) {
}

Supply::Supply(float x, float y, SupplyType type, float value, float lifespan)
    : Entity(x, y, 15.0f), m_type(type), m_value(value), m_lifespan(lifespan) {
}

void Supply::update(float dt) {
    if (!m_active) return;

    m_lifespan -= dt;
    if (m_lifespan <= 0.0f) {
        m_active = false;
    }
}
