/**
 * CharacterAnimationController.ts
 * Procedural bone & joint animation controller for anime characters.
 * Implements fluid idle, walk, sprint, speech gestures, blushing, waving, and sitting.
 */

import * as THREE from "three";
import { AnimeCharacterRig } from "./AnimeModelFactory";

export type AnimationState = "idle" | "walk" | "run" | "talk" | "blush" | "wave" | "sit" | "turn" | "confession";

export class CharacterAnimationController {
  private rig: AnimeCharacterRig;
  private state: AnimationState = "idle";
  private animTime = 0;
  private blinkTimer = 0;
  private isBlinking = false;
  private currentBlushAlpha = 0;
  private targetBlushAlpha = 0;
  private currentAction: THREE.AnimationAction | null = null;
  private currentActionName = "";

  // Head look-at target (e.g. for looking at player or NPC during conversation)
  public lookAtTarget: THREE.Vector3 | null = null;

  constructor(rig: AnimeCharacterRig) {
    this.rig = rig;
    if (this.rig.gltfActions && this.rig.gltfActions["Idle"]) {
      this.currentAction = this.rig.gltfActions["Idle"];
      this.currentActionName = "Idle";
      this.currentAction.play();
    }
  }

  public setState(newState: AnimationState) {
    if (this.state !== newState) {
      this.state = newState;
    }
  }

  public getState(): AnimationState {
    return this.state;
  }

  public setBlush(enabled: boolean) {
    this.targetBlushAlpha = enabled ? 0.75 : 0.0;
  }

  public update(delta: number, movementSpeed = 0) {
    this.animTime += delta;

    // If GLTF mixer is present, drive model animation clips
    if (this.rig.gltfMixer) {
      this.updateGLTFAnimation(movementSpeed);
      this.rig.gltfMixer.update(delta);
      return;
    }

    // Smooth blush transition
    this.currentBlushAlpha = THREE.MathUtils.lerp(this.currentBlushAlpha, this.targetBlushAlpha, delta * 5);
    for (const blush of this.rig.blushMeshes) {
      (blush.material as THREE.MeshBasicMaterial).opacity = this.currentBlushAlpha;
    }

    // Eye blinking logic
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.5 + Math.sin(this.animTime * 0.5) * 1.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.7) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }
    const eyeScaleY = this.isBlinking ? 0.1 : 1.0;
    for (const eye of this.rig.eyeMeshes) {
      eye.scale.y = eyeScaleY;
    }

    // Determine motion state from movement speed if not in special state
    if (this.state !== "talk" && this.state !== "wave" && this.state !== "sit") {
      if (movementSpeed > 4.5) {
        this.state = "run";
      } else if (movementSpeed > 0.1) {
        this.state = "walk";
      } else {
        this.state = "idle";
      }
    }

    const { bones } = this.rig;

    // Reset base rotations
    bones.hips.position.y = 0.95;
    bones.hips.rotation.set(0, 0, 0);
    bones.spine.rotation.set(0, 0, 0);
    bones.chest.rotation.set(0, 0, 0);
    bones.neck.rotation.set(0, 0, 0);
    bones.head.rotation.set(0, 0, 0);

    bones.leftUpperArm.rotation.set(0, 0, 0);
    bones.leftForearm.rotation.set(0, 0, 0);
    bones.rightUpperArm.rotation.set(0, 0, 0);
    bones.rightForearm.rotation.set(0, 0, 0);

    bones.leftUpperLeg.rotation.set(0, 0, 0);
    bones.leftLowerLeg.rotation.set(0, 0, 0);
    bones.rightUpperLeg.rotation.set(0, 0, 0);
    bones.rightLowerLeg.rotation.set(0, 0, 0);

    // Apply animation kinematics based on state
    switch (this.state) {
      case "idle":
        this.applyIdle(delta);
        break;
      case "walk":
        this.applyWalk(delta, 1.0);
        break;
      case "run":
        this.applyWalk(delta, 1.8);
        break;
      case "talk":
        this.applyTalk(delta);
        break;
      case "wave":
        this.applyWave(delta);
        break;
      case "sit":
        this.applySit(delta);
        break;
    }

    // Dynamic Hair Sway
    if (bones.hairPony) {
      const hairSway = Math.sin(this.animTime * 3) * 0.15;
      bones.hairPony.rotation.z = hairSway;
      bones.hairPony.rotation.x = 0.25 + Math.abs(Math.sin(this.animTime * 2)) * 0.1;
    }

    // Optional VRM update
    if (this.rig.vrm) {
      this.rig.vrm.update(delta);
    }
  }

  // --- Animation States Kinematics ---

  private applyIdle(_delta: number) {
    const { bones } = this.rig;
    const t = this.animTime * 2.2;

    // Gentle breathing: chest expands and lifts slightly
    const breath = Math.sin(t);
    bones.chest.rotation.x = breath * 0.035;
    bones.spine.rotation.x = breath * 0.02;

    // Subtle natural weight shift
    const sway = Math.sin(t * 0.5);
    bones.hips.rotation.z = sway * 0.02;
    bones.head.rotation.z = -sway * 0.025;

    // Arms resting naturally at sides
    bones.leftUpperArm.rotation.z = 0.15 + breath * 0.02;
    bones.leftUpperArm.rotation.x = 0.05;
    bones.rightUpperArm.rotation.z = -0.15 - breath * 0.02;
    bones.rightUpperArm.rotation.x = 0.05;

    bones.leftForearm.rotation.x = -0.2;
    bones.rightForearm.rotation.x = -0.2;
  }

  private applyWalk(_delta: number, speedMultiplier = 1.0) {
    const { bones } = this.rig;
    const strideFreq = 7.0 * speedMultiplier;
    const t = this.animTime * strideFreq;

    const legAmplitude = 0.65 * (speedMultiplier > 1.2 ? 1.25 : 1.0);
    const armAmplitude = 0.55 * (speedMultiplier > 1.2 ? 1.3 : 1.0);

    // Alternating leg stride
    const leftLegAngle = Math.sin(t) * legAmplitude;
    const rightLegAngle = -Math.sin(t) * legAmplitude;

    bones.leftUpperLeg.rotation.x = leftLegAngle;
    bones.rightUpperLeg.rotation.x = rightLegAngle;

    // Knee bending on backswing
    bones.leftLowerLeg.rotation.x = Math.max(0, -Math.sin(t + 0.3) * 0.9);
    bones.rightLowerLeg.rotation.x = Math.max(0, Math.sin(t + 0.3) * 0.9);

    // Opposite arm swing
    bones.leftUpperArm.rotation.x = -leftLegAngle * armAmplitude;
    bones.rightUpperArm.rotation.x = -rightLegAngle * armAmplitude;

    bones.leftForearm.rotation.x = -0.35 + (speedMultiplier > 1.2 ? -0.4 : 0);
    bones.rightForearm.rotation.x = -0.35 + (speedMultiplier > 1.2 ? -0.4 : 0);

    // Vertical hip bounce (two bounces per full stride cycle)
    const bounce = Math.abs(Math.sin(t)) * 0.06;
    bones.hips.position.y = 0.95 - bounce;

    // Slight forward lean when running
    if (speedMultiplier > 1.2) {
      bones.spine.rotation.x = 0.22;
      bones.chest.rotation.x = 0.15;
    } else {
      bones.spine.rotation.x = 0.06;
    }
  }

  private applyTalk(_delta: number) {
    const { bones } = this.rig;
    const t = this.animTime * 3.0;

    // Expressive subtle head nod
    const nod = Math.sin(t) * 0.08;
    bones.head.rotation.x = nod;
    bones.head.rotation.y = Math.sin(t * 0.5) * 0.06;

    // Gesturing with right hand, left hand relaxed
    bones.rightUpperArm.rotation.x = -0.5 + Math.sin(t * 0.8) * 0.2;
    bones.rightUpperArm.rotation.z = -0.35;
    bones.rightForearm.rotation.x = -0.8 + Math.cos(t) * 0.25;

    bones.leftUpperArm.rotation.x = -0.2;
    bones.leftUpperArm.rotation.z = 0.2;
    bones.leftForearm.rotation.x = -0.3;
  }

  private applyWave(_delta: number) {
    const { bones } = this.rig;
    const t = this.animTime * 6.0;

    // Raise right arm up and wave back and forth
    bones.rightUpperArm.rotation.z = -1.8;
    bones.rightUpperArm.rotation.x = -0.3;
    bones.rightForearm.rotation.z = Math.sin(t) * 0.45 - 0.2;
    bones.rightForearm.rotation.x = -0.3;

    bones.head.rotation.z = -0.1;
    bones.head.rotation.x = 0.05;
  }

  private applySit(_delta: number) {
    const { bones } = this.rig;
    // Lower hips to bench height (~0.52m)
    bones.hips.position.y = 0.52;
    bones.hips.position.z = -0.1;

    // Upper legs 90 deg forward
    bones.leftUpperLeg.rotation.x = -Math.PI / 2 + 0.1;
    bones.rightUpperLeg.rotation.x = -Math.PI / 2 + 0.1;

    // Lower legs 90 deg down
    bones.leftLowerLeg.rotation.x = Math.PI / 2 - 0.1;
    bones.rightLowerLeg.rotation.x = Math.PI / 2 - 0.1;

    // Hands resting gently on lap
    bones.leftUpperArm.rotation.x = -0.4;
    bones.leftUpperArm.rotation.z = 0.15;
    bones.leftForearm.rotation.x = -0.7;

    bones.rightUpperArm.rotation.x = -0.4;
    bones.rightUpperArm.rotation.z = -0.15;
    bones.rightForearm.rotation.x = -0.7;

    // Gentle breathing
    const breath = Math.sin(this.animTime * 2);
    bones.chest.rotation.x = breath * 0.03;
  }

  private updateGLTFAnimation(movementSpeed: number) {
    if (!this.rig.gltfActions) return;

    let targetAction = "Idle";

    if (this.state === "confession" && this.rig.gltfActions["Confession"]) {
      targetAction = "Confession";
    } else if (this.state === "wave" && this.rig.gltfActions["Wave"]) {
      targetAction = "Wave";
    } else if (this.state === "turn" && this.rig.gltfActions["Turn"]) {
      targetAction = "Turn";
    } else if (this.state === "talk" && this.rig.gltfActions["Talk"]) {
      targetAction = "Talk";
    } else if ((this.state === "walk" || this.state === "run" || movementSpeed > 0.1) && this.rig.gltfActions["Walk"]) {
      targetAction = "Walk";
    } else if (this.rig.gltfActions["Idle"]) {
      targetAction = "Idle";
    }

    if (targetAction !== this.currentActionName) {
      const nextAction = this.rig.gltfActions[targetAction];
      if (nextAction) {
        const fadeDuration = 0.25;
        nextAction.reset();
        if (targetAction === "Walk" && (this.state === "run" || movementSpeed > 4.5)) {
          nextAction.timeScale = 1.6;
        } else {
          nextAction.timeScale = 1.0;
        }
        nextAction.fadeIn(fadeDuration).play();

        if (this.currentAction && this.currentAction !== nextAction) {
          this.currentAction.fadeOut(fadeDuration);
        }
        this.currentAction = nextAction;
        this.currentActionName = targetAction;
      }
    } else if (this.currentActionName === "Walk") {
      if (this.state === "run" || movementSpeed > 4.5) {
        this.currentAction!.timeScale = 1.6;
      } else {
        this.currentAction!.timeScale = 1.0;
      }
    }
  }

}