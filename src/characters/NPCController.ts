/**
 * NPCController.ts
 * Manages the male anime NPC ("Ren Takahiro"):
 * State machine (IDLE, AWARE, TALKING, WALKING, SITTING),
 * proximity awareness, smooth turning towards player, and emotional reactions.
 */

import * as THREE from "three";
import { AnimeCharacterRig } from "./AnimeModelFactory";
import { CharacterAnimationController } from "./CharacterAnimationController";
import { relationshipSystem } from "../dialogue/RelationshipSystem";

export type NPCBehaviorState = "IDLE" | "AWARE" | "TALKING" | "WALKING" | "SITTING" | "CONFESSION";

export class NPCController {
  public rig: AnimeCharacterRig;
  public animator: CharacterAnimationController;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 3.2); // Under Great Sakura
  public rotationY = 0;

  private state: NPCBehaviorState = "IDLE";
  private interactionRadius = 2.8;
  private awarenessRadius = 5.0;
  private targetRotationY = 0;

  constructor(rig: AnimeCharacterRig) {
    this.rig = rig;
    this.animator = new CharacterAnimationController(rig);
    this.rig.root.position.copy(this.position);
    this.rig.root.rotation.y = this.rotationY;
  }

  public getState(): NPCBehaviorState {
    return this.state;
  }

  public setState(newState: NPCBehaviorState) {
    this.state = newState;
    switch (newState) {
      case "IDLE":
        this.animator.setState("idle");
        break;
      case "AWARE":
        this.animator.setState("wave");
        break;
      case "TALKING":
        this.animator.setState("talk");
        break;
      case "WALKING":
        this.animator.setState("walk");
        break;
      case "SITTING":
        this.animator.setState("sit");
        break;
      case "CONFESSION":
        this.animator.setState("confession");
        break;
    }
  }

  public setEmotion(emotion: string) {
    if (emotion === "blushing") {
      this.animator.setBlush(true);
    } else {
      // High affection naturally keeps a subtle warm blush
      this.animator.setBlush(relationshipSystem.getAffection() >= 65);
    }

    if (emotion === "surprised" || emotion === "happy") {
      this.animator.setState("talk");
    }
  }

  public isPlayerInInteractionRange(playerPos: THREE.Vector3): boolean {
    const dist = this.position.distanceTo(playerPos);
    return dist <= this.interactionRadius;
  }

  public lookAt(target: THREE.Vector3, immediate: boolean = true) {
    const dir = target.clone().sub(this.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.targetRotationY = Math.atan2(dir.x, dir.z);
      if (immediate) {
        this.rotationY = this.targetRotationY;
        this.rig.root.rotation.y = this.rotationY;
      }
    }
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.rig.root.position.copy(this.position);
  }

  public update(delta: number, playerPos: THREE.Vector3, isDialogueActive: boolean) {
    const distToPlayer = this.position.distanceTo(playerPos);

    if (isDialogueActive) {
      this.setState("TALKING");
      this.lookAt(playerPos);
    } else if (distToPlayer <= this.interactionRadius) {
      this.setState("AWARE");
      this.lookAt(playerPos);
    } else if (distToPlayer <= this.awarenessRadius) {
      this.setState("IDLE");
      this.lookAt(playerPos);
    } else {
      this.setState("IDLE");
      this.targetRotationY = 0; // Look back towards the sakura tree & plaza
    }

    // Smooth rotation towards target angle
    let diff = this.targetRotationY - this.rotationY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.rotationY += diff * Math.min(1.0, delta * 6.0);
    this.rig.root.rotation.y = this.rotationY;

    // Check affection for natural blushing
    if (relationshipSystem.getAffection() >= 65) {
      this.animator.setBlush(true);
    }

    // Update animation kinematic rigs
    this.animator.update(delta, 0);
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