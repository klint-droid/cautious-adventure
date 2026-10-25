/**
 * DialogueManager.ts
 * Manages active conversation state, node progression, choice evaluation,
 * and integration with RelationshipSystem and UI.
 */

import { soundManager } from "../audio/SoundManager";
import { DIALOGUE_NODES, DialogueNode, CharacterEmotion } from "./dialogueData";
import { relationshipSystem, RelationshipStage } from "./RelationshipSystem";

export interface DialogueEventHandlers {
  onNodeChanged?: (node: DialogueNode, renderedText: string) => void;
  onEmotionChanged?: (emotion: CharacterEmotion) => void;
  onDialogueEnd?: () => void;
  onAffectionGained?: (delta: number, stageChanged: boolean, newStage: RelationshipStage) => void;
  onActivityTriggered?: (activityId: string) => void;
}

export class DialogueManager {
  private currentNode: DialogueNode | null = null;
  private isActive = false;
  private handlers: DialogueEventHandlers = {};

  constructor() {}

  public setHandlers(handlers: DialogueEventHandlers) {
    this.handlers = handlers;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getCurrentNode(): DialogueNode | null {
    return this.currentNode;
  }

  public startDialogue(startNodeId: string = "intro_root") {
    // If we've already done the first meeting intro, resume from hub_main unless specified
    if (startNodeId === "intro_root" && relationshipSystem.isTopicDiscussed("intro_completed")) {
      startNodeId = "hub_main";
    }

    this.isActive = true;
    this.goToNode(startNodeId);
  }

  public goToNode(nodeId: string) {
    if (nodeId === "end") {
      this.endDialogue();
      return;
    }

    const node = DIALOGUE_NODES[nodeId];
    if (!node) {
      console.warn(`Dialogue node not found: ${nodeId}. Ending conversation.`);
      this.endDialogue();
      return;
    }

    this.currentNode = node;
    if (node.onEnter) {
      node.onEnter();
    }

    // Trigger activity if node specifies one
    if (node.triggerActivityId) {
      relationshipSystem.completeActivity(node.triggerActivityId);
      if (this.handlers.onActivityTriggered) {
        this.handlers.onActivityTriggered(node.triggerActivityId);
      }
    }

    if (
      nodeId.startsWith("yes_") ||
      nodeId.startsWith("no_") ||
      nodeId.startsWith("branch_")
    ) {
      relationshipSystem.markTopicDiscussed("intro_completed");
      relationshipSystem.completeActivity("meet_ren");
    }

    // Emotion
    if (this.handlers.onEmotionChanged) {
      this.handlers.onEmotionChanged(node.emotion);
    }

    // Play dialogue blip sound
    soundManager.playDialogueVoice("ren");

    // Text rendering
    const memory = relationshipSystem.getMemory();
    const stage = relationshipSystem.getStage();
    const renderedText = typeof node.text === "function" ? node.text(memory, stage) : node.text;

    if (this.handlers.onNodeChanged) {
      this.handlers.onNodeChanged(node, renderedText);
    }

    if (node.isEnd) {
      // Automatically end after player acknowledges
    }
  }

  public selectOption(index: number) {
    if (!this.currentNode || !this.currentNode.options) {
      this.endDialogue();
      return;
    }

    const availableOptions = this.getAvailableOptions();
    const opt = availableOptions[index];
    if (!opt) {
      this.endDialogue();
      return;
    }

    soundManager.playUIClick();

    // Remember choice
    if (opt.rememberKey && opt.rememberValue) {
      relationshipSystem.remember(opt.rememberKey, opt.rememberValue);
    }

    // Apply affection and trust
    if (opt.affectionDelta) {
      const res = relationshipSystem.modifyAffection(opt.affectionDelta);
      soundManager.playAffectionChime();
      if (this.handlers.onAffectionGained) {
        this.handlers.onAffectionGained(opt.affectionDelta, res.stageChanged, relationshipSystem.getStage());
      }
    }

    if (opt.trustDelta) {
      relationshipSystem.modifyTrust(opt.trustDelta);
    }

    // Navigate to next node
    this.goToNode(opt.nextNodeId);
  }

  public getAvailableOptions() {
    if (!this.currentNode || !this.currentNode.options) return [];
    const memory = relationshipSystem.getMemory();
    const aff = relationshipSystem.getAffection();
    const trust = relationshipSystem.getTrust();

    return this.currentNode.options.filter((opt) => {
      if (!opt.condition) return true;
      return opt.condition(aff, trust, memory);
    });
  }

  public endDialogue() {
    this.isActive = false;
    this.currentNode = null;
    if (this.handlers.onDialogueEnd) {
      this.handlers.onDialogueEnd();
    }
  }
}

export const dialogueManager = new DialogueManager();
