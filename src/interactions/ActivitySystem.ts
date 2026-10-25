/**
 * ActivitySystem.ts
 * Coordinates date sequences, relocations to scenic park landmarks,
 * and cinematic mood adjustments.
 */

import * as THREE from "three";
import { PlayerController } from "../characters/PlayerController";
import { NPCController } from "../characters/NPCController";
import { CameraController } from "../game/CameraController";
import { dialogueManager } from "../dialogue/DialogueManager";
import { relationshipSystem } from "../dialogue/RelationshipSystem";

export class ActivitySystem {
  private player: PlayerController;
  private npc: NPCController;
  private cameraController: CameraController;

  constructor(player: PlayerController, npc: NPCController, cameraController: CameraController) {
    this.player = player;
    this.npc = npc;
    this.cameraController = cameraController;
  }

  public launchActivity(activityId: string) {
    switch (activityId) {
      case "cafe_date":
        this.setupCafeDate();
        break;
      case "lakeside_walk":
        this.setupLakesideWalk();
        break;
      case "bench_heart_to_heart":
        this.setupBenchDate();
        break;
      case "pier_sunset_confession":
        this.setupPierConfession();
        break;
    }
  }

  private setupCafeDate() {
    // Relocate to Café Sakura terrace table
    const tableX = -28.0;
    const tableZ = 25.0;

    this.player.setPosition(tableX + 0.9, 0, tableZ);
    this.npc.setPosition(tableX - 0.9, 0, tableZ);

    this.player.lookAt(this.npc.position);
    this.npc.lookAt(this.player.position);

    this.cameraController.setCinematicMode(true, this.player.position, this.npc.position);
    dialogueManager.goToNode("activity_cafe_scene");
  }

  private setupLakesideWalk() {
    // Relocate to Lake Boardwalk entrance
    this.player.setPosition(20.0, 0, -2.0);
    this.npc.setPosition(21.4, 0, -2.0);

    this.player.lookAt(new THREE.Vector3(20, 0, -15));
    this.npc.lookAt(this.player.position);

    this.cameraController.setCinematicMode(true, this.player.position, this.npc.position);
    dialogueManager.goToNode("activity_lake_scene");
  }

  private setupBenchDate() {
    // Relocate to Hilltop romantic bench
    this.player.setPosition(-15.4, 0, -17.6);
    this.npc.setPosition(-16.6, 0, -18.4);

    this.player.lookAt(new THREE.Vector3(0, 0, 0));
    this.npc.lookAt(this.player.position);

    this.cameraController.setCinematicMode(true, this.player.position, this.npc.position);
    dialogueManager.goToNode("activity_bench_scene");
  }

  private setupPierConfession() {
    // Relocate to Pier Gazebo terminus at sunset
    this.player.setPosition(20.0, 0, -28.5);
    this.npc.setPosition(20.0, 0, -30.0);

    this.player.lookAt(this.npc.position);
    this.npc.lookAt(this.player.position);

    this.cameraController.setCinematicMode(true, this.player.position, this.npc.position);
    dialogueManager.goToNode("activity_pier_scene");
  }
}
