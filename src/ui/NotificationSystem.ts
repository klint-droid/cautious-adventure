/**
 * NotificationSystem.ts
 * Displays floating toast notifications for affection increases,
 * milestone unlocks, date alerts, and game saves with anime styling.
 */

export class NotificationSystem {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    document.body.appendChild(this.container);
  }

  public show(message: string, icon = "🌸", durationMs = 3800) {
    const toast = document.createElement("div");
    toast.className = "anime-toast";

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
    `;

    this.container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 500);
    }, durationMs);
  }

  public showAffectionGain(delta: number) {
    this.show(`Affection +${delta} 💕`, "💖", 2600);
  }

  public showStageUnlocked(stageName: string) {
    this.show(`Relationship Reached: ${stageName}! 🌸`, "✨", 4500);
  }

  public showDateUnlocked(dateTitle: string) {
    this.show(`New Date Available: ${dateTitle}!`, "💌", 4500);
  }
}

export const notificationSystem = new NotificationSystem();
