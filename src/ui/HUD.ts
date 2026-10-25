/**
 * HUD.ts
 * Manages heads-up display overlay: floating interaction prompts,
 * top-right relationship status meter, objective banner, and controls legend.
 */

import { relationshipSystem } from "../dialogue/RelationshipSystem";
import { soundManager } from "../audio/SoundManager";

export class HUD {
  private container: HTMLElement;
  private promptEl: HTMLElement;

  private onPauseClickCallback: (() => void) | null = null;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "game-hud";

    this.container.innerHTML = `
      <!-- Floating World Interaction Prompt (Contextual) -->
      <div class="interaction-prompt hidden" id="hud-interaction-prompt">
        <span class="prompt-key">E</span>
        <span class="prompt-label" id="hud-prompt-text">Talk with Klint</span>
      </div>

      <!-- Minimal Bottom Controls Bar -->
      <div class="hud-controls-bar">
        <span class="control-item"><kbd>WASD</kbd> Move</span>
        <span class="control-item"><kbd>Shift</kbd> Sprint</span>
        <span class="control-item"><kbd>Right-Drag</kbd> Orbit Camera</span>
        <span class="control-item"><kbd>E</kbd> Interact</span>
        <span class="control-item clickable" id="hud-btn-menu" title="Open Menu"><kbd>Esc</kbd> Menu</span>
      </div>
    `;

    document.body.appendChild(this.container);

    this.promptEl = document.getElementById("hud-interaction-prompt")!;

    // Event listeners
    const menuBtn = document.getElementById("hud-btn-menu")!;
    menuBtn.addEventListener("click", () => {
      soundManager.playUIClick();
      if (this.onPauseClickCallback) this.onPauseClickCallback();
    });

    relationshipSystem.onChange(() => {
      this.updateStats();
    });
  }

  public onPauseClick(cb: () => void) {
    this.onPauseClickCallback = cb;
  }

  public setInteractionPrompt(visible: boolean, text = "") {
    if (visible) {
      this.promptEl.classList.remove("hidden");
      document.getElementById("hud-prompt-text")!.textContent = text;
    } else {
      this.promptEl.classList.add("hidden");
    }
  }

  public updateStats() {
    // Stats are displayed in the full Relationship & Memory Journal (press J)
  }
}
