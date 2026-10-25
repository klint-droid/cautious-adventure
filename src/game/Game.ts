/**
 * Game.ts
 * Core game loop and engine orchestration for Sakura Moments.
 * Integrates Three.js rendering, physics collisions, character controllers,
 * dialogue systems, date activities, audio, and UI overlays.
 */

import * as THREE from "three";
import { ParkBuilder } from "../world/ParkBuilder";
import { WeatherSystem } from "../world/WeatherSystem";
import { AnimeModelFactory } from "../characters/AnimeModelFactory";
import { PlayerController } from "../characters/PlayerController";
import { NPCController } from "../characters/NPCController";
import { CameraController } from "./CameraController";
import { InputController } from "./InputController";
import { interactionSystem } from "../interactions/InteractionSystem";
import { ActivitySystem } from "../interactions/ActivitySystem";
import { dialogueManager } from "../dialogue/DialogueManager";
import { relationshipSystem } from "../dialogue/RelationshipSystem";
import { soundManager } from "../audio/SoundManager";

// UI Components
import { HUD } from "../ui/HUD";
import { DialogueUI } from "../ui/DialogueUI";
import { PauseMenu } from "../ui/PauseMenu";
import { notificationSystem } from "../ui/NotificationSystem";

// Cutscenes
import { RomanticBillboard } from "../cutscenes/RomanticBillboard";
import { BannerPlane } from "../cutscenes/BannerPlane";
import { ConfessionSceneController } from "../cutscenes/ConfessionSceneController";

export class Game {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Systems & Builders
  private parkBuilder: ParkBuilder;
  private weatherSystem: WeatherSystem;
  private player: PlayerController;
  private npc: NPCController;
  private cameraController: CameraController;
  private input: InputController;
  private activitySystem: ActivitySystem;

  // UI
  private hud: HUD;
  private dialogueUI: DialogueUI;
  private pauseMenu: PauseMenu;

  // Cutscenes
  private romanticBillboard: RomanticBillboard;
  private bannerPlane: BannerPlane;
  private confessionSceneController: ConfessionSceneController;

  private isRunning = false;
  private audioInitialized = false;

  constructor(containerId = "canvas-container") {
    this.container = document.getElementById(containerId)!;
    this.clock = new THREE.Clock();

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    // Warm pastel distance haze
    this.scene.background = new THREE.Color(0xfdeef4);
    this.scene.fog = new THREE.FogExp2(0xfdeef4, 0.014);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 150);
    this.cameraController = new CameraController(this.camera);

    // 3. WebGLRenderer with Cel-Shaded Anime Tone Mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Golden-Hour Sunlight & Ambient Lighting
    this.initLighting();

    // 5. Input Controller
    this.input = new InputController();

    // 6. Build World, Plazas, Lake, and Café
    this.parkBuilder = new ParkBuilder();
    this.parkBuilder.buildWorld(this.scene);

    // 7. Atmospheric Weather (Falling Sakura Petals & Wind)
    this.weatherSystem = new WeatherSystem(this.scene);

    // 8. Build Anime Characters
    const factory = new AnimeModelFactory();
    const playerRig = factory.buildFemaleProtagonist();
    const npcRig = factory.buildMaleNPC();

    this.scene.add(playerRig.root);
    this.scene.add(npcRig.root);

    this.player = new PlayerController(playerRig);
    this.npc = new NPCController(npcRig);

    // Asynchronously load external GLTF models (Cyril.glb & Klint.glb)
    this.loadGLTFCharacters(factory);

    // 8b. Romantic Billboard overlooking Mirror Lake
    this.romanticBillboard = new RomanticBillboard();
    this.scene.add(this.romanticBillboard.group);

    // 8c. Skywriting Banner Airplane above Mirror Lake
    this.bannerPlane = new BannerPlane();
    this.scene.add(this.bannerPlane.group);

    // 8d. Confession Scene Controller State Machine
    this.confessionSceneController = new ConfessionSceneController(
      this.player,
      this.npc,
      this.cameraController,
      this.romanticBillboard,
      this.bannerPlane
    );

    // Glowing Golden Diamond Waypoint above Klint's head
    const waypointGeom = new THREE.OctahedronGeometry(0.24, 0);
    const waypointMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    this.klintWaypoint = new THREE.Mesh(waypointGeom, waypointMat);
    this.klintWaypoint.position.set(this.npc.position.x, 2.5, this.npc.position.z);
    this.scene.add(this.klintWaypoint);

    // 9. Date Activity System
    this.activitySystem = new ActivitySystem(this.player, this.npc, this.cameraController);

    // 10. UI Layers
    this.hud = new HUD();
    this.dialogueUI = new DialogueUI();
    this.pauseMenu = new PauseMenu();

    // 11. Register World Interactions
    this.initInteractions();

    // 12. Bind Events & Saved Game Restoration
    this.bindEvents();
    this.restoreSavedGame();

    // 13. Window Resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  private klintWaypoint: THREE.Mesh;
  private hasMetKlint = false;
  private waypointTime = 0;

  private initLighting() {
    // Hemisphere light: Golden Peach sky to Soft Grass Green ground
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x81c784, 1.4);
    this.scene.add(hemiLight);

    // Warm Directional Sunlight casting soft anime shadows
    const dirLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    dirLight.position.set(25, 35, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 85;
    const shadowD = 35;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Ambient fill light for soft shadows
    const ambLight = new THREE.AmbientLight(0xffebee, 0.6);
    this.scene.add(ambLight);
  }

  private initInteractions() {
    // 1. Male NPC Klint
    interactionSystem.registerNPC(this.npc, () => {
      this.startConversationWithKlint();
    });

    // 2. Café Sakura Counter
    interactionSystem.register({
      id: "cafe_counter",
      name: "Café Sakura Counter",
      position: new THREE.Vector3(-26.0, 0, 20.5),
      radius: 2.5,
      promptText: "Press [E] to browse Café Sakura specials",
      action: () => {
        soundManager.playUIClick();
        const drink = relationshipSystem.getMemory().favoriteDrink || "Sakura Matcha Latte";
        notificationSystem.show(`Barista: "Welcome! Today's freshly whisked special is ${drink}!" ☕`, "☕");
      },
    });

    // 3. Mirror Lake Pier Terminus
    interactionSystem.register({
      id: "pier_overlook",
      name: "Scenic Pier Gazebo",
      position: new THREE.Vector3(20.0, 0, -28.0),
      radius: 3.2,
      promptText: "Press [E] to gaze at the sunset reflection",
      action: () => {
        soundManager.playUIClick();
        notificationSystem.show("The golden sky reflects like liquid glass on Mirror Lake... 🌅", "✨");
      },
    });

    // 4. Shishi-odoshi Bamboo Fountain
    interactionSystem.register({
      id: "bamboo_fountain",
      name: "Bamboo Fountain",
      position: new THREE.Vector3(9.0, 0, 12.0),
      radius: 2.2,
      promptText: "Press [E] to listen to the water fountain",
      action: () => {
        soundManager.playUIClick();
        notificationSystem.show("Clack... The bamboo spout fills with water and tips rhythmically.", "🎋");
      },
    });
  }

  private bindEvents() {
    // Initialize audio on first user gesture
    const startAudioOnce = () => {
      if (!this.audioInitialized) {
        this.audioInitialized = true;
        soundManager.init();
      }
    };
    window.addEventListener("click", startAudioOnce, { once: true });
    window.addEventListener("keydown", startAudioOnce, { once: true });

    // Key 'E' interaction
    this.input.onInteract(() => {
      if (!dialogueManager.getIsActive() && !this.pauseMenu.getIsVisible() && !this.confessionSceneController.isCutsceneActive()) {
        interactionSystem.triggerCurrent();
      }
    });

    // Key 'Esc' Pause menu
    this.input.onPause(() => {
      if (dialogueManager.getIsActive()) {
        dialogueManager.endDialogue();
      } else if (!this.confessionSceneController.isCutsceneActive()) {
        this.pauseMenu.toggle();
      }
    });

    // HUD button callbacks
    this.hud.onPauseClick(() => {
      if (!this.confessionSceneController.isCutsceneActive()) {
        this.pauseMenu.toggle();
      }
    });

    // Pause menu save/load handlers
    this.pauseMenu.setHandlers({
      onSave: () => {
        const saved = relationshipSystem.saveToStorage(
          { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z },
          this.player.rotationY
        );
        if (saved) {
          notificationSystem.show("Game progress & memories saved! 💾", "💾");
        }
      },
      onLoad: () => {
        this.restoreSavedGame();
        notificationSystem.show("Saved game loaded! 📂", "🌸");
        this.pauseMenu.hide();
      },
      onReset: () => {
        this.player.setPosition(0, 0, 7.5);
        this.player.rotationY = Math.PI;
        this.npc.setPosition(0, 0, 3.2);
        this.hud.updateStats();
      },
    });

    // Dialogue system events
    dialogueManager.setHandlers({
      onNodeChanged: (node, renderedText) => {
        this.dialogueUI.showNode(node, renderedText);
      },
      onEmotionChanged: (emotion) => {
        this.npc.setEmotion(emotion);
      },
      onDialogueEnd: () => {
        this.dialogueUI.hide();
        if (!this.confessionSceneController.isCutsceneActive()) {
          this.player.setMovementLocked(false);
          this.cameraController.setCinematicMode(false);
        }
      },
      onAffectionGained: (delta, stageChanged, newStage) => {
        notificationSystem.showAffectionGain(delta);
        if (stageChanged) {
          notificationSystem.showStageUnlocked(newStage);
        }
        this.hud.updateStats();
      },
      onActivityTriggered: (activityId) => {
        const act = relationshipSystem.activities.find((a) => a.id === activityId);
        if (act) {
          notificationSystem.showDateUnlocked(act.title);
        }
      },
    });
  }

  private startConversationWithKlint() {
    this.klintWaypoint.visible = false;

    // If confession scene hasn't been played yet, start Klint's Courtship Confession Scene
    if (!this.confessionSceneController.hasCompletedScene()) {
      this.confessionSceneController.startScene();
    } else {
      this.player.setMovementLocked(true);
      // Orient both characters toward each other
      this.player.lookAt(this.npc.position);
      this.npc.lookAt(this.player.position);

      // Transition camera into cinematic side-by-side shot
      this.cameraController.setCinematicMode(true, this.player.position, this.npc.position);

      // Launch dialogue flow
      dialogueManager.startDialogue("hi_quick");
    }
  }

  private restoreSavedGame() {
    const saved = relationshipSystem.loadFromStorage();
    if (saved && saved.playerPosition) {
      this.player.setPosition(saved.playerPosition.x, saved.playerPosition.y, saved.playerPosition.z);
      if (saved.playerRotationY !== undefined) {
        this.player.rotationY = saved.playerRotationY;
      }
    }
    this.hud.updateStats();
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  private animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const isDialogueActive = dialogueManager.getIsActive();
    const isCutscene = this.confessionSceneController.isCutsceneActive();

    // 1. Weather & Falling Sakura Petals
    this.weatherSystem.update(delta);

    // 2. Lake Water Ripples
    this.parkBuilder.getLakeBuilder().updateWater(delta);

    // 3. Player Movement & Kinematics (locked during cutscene)
    if (!isCutscene) {
      this.player.update(delta, this.input, this.cameraController);
    }

    // 4. Male NPC Klint State Machine & Awareness (controlled by cutscene during scene)
    if (!isCutscene) {
      this.npc.update(delta, this.player.position, isDialogueActive);
    }

    // 5. Update Confession Scene Controller State Machine & Billboard
    this.confessionSceneController.update(delta);

    // Waypoint animation above Klint
    this.waypointTime += delta;
    if (this.klintWaypoint.visible && !isCutscene) {
      this.klintWaypoint.rotation.y += delta * 2.2;
      this.klintWaypoint.position.y = 2.45 + Math.sin(this.waypointTime * 3) * 0.12;
    }

    // Proactive flow: When Cyril walks up to Klint for the first time,
    // Klint automatically initiates the courtship conversation!
    if (!this.hasMetKlint && !isDialogueActive && !this.confessionSceneController.hasCompletedScene() && !isCutscene) {
      const distToKlint = this.player.position.distanceTo(this.npc.position);
      if (distToKlint <= 3.2) {
        this.hasMetKlint = true;
        this.startConversationWithKlint();
      }
    }

    // 6. Interaction Proximity Detection
    if (!isDialogueActive && !isCutscene) {
      const target = interactionSystem.update(this.player.position);
      if (target) {
        this.hud.setInteractionPrompt(true, target.promptText);
      } else {
        this.hud.setInteractionPrompt(false);
      }
    } else {
      this.hud.setInteractionPrompt(false);
    }

    // 6. Camera Orbit & Collision Protection
    this.cameraController.update(
      delta,
      this.player.position,
      this.input.mouseDeltaX,
      this.input.mouseDeltaY,
      this.input.mouseWheelDelta
    );
    this.input.resetDeltas();

    // 7. Render Frame
    this.renderer.render(this.scene, this.camera);
  };

  private async loadGLTFCharacters(factory: AnimeModelFactory) {
    try {
      const cyrilRig = await factory.loadGLTFCharacter("/assets/Cyril.glb", "female");
      if (cyrilRig) {
        this.player.replaceRig(cyrilRig, this.scene);
        console.info("Successfully loaded Cyril 3D model for player.");
      }
    } catch (e) {
      console.warn("Failed to load Cyril.glb, keeping procedural model:", e);
    }

    try {
      const klintRig = await factory.loadGLTFCharacter("/assets/Klint.glb", "male");
      if (klintRig) {
        this.npc.replaceRig(klintRig, this.scene);
        console.info("Successfully loaded Klint 3D model for NPC.");
      }
    } catch (e) {
      console.warn("Failed to load Klint.glb, keeping procedural model:", e);
    }
  }

}