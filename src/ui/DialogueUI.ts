/**
 * DialogueUI.ts
 * Interactive two-sided anime dialogue interface:
 * - Cyril's responses & choices are anchored on HER side (LEFT).
 * - Klint's dialogue bubble is anchored on HIS side (RIGHT).
 * - Smooth fade out transition after picking a choice.
 */

import { CharacterEmotion, DialogueNode } from "../dialogue/dialogueData";
import { dialogueManager } from "../dialogue/DialogueManager";
import { soundManager } from "../audio/SoundManager";

export class DialogueUI {
  private container: HTMLElement;
  private dialogueBar: HTMLElement;
  private speakerEl: HTMLElement;
  private textEl: HTMLElement;
  private optionsContainer: HTMLElement;
  private optionsList: HTMLElement;
  private continuePrompt: HTMLElement;

  private isTyping = false;
  private isPickingChoice = false;
  private fullText = "";
  private currentChars = 0;
  private typewriterInterval: number | null = null;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "dialogue-ui";
    this.container.className = "hidden";

    this.container.innerHTML = `
      <!-- Cyril's Response Panel on HER side (LEFT) -->
      <div class="cyril-options-panel hidden" id="cyril-options-panel">
        <div class="cyril-speaker-badge">
          <span class="cyril-flower">🌸</span>
          <span id="cyril-panel-title">Cyril's Response</span>
        </div>
        <div class="cyril-options-list" id="cyril-options-list"></div>
      </div>

      <!-- Klint's Dialogue Bubble on HIS side (RIGHT) -->
      <div class="klint-dialogue-bar" id="klint-dialogue-bar">
        <div class="klint-speaker-badge" id="dialogue-speaker-badge">
          <span class="klint-diamond" id="dialogue-speaker-icon">✦</span>
          <span id="dialogue-speaker">Klint</span>
        </div>
        <div class="klint-speech-box" id="dialogue-speech-box">
          <p class="klint-text" id="dialogue-text"></p>
          <div class="klint-continue" id="dialogue-continue" title="Click to advance">✦</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.dialogueBar = document.getElementById("klint-dialogue-bar")!;
    this.speakerEl = document.getElementById("dialogue-speaker")!;
    this.textEl = document.getElementById("dialogue-text")!;
    this.optionsContainer = document.getElementById("cyril-options-panel")!;
    this.optionsList = document.getElementById("cyril-options-list")!;
    this.continuePrompt = document.getElementById("dialogue-continue")!;

    // Clicking anywhere on the dialogue bar finishes typing instantly or advances
    this.dialogueBar.addEventListener("click", () => {
      if (this.isTyping) {
        this.finishTypewriter();
      } else if (!this.hasAvailableOptions()) {
        dialogueManager.endDialogue();
      }
    });

    this.bindEvents();
  }

  private bindEvents() {
    dialogueManager.setHandlers({
      onNodeChanged: (node, renderedText) => {
        this.showNode(node, renderedText);
      },
      onEmotionChanged: () => {
        // Characters animate directly in 3D scene
      },
      onDialogueEnd: () => {
        this.hide();
      },
    });
  }

  public showNode(node: DialogueNode, text: string) {
    this.container.classList.remove("hidden");
    this.speakerEl.textContent = node.speaker;

    // Subtle side alignment indicator for speaker
    const iconEl = document.getElementById("dialogue-speaker-icon");
    if (iconEl) {
      iconEl.textContent = node.speaker === "Cyril" ? "🌸" : "✦";
    }

    // Reset panel fade state
    this.optionsContainer.classList.add("hidden");
    this.optionsContainer.classList.remove("fading-out");
    this.dialogueBar.classList.remove("dialogue-fading");

    this.startTypewriter(text, () => {
      this.renderOptions();
    });
  }

  public hide() {
    this.container.classList.add("hidden");
    this.optionsList.innerHTML = "";
    this.optionsContainer.classList.add("hidden");
    if (this.typewriterInterval !== null) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
  }

  private hasAvailableOptions(): boolean {
    return dialogueManager.getAvailableOptions().length > 0;
  }

  private startTypewriter(text: string, onComplete: () => void) {
    if (this.typewriterInterval !== null) {
      clearInterval(this.typewriterInterval);
    }

    this.fullText = text;
    this.currentChars = 0;
    this.textEl.textContent = "";
    this.optionsList.innerHTML = "";
    this.optionsContainer.classList.add("hidden");
    this.continuePrompt.classList.add("hidden");
    this.isTyping = true;

    this.typewriterInterval = window.setInterval(() => {
      if (this.currentChars < this.fullText.length) {
        this.currentChars++;
        this.textEl.textContent = this.fullText.slice(0, this.currentChars);
        if (this.currentChars % 3 === 0) {
          soundManager.playDialogueVoice("ren");
        }
      } else {
        this.finishTypewriter();
        onComplete();
      }
    }, 22);
  }

  private finishTypewriter() {
    if (this.typewriterInterval !== null) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
    this.isTyping = false;
    this.textEl.textContent = this.fullText;
    this.renderOptions();
  }

  private renderOptions() {
    this.optionsList.innerHTML = "";
    const options = dialogueManager.getAvailableOptions();

    if (options.length === 0) {
      this.optionsContainer.classList.add("hidden");
      this.continuePrompt.classList.remove("hidden");
      this.continuePrompt.onclick = () => {
        dialogueManager.endDialogue();
      };
      return;
    }

    this.optionsContainer.classList.remove("hidden");
    this.optionsContainer.classList.remove("fading-out");
    this.continuePrompt.classList.add("hidden");

    options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "cyril-option-btn";

      // Heart indicator if option gives affection
      const heartIndicator = opt.affectionDelta ? `<span class="opt-heart">💕</span>` : "";

      btn.innerHTML = `
        <span class="cyril-btn-flower">🌸</span>
        <span class="cyril-btn-text">${opt.text}</span>
        ${heartIndicator}
      `;

      btn.addEventListener("mouseenter", () => {
        if (!this.isPickingChoice) soundManager.playUIHover();
      });

      // Interactive Fade Transition on Choice Pick
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.isPickingChoice) return;
        this.isPickingChoice = true;

        soundManager.playUIClick();

        // 1. Highlight chosen phrase on Cyril's side
        btn.classList.add("selected-choice");

        // 2. Fade out sibling choices immediately
        const allButtons = Array.from(this.optionsList.querySelectorAll(".cyril-option-btn"));
        allButtons.forEach((b) => {
          if (b !== btn) {
            (b as HTMLElement).classList.add("fade-sibling");
          }
        });

        // 3. Smoothly fade out Cyril's options panel and transition Klint's box
        setTimeout(() => {
          this.optionsContainer.classList.add("fading-out");
          this.dialogueBar.classList.add("dialogue-fading");
        }, 180);

        // 4. Advance dialogue node after smooth fade completes
        setTimeout(() => {
          this.optionsContainer.classList.add("hidden");
          this.optionsContainer.classList.remove("fading-out");
          this.dialogueBar.classList.remove("dialogue-fading");
          this.isPickingChoice = false;
          dialogueManager.selectOption(idx);
        }, 420);
      });

      this.optionsList.appendChild(btn);
    });
  }
}
