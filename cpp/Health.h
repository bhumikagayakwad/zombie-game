#ifndef HEALTH_H
#define HEALTH_H

/**
 * @file Health.h
 * @brief Manages entity health points with strictly validated boundaries.
 * 
 * OOP Concepts Demonstrated:
 * - Encapsulation: Health points are strictly private; modifications can only occur 
 *   through takeDamage() and heal(), ensuring invariants (0 <= current <= max).
 */
class Health {
private:
    float m_current;
    float m_max;

public:
    // Constructors
    Health();
    explicit Health(float maxHealth);

    // Core Mutators
    void takeDamage(float amount);
    void heal(float amount);
    void reset();

    // Query Methods (Const-correct)
    bool isAlive() const { return m_current > 0.0f; }
    float getCurrent() const { return m_current; }
    float getMax() const { return m_max; }
    float getPercentage() const { return m_max > 0.0f ? (m_current / m_max) : 0.0f; }

    void setMax(float maxHealth);
};

#endif // HEALTH_H
