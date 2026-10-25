#ifndef ENTITY_H
#define ENTITY_H

/**
 * @file Entity.h
 * @brief Base class for all game entities (Player, Zombie, Bullet, Supply).
 * 
 * OOP Concepts Demonstrated:
 * - Abstraction: Abstract base representing any 2D entity in the game arena.
 * - Inheritance: Player, Zombie, Bullet, and Supply inherit common position & collision logic.
 * - Polymorphism: Pure virtual update() method overridden by derived classes.
 * - Encapsulation: Coordinates and bounding properties are protected with public getters.
 */
class Entity {
protected:
    float m_x;          // X position on 2D arena
    float m_y;          // Y position on 2D arena
    float m_radius;     // Circular collision boundary radius
    bool m_active;      // Whether entity is active/alive in the game world

public:
    // Constructors
    Entity();
    Entity(float x, float y, float radius);
    virtual ~Entity() = default; // Virtual destructor ensures safe polymorphic deletion

    // Polymorphic update method (must be implemented by derived classes)
    virtual void update(float dt) = 0;

    // Encapsulated Getters and Setters (Const-correct)
    float getX() const { return m_x; }
    float getY() const { return m_y; }
    void setPosition(float x, float y) { m_x = x; m_y = y; }

    float getRadius() const { return m_radius; }
    void setRadius(float radius) { m_radius = radius; }

    bool isActive() const { return m_active; }
    void setActive(bool active) { m_active = active; }

    // Collision detection helper using Euclidean distance (Circle-to-Circle)
    bool checkCollision(const Entity& other) const;
    float distanceTo(float targetX, float targetY) const;
};

#endif // ENTITY_H
