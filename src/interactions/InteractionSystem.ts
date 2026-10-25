/**
 * InteractionSystem.ts
 * Manages proximity detection for interactable objects in the world:
 * NPC Ren, Café counter, romantic benches, scenic pier overlook, and garden spots.
 */

import * as THREE from "three";
import { NPCController } from "../characters/NPCController";

export interface Interactable {
  id: string;
  name: string;
  position: THREE.Vector3;
  radius: number;
  promptText: string;
  action: () => void;
}

export class InteractionSystem {
  private interactables: Interactable[] = [];
  private currentTarget: Interactable | null = null;

  constructor() {}

  public register(interactable: Interactable) {
    this.interactables.push(interactable);
  }

  public registerNPC(npc: NPCController, onTalk: () => void) {
    this.interactables.push({
      id: "npc_klint",
      name: "Klint",
      position: npc.position,
      radius: 2.8,
      promptText: "Press [E] to talk with Klint",
      action: onTalk,
    });
  }

  public update(playerPos: THREE.Vector3): Interactable | null {
    let closest: Interactable | null = null;
    let closestDistSq = Infinity;

    for (const item of this.interactables) {
      const distSq = playerPos.distanceToSquared(item.position);
      if (distSq <= item.radius * item.radius) {
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closest = item;
        }
      }
    }

    this.currentTarget = closest;
    return closest;
  }

  public triggerCurrent() {
    if (this.currentTarget) {
      this.currentTarget.action();
    }
  }

  public getCurrentTarget(): Interactable | null {
    return this.currentTarget;
  }
}

export const interactionSystem = new InteractionSystem();
