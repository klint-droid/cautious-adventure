/**
 * CameraController.ts
 * Third-person orbital camera controller with smooth mouse look,
 * distance zoom, obstacle occlusion prevention, and cinematic conversation angles.
 */

import * as THREE from "three";
import { collisionSystem } from "../world/CollisionSystem";

export class CameraController {
  public camera: THREE.PerspectiveCamera;

  // Orbit parameters
  public yaw = 0;       // Horizontal angle (radians)
  public pitch = 0.28;  // Vertical angle (radians)
  public distance = 4.2;
  private minDistance = 2.0;
  private maxDistance = 7.5;

  // Smoothing
  private targetLookAt = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();

  // Cinematic Conversation Mode
  private isCinematic = false;
  private cinematicCamPos = new THREE.Vector3();
  private cinematicLookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public setCinematicMode(enabled: boolean, playerPos?: THREE.Vector3, npcPos?: THREE.Vector3) {
    this.isCinematic = enabled;
    if (enabled && playerPos && npcPos) {
      // Calculate midpoint between player (Cyril) and NPC (Klint)
      const mid = playerPos.clone().add(npcPos).multiplyScalar(0.5);
      mid.y = 1.35; // Eye height

      // Perpendicular vector for Genshin-style rule-of-thirds framing
      const toNpc = npcPos.clone().sub(playerPos).normalize();
      const side = new THREE.Vector3(-toNpc.z, 0, toNpc.x).normalize();

      // Position camera so Cyril and Klint are framed cleanly in the left & center
      // with intimate, close-up framing
      this.cinematicCamPos.copy(mid).add(side.multiplyScalar(2.0)).add(new THREE.Vector3(0, 0.15, 0));
      this.cinematicLookAt.copy(mid).add(side.multiplyScalar(-0.25));
    }
  }

  public setCustomCinematic(camPos: THREE.Vector3, lookAtPos: THREE.Vector3, immediate: boolean = false) {
    this.isCinematic = true;
    this.cinematicCamPos.copy(camPos);
    this.cinematicLookAt.copy(lookAtPos);
    if (immediate) {
      this.camera.position.copy(camPos);
      this.currentLookAt.copy(lookAtPos);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  public getIsCinematic(): boolean {
    return this.isCinematic;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    mouseDeltaX: number,
    mouseDeltaY: number,
    wheelDelta: number
  ) {
    if (this.isCinematic) {
      // Smoothly blend camera towards cinematic viewpoint
      this.camera.position.lerp(this.cinematicCamPos, delta * 4.0);
      this.currentLookAt.lerp(this.cinematicLookAt, delta * 4.0);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    // Update orbit angles from mouse movement
    const sensitivity = 0.0035;
    this.yaw -= mouseDeltaX * sensitivity;
    this.pitch += mouseDeltaY * sensitivity;

    // Clamp pitch (-30 deg to +65 deg)
    this.pitch = Math.max(-0.4, Math.min(1.15, this.pitch));

    // Update zoom distance from scroll wheel
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + wheelDelta));

    // Target look-at point (player chest/head height)
    this.targetLookAt.copy(playerPos).add(new THREE.Vector3(0, 1.35, 0));
    this.currentLookAt.lerp(this.targetLookAt, delta * 12.0);

    // Calculate spherical orbit offset
    const cosPitch = Math.cos(this.pitch);
    const offsetX = Math.sin(this.yaw) * cosPitch * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance;
    const offsetZ = Math.cos(this.yaw) * cosPitch * this.distance;

    const desiredCamPos = new THREE.Vector3(
      this.currentLookAt.x + offsetX,
      this.currentLookAt.y + offsetY,
      this.currentLookAt.z + offsetZ
    );

    // Camera Collision Avoidance (prevents camera clipping through café or gazebo)
    const resolvedCamPos = collisionSystem.resolveCameraCollision(this.currentLookAt, desiredCamPos);

    this.camera.position.lerp(resolvedCamPos, delta * 18.0);
    this.camera.lookAt(this.currentLookAt);
  }

  public getForwardVector(): THREE.Vector3 {
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    fwd.y = 0;
    return fwd.normalize();
  }

  public getRightVector(): THREE.Vector3 {
    const fwd = this.getForwardVector();
    return new THREE.Vector3(-fwd.z, 0, fwd.x);
  }
}
