/**
 * RelationshipModal.ts
 * Relationship Profile & Memory Journal displaying Ren's feelings,
 * cherished memories, shared interests, and unlocked date activities.
 */

import { relationshipSystem } from "../dialogue/RelationshipSystem";
import { soundManager } from "../audio/SoundManager";

export class RelationshipModal {
  private container: HTMLElement;
  private isVisible = false;
  private onStartDateCallback: ((activityId: string) => void) | null = null;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "relationship-modal";
    this.container.className = "modal-overlay hidden";

    this.container.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2>🌸 Courtship & Memory Journal</h2>
          <button class="modal-close-btn" id="rel-modal-close">✕</button>
        </div>

        <div class="modal-body">
          <!-- Profile Card -->
          <div class="profile-section">
            <div class="profile-header">
              <div class="profile-badge">
                <span class="profile-icon">🎨</span>
              </div>
              <div class="profile-info">
                <h3>Klint</h3>
                <span class="stage-tag" id="modal-stage-badge">Stranger</span>
                <p class="profile-bio">An artistic, observant young man who comes to the park to sketch the cherry blossoms. He gathered his courage to ask to court Cyril, hoping to build a tender and lasting romance.</p>
              </div>
            </div>

            <!-- Stage Description -->
            <div class="stage-description-box" id="modal-stage-desc"></div>

            <!-- Stats Bar -->
            <div class="modal-meters-grid">
              <div class="modal-meter-card">
                <div class="m-label"><span>💖 Affection</span> <b id="modal-aff-val">0 / 100</b></div>
                <div class="m-bar"><div class="m-fill affection" id="modal-aff-fill" style="width: 0%"></div></div>
              </div>
              <div class="modal-meter-card">
                <div class="m-label"><span>⭐ Trust</span> <b id="modal-trust-val">0 / 100</b></div>
                <div class="m-bar"><div class="m-fill trust" id="modal-trust-fill" style="width: 0%"></div></div>
              </div>
            </div>
          </div>

          <!-- Klint's Memory Journal -->
          <div class="memory-section">
            <h4>📖 What Klint Remembers About Cyril</h4>
            <div class="memory-grid" id="modal-memory-grid">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Date Activities & Milestones -->
          <div class="activities-section">
            <h4>💌 Courtship Milestones & Dates</h4>
            <div class="activities-list" id="modal-activities-list">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    const closeBtn = document.getElementById("rel-modal-close")!;
    closeBtn.addEventListener("click", () => this.hide());

    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) this.hide();
    });
  }

  public onStartDate(cb: (actId: string) => void) {
    this.onStartDateCallback = cb;
  }

  public show() {
    this.isVisible = true;
    this.render();
    this.container.classList.remove("hidden");
    soundManager.playUIClick();
  }

  public hide() {
    this.isVisible = false;
    this.container.classList.add("hidden");
    soundManager.playUIClick();
  }

  public toggle() {
    if (this.isVisible) this.hide();
    else this.show();
  }

  public render() {
    const stage = relationshipSystem.getStage();
    const stageDesc = relationshipSystem.getStageDescription();
    const aff = relationshipSystem.getAffection();
    const trust = relationshipSystem.getTrust();
    const memory = relationshipSystem.getMemory();

    document.getElementById("modal-stage-badge")!.textContent = stage;
    document.getElementById("modal-stage-desc")!.textContent = `"${stageDesc}"`;
    document.getElementById("modal-aff-val")!.textContent = `${aff} / 100`;
    document.getElementById("modal-aff-fill")!.style.width = `${aff}%`;
    document.getElementById("modal-trust-val")!.textContent = `${trust} / 100`;
    document.getElementById("modal-trust-fill")!.style.width = `${trust}%`;

    // Render Memory traits
    const memGrid = document.getElementById("modal-memory-grid")!;
    memGrid.innerHTML = `
      <div class="memory-item">
        <span class="m-icon">☕</span>
        <div class="m-text">
          <small>Favorite Drink</small>
          <b>${memory.favoriteDrink ?? "Not yet discussed"}</b>
        </div>
      </div>
      <div class="memory-item">
        <span class="m-icon">🎨</span>
        <div class="m-text">
          <small>Creative Passion</small>
          <b>${memory.hobby ?? "Not yet discussed"}</b>
        </div>
      </div>
      <div class="memory-item">
        <span class="m-icon">✨</span>
        <div class="m-text">
          <small>Cherished Dream</small>
          <b>${memory.dream ?? "Not yet discussed"}</b>
        </div>
      </div>
      <div class="memory-item">
        <span class="m-icon">🌸</span>
        <div class="m-text">
          <small>Favorite Spot</small>
          <b>${memory.favoriteSpot ?? "Not yet discussed"}</b>
        </div>
      </div>
    `;

    // Render Activities & Dates
    const actList = document.getElementById("modal-activities-list")!;
    actList.innerHTML = "";

    relationshipSystem.activities.forEach((act) => {
      const isUnlocked = relationshipSystem.isActivityUnlocked(act.id);
      const isCompleted = relationshipSystem.isActivityCompleted(act.id);

      const item = document.createElement("div");
      item.className = `activity-card ${isCompleted ? "completed" : isUnlocked ? "unlocked" : "locked"}`;

      let actionMarkup = "";
      if (isCompleted) {
        actionMarkup = `<span class="status-tag completed">✓ Cherished Memory</span>`;
      } else if (isUnlocked) {
        actionMarkup = `<button class="start-date-btn" data-id="${act.id}">Start Date ▶</button>`;
      } else {
        actionMarkup = `<span class="status-tag locked">🔒 Unlocks at ${act.requiredAffection}% Affection</span>`;
      }

      item.innerHTML = `
        <div class="act-header">
          <span class="act-icon">${act.icon}</span>
          <div class="act-title-box">
            <b>${act.title}</b>
            <span class="act-loc">📍 ${act.location}</span>
          </div>
        </div>
        <p class="act-desc">${act.description}</p>
        <div class="act-footer">${actionMarkup}</div>
      `;

      actList.appendChild(item);
    });

    // Attach listeners for start date buttons
    actList.querySelectorAll(".start-date-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
        if (id && this.onStartDateCallback) {
          this.hide();
          this.onStartDateCallback(id);
        }
      });
    });
  }
}
