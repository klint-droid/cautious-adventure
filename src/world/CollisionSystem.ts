/**
 * CollisionSystem.ts
 * High-performance spatial collider system for third-person player and camera.
 * Supports cylinder colliders, AABB bounding boxes, height calculation,
 * wall sliding, and camera occlusion protection.
 */

import * as THREE from "three";

export interface CylinderCollider {
  x: number;
  z: number;
  radius: number;
}

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export class CollisionSystem {
  private cylinders: CylinderCollider[] = [];
  private boxes: BoxCollider[] = [];

  // World bounds for the compact park (100x100m)
  private minBound = new THREE.Vector2(-50, -50);
  private maxBound = new THREE.Vector2(50, 50);

  constructor() {}

  public addCylinder(x: number, z: number, radius: number) {
    this.cylinders.push({ x, z, radius });
  }

  public addBox(minX: number, maxX: number, minZ: number, maxZ: number, minY = -10, maxY = 20) {
    this.boxes.push({ minX, maxX, minZ, maxZ, minY, maxY });
  }

  public clear() {
    this.cylinders = [];
    this.boxes = [];
  }

  /**
   * Resolves horizontal character movement with smooth obstacle sliding.
   */
  public resolveMovement(currentPos: THREE.Vector3, intendedDelta: THREE.Vector3, radius = 0.35): THREE.Vector3 {
    const result = currentPos.clone().add(intendedDelta);

    // 1. Clamp to outer park fence bounds
    result.x = Math.max(this.minBound.x + radius, Math.min(this.maxBound.x - radius, result.x));
    result.z = Math.max(this.minBound.y + radius, Math.min(this.maxBound.y - radius, result.z));

    // 2. Resolve Cylinder colliders (Trees, street lamps, pillars)
    for (const cyl of this.cylinders) {
      const dx = result.x - cyl.x;
      const dz = result.z - cyl.z;
      const distSq = dx * dx + dz * dz;
      const minDist = cyl.radius + radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = minDist - dist;
          result.x += (dx / dist) * overlap;
          result.z += (dz / dist) * overlap;
        } else {
          result.x += minDist;
        }
      }
    }

    // 3. Resolve Box colliders (Café walls, counters, benches, pier railings)
    for (const box of this.boxes) {
      if (box.minY !== undefined && box.maxY !== undefined) {
        if (result.y < box.minY || result.y > box.maxY) continue;
      }

      // Check if circle overlaps AABB in 2D (x, z)
      const closestX = Math.max(box.minX, Math.min(result.x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(result.z, box.maxZ));

      const dx = result.x - closestX;
      const dz = result.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          result.x += (dx / dist) * overlap;
          result.z += (dz / dist) * overlap;
        } else {
          // Inside box: push out to nearest edge
          const distMinX = Math.abs(result.x - box.minX);
          const distMaxX = Math.abs(result.x - box.maxX);
          const distMinZ = Math.abs(result.z - box.minZ);
          const distMaxZ = Math.abs(result.z - box.maxZ);

          const minEdge = Math.min(distMinX, distMaxX, distMinZ, distMaxZ);
          if (minEdge === distMinX) result.x = box.minX - radius;
          else if (minEdge === distMaxX) result.x = box.maxX + radius;
          else if (minEdge === distMinZ) result.z = box.minZ - radius;
          else result.z = box.maxZ + radius;
        }
      }
    }

    return result;
  }

  /**
   * Prevents camera from clipping into walls, café interior, or large obstacles.
   */
  public resolveCameraCollision(target: THREE.Vector3, desiredCamPos: THREE.Vector3, margin = 0.3): THREE.Vector3 {
    const ray = new THREE.Ray(target, desiredCamPos.clone().sub(target).normalize());
    const maxDist = target.distanceTo(desiredCamPos);
    let closestDist = maxDist;

    // Check intersection with box colliders
    for (const box of this.boxes) {
      const aabb = new THREE.Box3(
        new THREE.Vector3(box.minX, box.minY ?? -10, box.minZ),
        new THREE.Vector3(box.maxX, box.maxY ?? 20, box.maxZ)
      );

      const hit = ray.intersectBox(aabb, new THREE.Vector3());
      if (hit) {
        const d = target.distanceTo(hit);
        if (d < closestDist && d > 0.2) {
          closestDist = Math.max(0.6, d - margin);
        }
      }
    }

    if (closestDist < maxDist) {
      return target.clone().add(ray.direction.clone().multiplyScalar(closestDist));
    }
    return desiredCamPos;
  }
}

export const collisionSystem = new CollisionSystem();
