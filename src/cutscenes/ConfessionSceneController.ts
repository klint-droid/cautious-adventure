/**
 * ConfessionSceneController.ts
 * Dedicated State Machine for Klint's Courtship Confession Scene:
 * IDLE → INVITATION → SHORT_CONVERSATION → TRANSITION → WALK_TO_LAKE → BILLBOARD_REVEAL → CONFESSION → SCENE_COMPLETE
 *
 * Implements strict scripted sequence with zero AI dialogue, zero Cyril response options,
 * guided walking, romantic billboard reveal at Mirror Lake, and cinematic fade with title card.
 */

import * as THREE from "three";
import { PlayerController } from "../characters/PlayerController";
import { NPCController } from "../characters/NPCController";
import { CameraController } from "../game/CameraController";
import { RomanticBillboard } from "./RomanticBillboard";
import { dialogueManager } from "../dialogue/DialogueManager";
import { soundManager } from "../audio/SoundManager";
import { notificationSystem } from "../ui/NotificationSystem";

export type ConfessionSceneState =
  | "IDLE"
  | "INVITATION"
  | "SHORT_CONVERSATION"
  | "TRANSITION"
  | "WALK_TO_LAKE"
  | "BILLBOARD_REVEAL"
  | "CONFESSION"
  | "SCENE_COMPLETE";

export class ConfessionSceneController {
  private state: ConfessionSceneState = "IDLE";
  private player: PlayerController;
  private npc: NPCController;
  private cameraController: CameraController;
  private billboard: RomanticBillboard;

  // DOM Overlay Elements
  private fadeOverlay: HTMLElement;
  private titleCard: HTMLElement;

  // Walking Sequence Spline & Timing
  private walkCurve: THREE.CatmullRomCurve3;
  private curveLength = 0;
  private walkTime = 0;
  private walkDuration = 9.5; // ~9.5 seconds of romantic guided walk
  private footstepTimer = 0;

  // Reveal & Camera Timers
  private stageTimer = 0;
  private isSceneFinished = false;

  constructor(
    player: PlayerController,
    npc: NPCController,
    cameraController: CameraController,
    billboard: RomanticBillboard
  ) {
    this.player = player;
    this.npc = npc;
    this.cameraController = cameraController;
    this.billboard = billboard;

    // Create Walking Path Curve: Central Plaza (0, 0, 3.2) -> Mirror Lake Shore (20.0, 0, -4.8)
    this.walkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 3.2),
      new THREE.Vector3(6.5, 0, 1.4),
      new THREE.Vector3(12.5, 0, -1.2),
      new THREE.Vector3(16.8, 0, -3.2),
      new THREE.Vector3(20.0, 0, -4.8),
    ]);
    this.curveLength = this.walkCurve.getLength();

    // DOM Overlays for transition & title card
    this.fadeOverlay = this.createFadeOverlay();
    this.titleCard = this.createTitleCard();

    this.bindDialogueHook();
  }

  private createFadeOverlay(): HTMLElement {
    let el = document.getElementById("confession-fade-overlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "confession-fade-overlay";
      document.body.appendChild(el);
    }
    return el;
  }

  private createTitleCard(): HTMLElement {
    let el = document.getElementById("confession-title-card");
    if (!el) {
      el = document.createElement("div");
      el.id = "confession-title-card";
      el.innerHTML = `
        <div class="confession-title-emblem">🌸</div>
        <h1 class="confession-title-main">A Sincere Confession</h1>
        <div class="confession-title-divider">✦ ────── 🌸 ────── ✦</div>
        <p class="confession-title-sub">Under the Cherry Blossoms of Mirror Lake</p>
      `;
      document.body.appendChild(el);
    }
    return el;
  }

  private bindDialogueHook() {
    // Listen for dialogue end to advance scene states cleanly
    const originalEnd = dialogueManager.endDialogue.bind(dialogueManager);
    dialogueManager.endDialogue = () => {
      const activeNode = dialogueManager.getCurrentNode();
      originalEnd();

      if (this.state === "INVITATION" || this.state === "SHORT_CONVERSATION") {
        if (activeNode?.id === "confession_invite_6" || activeNode?.id === "end") {
          this.transitionToWalk();
        }
      } else if (this.state === "CONFESSION") {
        if (activeNode?.id === "confession_speech_4" || activeNode?.id === "end") {
          this.completeConfession();
        }
      }
    };
  }

  public getState(): ConfessionSceneState {
    return this.state;
  }

  public isCutsceneActive(): boolean {
    return this.state !== "IDLE" && !this.isSceneFinished;
  }

  public hasCompletedScene(): boolean {
    return this.isSceneFinished;
  }

  /**
   * STAGE ONE: Klint Invites Cyril
   * Cyril approaches Klint in the park; short introductory conversation begins.
   */
  public startScene() {
    if (this.isSceneFinished) return;
    this.state = "INVITATION";

    // Lock player input
    this.player.setMovementLocked(true);

    // Orient characters toward each other
    this.player.lookAt(this.npc.position);
    this.npc.lookAt(this.player.position);

    // Frame them in side-by-side Genshin-style cinematic camera
    this.cameraController.setCinematicMode(true, this.player.position, this.npc.position);

    // Launch Stage One scripted dialogue (6 lines, one at a time, no choices)
    dialogueManager.startDialogue("confession_invite_1");
  }

  /**
   * STAGE TWO: Transition to Guided Walk
   * Briefly fade the screen to establish change of scene, then guide characters to the lake.
   */
  private transitionToWalk() {
    this.state = "TRANSITION";
    this.stageTimer = 0;

    // 1. Smooth Screen Fade Dip
    this.fadeOverlay.classList.add("active");

    setTimeout(() => {
      // 2. Set characters at start of path
      this.state = "WALK_TO_LAKE";
      this.walkTime = 0;
      this.footstepTimer = 0;

      this.npc.setState("WALKING");
      this.player.animator.setState("walk");

      // 3. Fade screen back in
      setTimeout(() => {
        this.fadeOverlay.classList.remove("active");
      }, 350);
    }, 600);
  }

  /**
   * Update guided walk along the stone path toward Mirror Lake.
   */
  private updateWalk(delta: number) {
    this.walkTime += delta;
    const progress = Math.min(1.0, this.walkTime / this.walkDuration);

    // Klint's position along the CatmullRom spline
    const klintPos = this.walkCurve.getPointAt(progress);
    // Klint's forward look-at along the curve
    const lookAheadProgress = Math.min(1.0, progress + 0.04);
    const klintLookTarget = this.walkCurve.getPointAt(lookAheadProgress);

    this.npc.setPosition(klintPos.x, 0, klintPos.z);
    this.npc.lookAt(klintLookTarget);
    this.npc.animator.update(delta, 1.8);

    // Cyril follows Klint along the path at a natural trailing distance (~1.8m)
    const cyrilProgress = Math.max(0, progress - 0.09);
    const cyrilPos = this.walkCurve.getPointAt(cyrilProgress);
    const cyrilLookAhead = Math.min(1.0, cyrilProgress + 0.04);
    const cyrilLookTarget = this.walkCurve.getPointAt(cyrilLookAhead);

    this.player.setPosition(cyrilPos.x, 0, cyrilPos.z);
    this.player.lookAt(cyrilLookTarget);
    this.player.animator.update(delta, 1.8);

    // Rhythmic footstep sound effects
    this.footstepTimer += delta;
    if (this.footstepTimer >= 0.46) {
      this.footstepTimer = 0;
      soundManager.playFootstep("stone");
    }

    // Camera smoothly dollies alongside them in a cinematic tracking shot
    const midPoint = klintPos.clone().add(cyrilPos).multiplyScalar(0.5);
    const tangent = this.walkCurve.getTangentAt(progress).normalize();
    const sideVector = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Position camera slightly to the side and elevated, looking at the couple
    const camTargetPos = midPoint.clone().add(sideVector.clone().multiplyScalar(4.2)).add(new THREE.Vector3(0, 2.1, 0));
    const camLookAt = midPoint.clone().add(new THREE.Vector3(0, 1.35, 0));
    this.cameraController.setCustomCinematic(camTargetPos, camLookAt);

    // Arrival at Lake Destination
    if (progress >= 1.0) {
      this.arriveAtDestination();
    }
  }

  /**
   * STAGE THREE: Arrive and Reveal the Billboard
   * Both characters stop, orient toward the scenic lake, and the billboard fades in.
   */
  private arriveAtDestination() {
    this.state = "BILLBOARD_REVEAL";
    this.stageTimer = 0;

    // Settle character positions at scenic overlook
    this.npc.setPosition(20.0, 0, -4.8);
    this.player.setPosition(18.4, 0, -5.0);

    this.npc.setState("IDLE");
    this.player.animator.setState("idle");

    // Both look out across Mirror Lake towards the romantic billboard
    const lakeLookAt = new THREE.Vector3(22.0, 1.6, -11.5);
    this.npc.lookAt(lakeLookAt);
    this.player.lookAt(lakeLookAt);

    // Cinematic Camera Framing: Cyril (left), Klint (center-left), Billboard (prominently centered in lake overlook)
    const revealCamPos = new THREE.Vector3(15.2, 1.85, -2.4);
    const revealLookAt = new THREE.Vector3(20.5, 2.1, -9.8);
    this.cameraController.setCustomCinematic(revealCamPos, revealLookAt);

    // Smooth Billboard Reveal (fade-in & lighting)
    this.billboard.reveal(2.2);
  }

  /**
   * STAGE FOUR: Klint's Confession
   * After billboard is revealed, Klint turns toward Cyril and delivers his 4 scripted lines.
   */
  private startConfessionSpeech() {
    this.state = "CONFESSION";

    // Klint turns with gentle blush to Cyril
    this.npc.lookAt(this.player.position);
    this.npc.setEmotion("blushing");

    // Deliver all 4 scripted confession lines one at a time via dialogue system
    dialogueManager.startDialogue("confession_speech_1");
  }

  /**
   * STAGE FIVE: End the Scene
   * Hold shot briefly, fade to black, display "A Sincere Confession", and restore gameplay.
   */
  private completeConfession() {
    this.state = "SCENE_COMPLETE";
    this.stageTimer = 0;

    // 1. Hold shot briefly (1.6s)
    setTimeout(() => {
      // 2. Fade smoothly to black
      this.fadeOverlay.classList.add("active");

      setTimeout(() => {
        // 3. Display Title: "A Sincere Confession"
        this.titleCard.classList.add("active");

        setTimeout(() => {
          // 4. Fade title card and black overlay back to game
          this.titleCard.classList.remove("active");
          this.fadeOverlay.classList.remove("active");

          // 5. Restore gameplay
          this.restoreGameplay();
        }, 3200);
      }, 1100);
    }, 1600);
  }

  private restoreGameplay() {
    this.isSceneFinished = true;
    this.state = "IDLE";

    // Restore free player movement and orbital camera
    this.player.setMovementLocked(false);
    this.cameraController.setCinematicMode(false);

    // Toast notification of completed milestone
    notificationSystem.show("Klint's sincere confession has touched your heart... 🌸✨", "🌸");
  }

  /**
   * Main per-frame update loop called from Game.ts
   */
  public update(delta: number) {
    // 1. Update Billboard animation & particles
    this.billboard.update(delta);

    // 2. State Machine Logic
    switch (this.state) {
      case "WALK_TO_LAKE":
        this.updateWalk(delta);
        break;

      case "BILLBOARD_REVEAL":
        this.stageTimer += delta;
        // Hold reveal shot for 2.8 seconds so player takes in the surprise, then start confession
        if (this.stageTimer >= 2.8) {
          this.startConfessionSpeech();
        }
        break;

      case "CONFESSION":
        // Keep characters gently animated in idle/blushing state
        this.npc.animator.update(delta, 0);
        this.player.animator.update(delta, 0);
        break;

      case "SCENE_COMPLETE":
        this.npc.animator.update(delta, 0);
        this.player.animator.update(delta, 0);
        break;

      default:
        break;
    }
  }
}
