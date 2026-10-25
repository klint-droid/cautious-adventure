/**
 * PlayerController.ts
 * Manages the third-person anime female protagonist:
 * WASD camera-relative movement, smooth turning, sprint acceleration,
 * collision sliding, footstep sound effects, and animation driving.
 */

import * as THREE from "three";
import { AnimeCharacterRig } from "./AnimeModelFactory";
import { CharacterAnimationController } from "./CharacterAnimationController";
import { InputController } from "../game/InputController";
import { CameraController } from "../game/CameraController";
import { collisionSystem } from "../world/CollisionSystem";
import { soundManager } from "../audio/SoundManager";

export class PlayerController {
  public rig: AnimeCharacterRig;
  public animator: CharacterAnimationController;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 7.5); // Starts in Central Plaza
  public rotationY = Math.PI;

  private velocity = new THREE.Vector3();
  private walkSpeed = 3.2;
  private sprintSpeed = 6.4;
  private acceleration = 18.0;
  private friction = 12.0;

  private footstepTimer = 0;
  private isMovementLocked = false;

  constructor(rig: AnimeCharacterRig) {
    this.rig = rig;
    this.animator = new CharacterAnimationController(rig);
    this.rig.root.position.copy(this.position);
    this.rig.root.rotation.y = this.rotationY;
  }

  public setMovementLocked(locked: boolean) {
    this.isMovementLocked = locked;
    if (locked) {
      this.velocity.set(0, 0, 0);
      this.animator.setState("idle");
    }
  }

  public getIsMovementLocked(): boolean {
    return this.isMovementLocked;
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.rig.root.position.copy(this.position);
  }

  public lookAt(target: THREE.Vector3) {
    const dir = target.clone().sub(this.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.rotationY = Math.atan2(dir.x, dir.z);
      this.rig.root.rotation.y = this.rotationY;
    }
  }

  public update(delta: number, input: InputController, cameraController: CameraController) {
    if (this.isMovementLocked) {
      this.animator.update(delta, 0);
      return;
    }

    // Determine camera-relative movement input vector
    const moveInput = new THREE.Vector3();
    if (input.state.forward) moveInput.z -= 1;
    if (input.state.backward) moveInput.z += 1;
    if (input.state.left) moveInput.x -= 1;
    if (input.state.right) moveInput.x += 1;

    let targetSpeed = 0;
    const isMoving = moveInput.lengthSq() > 0.001;

    if (isMoving) {
      moveInput.normalize();
      const fwd = cameraController.getForwardVector();
      const right = cameraController.getRightVector();

      // World movement direction
      const worldDir = new THREE.Vector3()
        .addScaledVector(fwd, -moveInput.z)
        .addScaledVector(right, moveInput.x)
        .normalize();

      targetSpeed = input.state.sprint ? this.sprintSpeed : this.walkSpeed;
      const targetVelocity = worldDir.multiplyScalar(targetSpeed);

      // Smooth acceleration
      this.velocity.lerp(targetVelocity, delta * this.acceleration);

      // Smoothly rotate character to face travel direction
      const targetRotationY = Math.atan2(this.velocity.x, this.velocity.z);
      let diff = targetRotationY - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1.0, delta * 14.0);
      this.rig.root.rotation.y = this.rotationY;
    } else {
      // Smooth deceleration to stop
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), delta * this.friction);
    }

    // Resolve collision and apply movement displacement
    const intendedDelta = this.velocity.clone().multiplyScalar(delta);
    const resolvedPosition = collisionSystem.resolveMovement(this.position, intendedDelta, 0.35);
    this.position.copy(resolvedPosition);
    this.rig.root.position.copy(this.position);

    const currentSpeed = this.velocity.length();

    // Footstep Sound Effects
    if (currentSpeed > 0.3) {
      const stepInterval = input.state.sprint ? 0.3 : 0.48;
      this.footstepTimer += delta;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        // Determine surface type based on location
        let surface: "grass" | "stone" | "wood" = "stone";
        const distFromPlazaCenter = Math.hypot(this.position.x, this.position.z);
        if (this.position.x > 10 && this.position.z < 0) {
          surface = "wood"; // Lake pier
        } else if (distFromPlazaCenter > 11 && Math.abs(this.position.x) > 3) {
          surface = "grass";
        }
        soundManager.playFootstep(surface);
      }
    } else {
      this.footstepTimer = 0;
    }

    // Update animations
    this.animator.update(delta, currentSpeed);
  }

  public replaceRig(newRig: AnimeCharacterRig, scene: THREE.Scene) {
    scene.remove(this.rig.root);
    this.rig = newRig;
    this.animator = new CharacterAnimationController(newRig);
    this.rig.root.position.copy(this.position);
    this.rig.root.rotation.y = this.rotationY;
    scene.add(this.rig.root);
  }

}