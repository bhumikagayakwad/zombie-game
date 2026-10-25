#include "Health.h"
#include <algorithm>

Health::Health()
    : m_current(100.0f), m_max(100.0f) {
}

Health::Health(float maxHealth)
    : m_current(maxHealth > 0.0f ? maxHealth : 100.0f),
      m_max(maxHealth > 0.0f ? maxHealth : 100.0f) {
}

void Health::takeDamage(float amount) {
    if (amount <= 0.0f) return;
    m_current -= amount;
    if (m_current < 0.0f) {
        m_current = 0.0f;
    }
}

void Health::heal(float amount) {
    if (amount <= 0.0f) return;
    m_current += amount;
    if (m_current > m_max) {
        m_current = m_max;
    }
}

void Health::reset() {
    m_current = m_max;
}

void Health::setMax(float maxHealth) {
    if (maxHealth <= 0.0f) return;
    m_max = maxHealth;
    if (m_current > m_max) {
        m_current = m_max;
    }
}
