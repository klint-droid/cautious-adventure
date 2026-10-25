/**
 * RelationshipSystem.ts
 * Manages romantic courtship progress, affection, trust, memory traits,
 * unlocked date activities, and relationship stage transitions.
 */

export type RelationshipStage =
  | "Stranger"
  | "Acquaintance"
  | "Friend"
  | "Close Connection"
  | "Romantic Interest";

export interface MemoryJournal {
  favoriteDrink?: string;
  hobby?: string;
  favoriteSeason?: string;
  dream?: string;
  favoriteSpot?: string;
  firstMeetingImpression?: string;
  giftGiven?: boolean;
}

export interface ActivityMilestone {
  id: string;
  title: string;
  description: string;
  location: string;
  requiredAffection: number;
  completed: boolean;
  icon: string;
}

export interface SaveData {
  affection: number;
  trust: number;
  memory: MemoryJournal;
  discussedTopicIds: string[];
  completedActivityIds: string[];
  playerPosition?: { x: number; y: number; z: number };
  playerRotationY?: number;
  currentObjective: string;
  timestamp: number;
}

export class RelationshipSystem {
  private affection = 0; // 0 to 100
  private trust = 0;     // 0 to 100
  private memory: MemoryJournal = {};
  private discussedTopicIds: Set<string> = new Set();
  private completedActivityIds: Set<string> = new Set();
  private currentObjective = "Go to Klint under the Great Sakura Tree — he has something to ask you, Cyril!";

  private onChangeCallbacks: Array<() => void> = [];

  public readonly activities: ActivityMilestone[] = [
    {
      id: "meet_ren",
      title: "A Serendipitous Encounter",
      description: "Walk up to Klint under the Great Sakura Tree.",
      location: "Central Sakura Plaza",
      requiredAffection: 0,
      completed: false,
      icon: "🌸",
    },
    {
      id: "cafe_date",
      title: "Afternoon at Café Sakura",
      description: "Spend a romantic café date with Klint sharing warm drinks and sweet treats.",
      location: "Café Sakura",
      requiredAffection: 25,
      completed: false,
      icon: "☕",
    },
    {
      id: "lakeside_walk",
      title: "Lakeside Stroll",
      description: "Walk together with Klint along the wooden boardwalk by the water's edge.",
      location: "Mirror Lake Path",
      requiredAffection: 45,
      completed: false,
      icon: "🌿",
    },
    {
      id: "bench_heart_to_heart",
      title: "Shaded Conversation",
      description: "Sit with Klint on a secluded garden bench and share your private dreams.",
      location: "Hilltop Viewpoint",
      requiredAffection: 65,
      completed: false,
      icon: "📖",
    },
    {
      id: "pier_sunset_confession",
      title: "Sunset at the Pier",
      description: "Meet Klint at the end of the wooden pier as golden hour bathes the park in light.",
      location: "Lake Pier Gazebo",
      requiredAffection: 85,
      completed: false,
      icon: "🌅",
    },
  ];

  constructor() {
    this.loadFromStorage();
  }

  public getAffection(): number {
    return this.affection;
  }

  public getTrust(): number {
    return this.trust;
  }

  public getMemory(): Readonly<MemoryJournal> {
    return this.memory;
  }

  public getCurrentObjective(): string {
    return this.currentObjective;
  }

  public setObjective(obj: string) {
    this.currentObjective = obj;
    this.notify();
  }

  public getStage(): RelationshipStage {
    if (this.affection >= 85) return "Romantic Interest";
    if (this.affection >= 65) return "Close Connection";
    if (this.affection >= 40) return "Friend";
    if (this.affection >= 20) return "Acquaintance";
    return "Stranger";
  }

  public getStageDescription(): string {
    const stage = this.getStage();
    switch (stage) {
      case "Stranger":
        return "Klint is slightly shy but his gaze is filled with wonder whenever he looks at Cyril.";
      case "Acquaintance":
        return "Klint smiles warmly when he sees Cyril and is excited about courting you.";
      case "Friend":
        return "Klint looks forward to courting Cyril, freely shares his sketches, and loves your company.";
      case "Close Connection":
        return "Klint blushes when your shoulders brush, confiding his secret hopes and dreams to Cyril.";
      case "Romantic Interest":
        return "Klint's eyes light up completely around Cyril. You hold a cherished, irreplaceable place in his heart.";
    }
  }

  public modifyAffection(delta: number): { oldVal: number; newVal: number; delta: number; stageChanged: boolean } {
    const oldVal = this.affection;
    const oldStage = this.getStage();
    this.affection = Math.max(0, Math.min(100, this.affection + delta));
    const newStage = this.getStage();
    const stageChanged = oldStage !== newStage;

    this.checkMilestoneUnlocks();
    this.notify();
    this.saveToStorage();

    return { oldVal, newVal: this.affection, delta, stageChanged };
  }

  public modifyTrust(delta: number) {
    this.trust = Math.max(0, Math.min(100, this.trust + delta));
    this.notify();
    this.saveToStorage();
  }

  public remember<K extends keyof MemoryJournal>(key: K, value: MemoryJournal[K]) {
    this.memory[key] = value;
    this.notify();
    this.saveToStorage();
  }

  public markTopicDiscussed(topicId: string) {
    this.discussedTopicIds.add(topicId);
    this.saveToStorage();
  }

  public isTopicDiscussed(topicId: string): boolean {
    return this.discussedTopicIds.has(topicId);
  }

  public completeActivity(activityId: string) {
    this.completedActivityIds.add(activityId);
    const act = this.activities.find((a) => a.id === activityId);
    if (act) {
      act.completed = true;
    }
    this.updateNextObjective();
    this.notify();
    this.saveToStorage();
  }

  public isActivityCompleted(activityId: string): boolean {
    return this.completedActivityIds.has(activityId);
  }

  public isActivityUnlocked(activityId: string): boolean {
    const act = this.activities.find((a) => a.id === activityId);
    if (!act) return false;
    return this.affection >= act.requiredAffection;
  }

  private checkMilestoneUnlocks() {
    this.updateNextObjective();
  }

  private updateNextObjective() {
    for (const act of this.activities) {
      if (!this.completedActivityIds.has(act.id)) {
        if (this.affection >= act.requiredAffection) {
          this.currentObjective = `Activity Ready: ${act.title} at ${act.location}!`;
        } else {
          this.currentObjective = `Deepen bond with Ren (${this.affection}/${act.requiredAffection} Affection) to unlock: ${act.title}.`;
        }
        return;
      }
    }
    this.currentObjective = "You and Klint share a pure, romantic bond. Enjoy peaceful moments together in the park.";
  }

  // --- Observation & Persistence ---
  public onChange(callback: () => void) {
    this.onChangeCallbacks.push(callback);
  }

  private notify() {
    for (const cb of this.onChangeCallbacks) {
      cb();
    }
  }

  public saveToStorage(playerPos?: { x: number; y: number; z: number }, playerRotY?: number): boolean {
    try {
      const data: SaveData = {
        affection: this.affection,
        trust: this.trust,
        memory: this.memory,
        discussedTopicIds: Array.from(this.discussedTopicIds),
        completedActivityIds: Array.from(this.completedActivityIds),
        playerPosition: playerPos,
        playerRotationY: playerRotY,
        currentObjective: this.currentObjective,
        timestamp: Date.now(),
      };
      localStorage.setItem("sakura_moments_save", JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Failed to save progress to localStorage", e);
      return false;
    }
  }

  public loadFromStorage(): SaveData | null {
    try {
      const raw = localStorage.getItem("sakura_moments_save");
      if (!raw) return null;
      const data: SaveData = JSON.parse(raw);

      this.affection = data.affection ?? 0;
      this.trust = data.trust ?? 0;
      this.memory = data.memory ?? {};
      this.discussedTopicIds = new Set(data.discussedTopicIds ?? []);
      this.completedActivityIds = new Set(data.completedActivityIds ?? []);
      if (data.currentObjective) this.currentObjective = data.currentObjective;

      // Update activity milestones
      for (const act of this.activities) {
        act.completed = this.completedActivityIds.has(act.id);
      }

      this.notify();
      return data;
    } catch (e) {
      console.warn("Failed to parse saved game data", e);
      return null;
    }
  }

  public resetProgress() {
    this.affection = 0;
    this.trust = 0;
    this.memory = {};
    this.discussedTopicIds.clear();
    this.completedActivityIds.clear();
    this.currentObjective = "Go to Klint under the Great Sakura Tree — he has something to ask you, Cyril!";
    for (const act of this.activities) {
      act.completed = false;
    }
    localStorage.removeItem("sakura_moments_save");
    this.notify();
  }
}

export const relationshipSystem = new RelationshipSystem();
