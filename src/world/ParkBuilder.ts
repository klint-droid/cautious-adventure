/**
 * ParkBuilder.ts
 * Builds the peaceful Japanese-inspired park: cobblestone plazas, winding paths,
 * Torii gate, stone lanterns (Toro), bamboo fountain (Shishi-odoshi),
 * romantic park benches, and scenic viewpoints.
 */

import * as THREE from "three";
import { FloraBuilder } from "./FloraBuilder";
import { CafeBuilder } from "./CafeBuilder";
import { LakeBuilder } from "./LakeBuilder";
import { collisionSystem } from "./CollisionSystem";
import { createToonGradientTexture } from "../characters/AnimeModelFactory";

export class ParkBuilder {
  private floraBuilder: FloraBuilder;
  private cafeBuilder: CafeBuilder;
  private lakeBuilder: LakeBuilder;
  private toonGradient: THREE.CanvasTexture;

  private grassMat: THREE.MeshToonMaterial;
  private pathMat: THREE.MeshToonMaterial;
  private plazaMat: THREE.MeshToonMaterial;
  private stoneMat: THREE.MeshToonMaterial;
  private woodMat: THREE.MeshToonMaterial;
  private toriiMat: THREE.MeshToonMaterial;
  private toriiBlackMat: THREE.MeshToonMaterial;

  constructor() {
    this.floraBuilder = new FloraBuilder();
    this.cafeBuilder = new CafeBuilder();
    this.lakeBuilder = new LakeBuilder();
    this.toonGradient = createToonGradientTexture();

    this.grassMat = new THREE.MeshToonMaterial({
      color: 0x81c784, // Vibrant, warm anime park green
      gradientMap: this.toonGradient,
    });

    this.pathMat = new THREE.MeshToonMaterial({
      color: 0xded8ce, // Warm sandstone pathway
      gradientMap: this.toonGradient,
    });

    this.plazaMat = new THREE.MeshToonMaterial({
      color: 0xefebe9, // Elegant cobblestone circle
      gradientMap: this.toonGradient,
    });

    this.stoneMat = new THREE.MeshToonMaterial({
      color: 0x78909c, // Weathered gray stone
      gradientMap: this.toonGradient,
    });

    this.woodMat = new THREE.MeshToonMaterial({
      color: 0x6d4c41,
      gradientMap: this.toonGradient,
    });

    this.toriiMat = new THREE.MeshToonMaterial({
      color: 0xd32f2f, // Vibrant vermilion
      gradientMap: this.toonGradient,
    });

    this.toriiBlackMat = new THREE.MeshToonMaterial({
      color: 0x212121,
      gradientMap: this.toonGradient,
    });
  }

  public getLakeBuilder(): LakeBuilder {
    return this.lakeBuilder;
  }

  public buildWorld(scene: THREE.Scene) {
    collisionSystem.clear();

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Terrain Ground
    const groundGeom = new THREE.PlaneGeometry(110, 110, 16, 16);
    const ground = new THREE.Mesh(groundGeom, this.grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    worldGroup.add(ground);

    // 2. Central Sakura Plaza (Cobblestone Circle)
    const plazaGeom = new THREE.CircleGeometry(10, 32);
    const plaza = new THREE.Mesh(plazaGeom, this.plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    plaza.receiveShadow = true;
    worldGroup.add(plaza);

    // Inlaid Sakura Blossom Mosaic in Plaza Center
    const crestCanvas = document.createElement("canvas");
    crestCanvas.width = 512;
    crestCanvas.height = 512;
    const ctx = crestCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 512);

    // Draw 5-petal sakura flower
    ctx.fillStyle = "#ffb7c5";
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      const px = 256 + Math.cos(angle) * 110;
      const py = 256 + Math.sin(angle) * 110;
      ctx.arc(px, py, 65, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flower center
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(256, 256, 45, 0, Math.PI * 2);
    ctx.fill();

    const crestTex = new THREE.CanvasTexture(crestCanvas);
    const crestMesh = new THREE.Mesh(
      new THREE.CircleGeometry(3.6, 24),
      new THREE.MeshBasicMaterial({ map: crestTex, transparent: true, opacity: 0.85 })
    );
    crestMesh.rotation.x = -Math.PI / 2;
    crestMesh.position.y = 0.03;
    worldGroup.add(crestMesh);

    // 3. Winding Stone Paths
    // Path 1: Central Plaza -> Café Sakura (North-West: from 0,0 to -24, 18)
    this.createCurvedPath(worldGroup, new THREE.Vector2(0, 8), new THREE.Vector2(-22, 18), 3.2);

    // Path 2: Central Plaza -> Mirror Lake & Pier (East: from 0,0 to 18, -4)
    this.createCurvedPath(worldGroup, new THREE.Vector2(8, 0), new THREE.Vector2(20, -4), 3.2);

    // Path 3: Central Plaza -> Southern Entrance (Torii Gate: from 0,-8 to 0, -32)
    this.createStraightPath(worldGroup, 0, -8, 0, -32, 3.2);

    // Path 4: Central Plaza -> Hilltop Viewpoint (South-West: from -6, -4 to -24, -20)
    this.createCurvedPath(worldGroup, new THREE.Vector2(-6, -4), new THREE.Vector2(-24, -20), 2.8);

    // 4. The Great Sakura Tree (In the Central Plaza)
    const greatSakura = this.floraBuilder.createSakuraTree(0, 0, 1.4, true);
    worldGroup.add(greatSakura);

    // 5. Build Café Sakura (North-West sector: x = -24, z = 22)
    const cafe = this.cafeBuilder.buildCafe(-24, 22);
    worldGroup.add(cafe);

    // 6. Build Mirror Lake & Pier (East sector: x = 20, z = -12)
    const lake = this.lakeBuilder.buildLakeAndPier(20, -12);
    worldGroup.add(lake);

    // 7. Grand Torii Gate (Southern Park Entrance: x = 0, z = -32)
    this.buildToriiGate(worldGroup, 0, -32);

    // 8. Japanese Garden Stone Lanterns (Toro) with warm lights
    const lanternPositions = [
      { x: 7, z: 7 },
      { x: -7, z: 7 },
      { x: 7, z: -7 },
      { x: -7, z: -7 },
      { x: -14, z: 16 },
      { x: 12, z: -2 },
      { x: -18, z: -16 },
      { x: -2, z: -28 },
    ];
    lanternPositions.forEach((pos) => this.buildStoneLantern(worldGroup, pos.x, pos.z));

    // 9. Romantic Park Benches
    const benchPositions = [
      { x: 6, z: 4, rotY: -Math.PI / 3 },
      { x: -6, z: 4, rotY: Math.PI / 3 },
      { x: 0, z: 8.5, rotY: 0 },
      { x: 14, z: 6, rotY: Math.PI / 2 },
      { x: -16, z: -18, rotY: -Math.PI / 4 }, // Hilltop romantic bench
    ];
    benchPositions.forEach((bp) => this.buildParkBench(worldGroup, bp.x, bp.z, bp.rotY));

    // 10. Bamboo Fountain (Shishi-odoshi) near the garden path
    this.buildBambooFountain(worldGroup, 9, 12);

    // 11. Cherry Blossom Groves & Flora around the park
    const sakuraGroves = [
      { x: -12, z: 6, s: 1.1 },
      { x: -16, z: 10, s: 0.95 },
      { x: -8, z: 18, s: 1.05 },
      { x: 12, z: 8, s: 1.1 },
      { x: 14, z: 16, s: 1.0 },
      { x: 6, z: 20, s: 1.2 },
      { x: -12, z: -14, s: 1.0 },
      { x: -18, z: -8, s: 0.9 },
      { x: 10, z: -20, s: 1.1 },
      { x: -6, z: -24, s: 1.0 },
      { x: 6, z: -24, s: 1.0 },
    ];
    sakuraGroves.forEach((sg) => {
      const tree = this.floraBuilder.createSakuraTree(sg.x, sg.z, sg.s, false);
      worldGroup.add(tree);
    });

    // Japanese Pine Trees along outer perimeter
    const pineTrees = [
      { x: -36, z: -30, s: 1.3 },
      { x: -38, z: 0, s: 1.2 },
      { x: -38, z: 30, s: 1.2 },
      { x: 0, z: 38, s: 1.4 },
      { x: 26, z: 32, s: 1.2 },
      { x: 38, z: 18, s: 1.3 },
      { x: 38, z: -32, s: 1.4 },
      { x: -28, z: -36, s: 1.1 },
    ];
    pineTrees.forEach((pt) => {
      const pine = this.floraBuilder.createPineTree(pt.x, pt.z, pt.s);
      worldGroup.add(pine);
    });

    // Flowering Bush Beds
    const flowerBeds = [
      { x: -4, z: 9 },
      { x: 4, z: 9 },
      { x: -14, z: 13 },
      { x: 11, z: 3 },
      { x: -14, z: -16 },
      { x: -22, z: 10 },
      { x: 8, z: -16 },
    ];
    flowerBeds.forEach((fb) => {
      const flowers = this.floraBuilder.createFlowerBed(fb.x, fb.z, 1.6, 14);
      worldGroup.add(flowers);
    });

    // Park Perimeter Wooden Fence (to give world a cozy enclosed feel)
    this.buildPerimeterFence(worldGroup);

    return worldGroup;
  }

  // --- Path Geometry Helpers ---
  private createStraightPath(parent: THREE.Group, x1: number, z1: number, x2: number, z2: number, width: number) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const path = new THREE.Mesh(new THREE.PlaneGeometry(width, length), this.pathMat);
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = -angle;
    path.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
    path.receiveShadow = true;
    parent.add(path);
  }

  private createCurvedPath(parent: THREE.Group, start: THREE.Vector2, end: THREE.Vector2, width: number) {
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t1 = i / steps;
      const t2 = (i + 1) / steps;

      // Quadratic bezier curve with a gentle mid-point arc
      const mid = new THREE.Vector2((start.x + end.x) / 2 + (start.y - end.y) * 0.15, (start.y + end.y) / 2);
      const p1 = this.bezierPoint(start, mid, end, t1);
      const p2 = this.bezierPoint(start, mid, end, t2);

      this.createStraightPath(parent, p1.x, p1.y, p2.x, p2.y, width);
    }
  }

  private bezierPoint(p0: THREE.Vector2, p1: THREE.Vector2, p2: THREE.Vector2, t: number): THREE.Vector2 {
    const u = 1 - t;
    return new THREE.Vector2(
      u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    );
  }

  // --- Traditional Torii Gate ---
  private buildToriiGate(parent: THREE.Group, x: number, z: number) {
    const torii = new THREE.Group();
    torii.position.set(x, 0, z);

    const pillarRadius = 0.35;
    const pillarHeight = 5.6;
    const span = 6.2;

    // Two main vertical pillars
    for (const offset of [-span / 2, span / 2]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(pillarRadius * 0.85, pillarRadius, pillarHeight, 16),
        this.toriiMat
      );
      pillar.position.set(offset, pillarHeight / 2, 0);
      pillar.castShadow = true;
      torii.add(pillar);

      // Black stone base plinth
      const base = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius * 1.3, pillarRadius * 1.4, 0.4, 16), this.toriiBlackMat);
      base.position.set(offset, 0.2, 0);
      torii.add(base);

      collisionSystem.addCylinder(x + offset, z, pillarRadius * 1.3);
    }

    // Top primary crossbeam (Kasagi) with upturned curved ends
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(span + 2.4, 0.45, 0.55), this.toriiBlackMat);
    topBeam.position.set(0, pillarHeight + 0.2, 0);
    topBeam.castShadow = true;
    torii.add(topBeam);

    // Secondary crossbeam (Nuki)
    const midBeam = new THREE.Mesh(new THREE.BoxGeometry(span + 0.6, 0.35, 0.4), this.toriiMat);
    midBeam.position.set(0, pillarHeight - 0.9, 0);
    midBeam.castShadow = true;
    torii.add(midBeam);

    parent.add(torii);
  }

  // --- Stone Lantern (Toro) ---
  private buildStoneLantern(parent: THREE.Group, x: number, z: number) {
    const toro = new THREE.Group();
    toro.position.set(x, 0, z);

    // Stone base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), this.stoneMat);
    base.position.y = 0.15;
    toro.add(base);

    // Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.2, 8), this.stoneMat);
    shaft.position.y = 0.9;
    toro.add(shaft);

    // Middle platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.85), this.stoneMat);
    platform.position.y = 1.6;
    toro.add(platform);

    // Light chamber (with warm glowing interior)
    const chamber = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.5, 0.55),
      new THREE.MeshBasicMaterial({ color: 0xffe082 })
    );
    chamber.position.y = 1.95;
    toro.add(chamber);

    // Warm amber point light
    const light = new THREE.PointLight(0xffb74d, 1.8, 6.0);
    light.position.y = 2.0;
    toro.add(light);

    // Pagoda roof cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.4, 4), this.stoneMat);
    cap.position.y = 2.4;
    cap.rotation.y = Math.PI / 4;
    toro.add(cap);

    parent.add(toro);
    collisionSystem.addCylinder(x, z, 0.45);
  }

  // --- Romantic Park Bench ---
  private buildParkBench(parent: THREE.Group, x: number, z: number, rotY = 0) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;

    // Wooden Slats Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), this.woodMat);
    seat.position.set(0, 0.5, 0);
    seat.castShadow = true;
    bench.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.08), this.woodMat);
    back.position.set(0, 0.75, -0.22);
    back.castShadow = true;
    bench.add(back);

    // Metal legs
    for (const lx of [-0.85, 0.85]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.5, 0.46),
        new THREE.MeshToonMaterial({ color: 0x37474f, gradientMap: this.toonGradient })
      );
      leg.position.set(lx, 0.25, 0);
      bench.add(leg);
    }

    parent.add(bench);
    collisionSystem.addBox(x - 1.1, x + 1.1, z - 0.4, z + 0.4);
  }

  // --- Bamboo Fountain (Shishi-odoshi) ---
  private buildBambooFountain(parent: THREE.Group, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const bambooMat = new THREE.MeshToonMaterial({ color: 0x7cb342, gradientMap: this.toonGradient });

    // Bamboo spout
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), bambooMat);
    spout.position.set(0, 0.8, 0);
    spout.rotation.z = 0.5;
    group.add(spout);

    // Rock water basin (Tsukubai)
    const basin = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), this.stoneMat);
    basin.position.set(0.4, 0.3, 0);
    basin.scale.set(1.2, 0.6, 1.2);
    group.add(basin);

    // Water pool in basin
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 12),
      new THREE.MeshBasicMaterial({ color: 0x4dd0e1 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0.4, 0.45, 0);
    group.add(water);

    parent.add(group);
    collisionSystem.addCylinder(x + 0.4, z, 0.6);
  }

  // --- Park Perimeter Fence ---
  private buildPerimeterFence(parent: THREE.Group) {
    const half = 48;
    const postMat = this.woodMat;
    const railMat = new THREE.MeshToonMaterial({ color: 0x8d6e63, gradientMap: this.toonGradient });

    // Boundary boxes to block leaving the park
    collisionSystem.addBox(-half - 1, half + 1, half - 1, half + 1); // North edge
    collisionSystem.addBox(-half - 1, half + 1, -half - 1, -half + 1); // South edge
    collisionSystem.addBox(-half - 1, -half + 1, -half, half); // West edge
    collisionSystem.addBox(half - 1, half + 1, -half, half); // East edge

    // Fence rails on North and West sides
    const northRail = new THREE.Mesh(new THREE.BoxGeometry(96, 0.12, 0.12), railMat);
    northRail.position.set(0, 0.8, half);
    parent.add(northRail);

    const westRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 96), railMat);
    westRail.position.set(-half, 0.8, 0);
    parent.add(westRail);

    const eastRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 96), railMat);
    eastRail.position.set(half, 0.8, 0);
    parent.add(eastRail);
  }
}
