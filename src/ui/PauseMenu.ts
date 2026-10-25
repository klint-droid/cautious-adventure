/**
 * PauseMenu.ts
 * Pause and settings modal with save/load, volume sliders,
 * graphics quality toggles, and keyboard controls reference.
 */

import { soundManager } from "../audio/SoundManager";
import { relationshipSystem } from "../dialogue/RelationshipSystem";
import { notificationSystem } from "./NotificationSystem";

export interface PauseMenuHandlers {
  onResume?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onReset?: () => void;
  onToggleShadows?: (enabled: boolean) => void;
}

export class PauseMenu {
  private container: HTMLElement;
  private isVisible = false;
  private handlers: PauseMenuHandlers = {};

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "pause-menu";
    this.container.className = "modal-overlay hidden";

    this.container.innerHTML = `
      <div class="modal-card pause-card">
        <div class="modal-header">
          <h2>🌸 Sakura Moments — Game Menu</h2>
          <button class="modal-close-btn" id="pause-close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="pause-actions-grid">
            <button class="menu-action-btn primary" id="btn-resume">▶ Resume Game</button>
            <button class="menu-action-btn" id="btn-save">💾 Save Game</button>
            <button class="menu-action-btn" id="btn-load">📂 Load Game</button>
            <button class="menu-action-btn danger" id="btn-reset">↺ Reset Progress</button>
          </div>

          <!-- Audio Settings -->
          <div class="settings-group">
            <h4>🎵 Sound & Music</h4>
            <div class="setting-row">
              <label>Master Volume</label>
              <input type="range" id="slider-master" min="0" max="100" value="70" />
            </div>
            <div class="setting-row">
              <label>Romantic Piano BGM</label>
              <input type="range" id="slider-bgm" min="0" max="100" value="50" />
            </div>
            <div class="setting-row">
              <label>Sound Effects (SFX)</label>
              <input type="range" id="slider-sfx" min="0" max="100" value="80" />
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="controls-guide">
            <h4>🎮 Game Controls</h4>
            <div class="controls-grid">
              <div class="c-row"><kbd>W A S D</kbd> <span>Explore & Move</span></div>
              <div class="c-row"><kbd>Shift</kbd> <span>Sprint</span></div>
              <div class="c-row"><kbd>Right Click Drag</kbd> <span>Orbit Camera</span></div>
              <div class="c-row"><kbd>Mouse Wheel</kbd> <span>Zoom In / Out</span></div>
              <div class="c-row"><kbd>E</kbd> <span>Interact / Talk</span></div>
              <div class="c-row"><kbd>Esc</kbd> <span>Pause Menu</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.initEvents();
  }

  public setHandlers(handlers: PauseMenuHandlers) {
    this.handlers = handlers;
  }

  public show() {
    this.isVisible = true;
    this.container.classList.remove("hidden");
    soundManager.playUIClick();
  }

  public hide() {
    this.isVisible = false;
    this.container.classList.add("hidden");
    soundManager.playUIClick();
    if (this.handlers.onResume) {
      this.handlers.onResume();
    }
  }

  public toggle() {
    if (this.isVisible) this.hide();
    else this.show();
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  private initEvents() {
    document.getElementById("pause-close-btn")!.addEventListener("click", () => this.hide());
    document.getElementById("btn-resume")!.addEventListener("click", () => this.hide());

    document.getElementById("btn-save")!.addEventListener("click", () => {
      soundManager.playUIClick();
      if (this.handlers.onSave) {
        this.handlers.onSave();
      } else {
        relationshipSystem.saveToStorage();
        notificationSystem.show("Game progress saved to LocalStorage! 💾", "💾");
      }
    });

    document.getElementById("btn-load")!.addEventListener("click", () => {
      soundManager.playUIClick();
      if (this.handlers.onLoad) {
        this.handlers.onLoad();
      } else {
        const loaded = relationshipSystem.loadFromStorage();
        if (loaded) {
          notificationSystem.show("Progress successfully restored! 📂", "🌸");
          this.hide();
        } else {
          notificationSystem.show("No saved game found.", "⚠️");
        }
      }
    });

    document.getElementById("btn-reset")!.addEventListener("click", () => {
      soundManager.playUIClick();
      if (confirm("Are you sure you want to reset your courtship progress and memories with Klint?")) {
        relationshipSystem.resetProgress();
        notificationSystem.show("Progress reset to beginning.", "↺");
        if (this.handlers.onReset) this.handlers.onReset();
        this.hide();
      }
    });

    // Volume sliders
    const masterSlider = document.getElementById("slider-master") as HTMLInputElement;
    masterSlider.addEventListener("input", (e) => {
      soundManager.setMasterVolume(Number((e.target as HTMLInputElement).value) / 100);
    });

    const bgmSlider = document.getElementById("slider-bgm") as HTMLInputElement;
    bgmSlider.addEventListener("input", (e) => {
      soundManager.setBgmVolume(Number((e.target as HTMLInputElement).value) / 100);
    });

    const sfxSlider = document.getElementById("slider-sfx") as HTMLInputElement;
    sfxSlider.addEventListener("input", (e) => {
      soundManager.setSfxVolume(Number((e.target as HTMLInputElement).value) / 100);
    });
  }
}
