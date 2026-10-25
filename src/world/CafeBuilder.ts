/**
 * CafeBuilder.ts
 * Builds the charming "Café Sakura" with accessible interior,
 * service counter, espresso machine, pastry vitrine, warm lighting,
 * and outdoor parasol seating terrace. Registers solid colliders with CollisionSystem.
 */

import * as THREE from "three";
import { collisionSystem } from "./CollisionSystem";
import { createToonGradientTexture } from "../characters/AnimeModelFactory";

export class CafeBuilder {
  private toonGradient: THREE.CanvasTexture;
  private woodMat: THREE.MeshToonMaterial;
  private darkWoodMat: THREE.MeshToonMaterial;
  private roofMat: THREE.MeshToonMaterial;
  private wallMat: THREE.MeshToonMaterial;
  private deckMat: THREE.MeshToonMaterial;
  private whiteMat: THREE.MeshToonMaterial;
  private metalMat: THREE.MeshToonMaterial;
  private parasolMat: THREE.MeshToonMaterial;
  private pastryMat: THREE.MeshToonMaterial;

  constructor() {
    this.toonGradient = createToonGradientTexture();

    this.woodMat = new THREE.MeshToonMaterial({
      color: 0x8d6e63,
      gradientMap: this.toonGradient,
    });

    this.darkWoodMat = new THREE.MeshToonMaterial({
      color: 0x4e342e,
      gradientMap: this.toonGradient,
    });

    this.roofMat = new THREE.MeshToonMaterial({
      color: 0x263238, // Traditional dark slate Japanese roof tile
      gradientMap: this.toonGradient,
    });

    this.wallMat = new THREE.MeshToonMaterial({
      color: 0xfff8e1, // Warm creamy Japanese plaster wall
      gradientMap: this.toonGradient,
    });

    this.deckMat = new THREE.MeshToonMaterial({
      color: 0xa1887f,
      gradientMap: this.toonGradient,
    });

    this.whiteMat = new THREE.MeshToonMaterial({
      color: 0xffffff,
      gradientMap: this.toonGradient,
    });

    this.metalMat = new THREE.MeshToonMaterial({
      color: 0xb0bec5,
      gradientMap: this.toonGradient,
    });

    this.parasolMat = new THREE.MeshToonMaterial({
      color: 0xf48fb1, // Pastel sakura pink parasol
      gradientMap: this.toonGradient,
    });

    this.pastryMat = new THREE.MeshToonMaterial({
      color: 0xff80ab,
      gradientMap: this.toonGradient,
    });
  }

  /**
   * Build Café Sakura at (cx, cz)
   * Dimensions: 12m wide, 8m deep, 4.5m tall
   */
  public buildCafe(cx: number, cz: number): THREE.Group {
    const cafe = new THREE.Group();
    cafe.position.set(cx, 0, cz);

    const width = 12;
    const depth = 8;
    const height = 4.2;

    // 1. Polished Hardwood Interior Floor
    const floorGeom = new THREE.BoxGeometry(width, 0.2, depth);
    const floor = new THREE.Mesh(floorGeom, this.deckMat);
    floor.position.set(0, 0.1, 0);
    floor.receiveShadow = true;
    cafe.add(floor);

    // 2. Walls (with wide entrance doorway at the front)
    const wallThick = 0.3;

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThick), this.wallMat);
    backWall.position.set(0, height / 2, -depth / 2);
    backWall.castShadow = true;
    cafe.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, depth), this.wallMat);
    leftWall.position.set(-width / 2, height / 2, 0);
    leftWall.castShadow = true;
    cafe.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, depth), this.wallMat);
    rightWall.position.set(width / 2, height / 2, 0);
    rightWall.castShadow = true;
    cafe.add(rightWall);

    // Front Wall with accessible doorway (Left segment, Right segment, Top lintel)
    const doorWidth = 2.6;
    const doorHeight = 2.8;
    const sideSegWidth = (width - doorWidth) / 2;

    // Left front segment with display window
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideSegWidth, height, wallThick), this.wallMat);
    frontLeft.position.set(-doorWidth / 2 - sideSegWidth / 2, height / 2, depth / 2);
    frontLeft.castShadow = true;
    cafe.add(frontLeft);

    // Window frame on front left
    const windowGlass = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.8, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.45 })
    );
    windowGlass.position.set(-doorWidth / 2 - sideSegWidth / 2, 2.0, depth / 2 + 0.15);
    cafe.add(windowGlass);

    // Right front segment
    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sideSegWidth, height, wallThick), this.wallMat);
    frontRight.position.set(doorWidth / 2 + sideSegWidth / 2, height / 2, depth / 2);
    frontRight.castShadow = true;
    cafe.add(frontRight);

    // Door lintel above the opening
    const frontTop = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, height - doorHeight, wallThick),
      this.wallMat
    );
    frontTop.position.set(0, doorHeight + (height - doorHeight) / 2, depth / 2);
    cafe.add(frontTop);

    // 3. Traditional Japanese Roof with curved overhang eaves
    const roofGeom = new THREE.ConeGeometry(width * 0.75, 2.2, 4);
    const roof = new THREE.Mesh(roofGeom, this.roofMat);
    roof.position.set(0, height + 1.0, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1.0, 0.85);
    roof.castShadow = true;
    cafe.add(roof);

    // 4. Awning & Storefront Sign
    const awning = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 1.2, 0.15, 1.4), this.parasolMat);
    awning.position.set(0, doorHeight + 0.2, depth / 2 + 0.7);
    awning.rotation.x = 0.2;
    cafe.add(awning);

    // Storefront Signboard
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 512;
    signCanvas.height = 128;
    const signCtx = signCanvas.getContext("2d")!;
    signCtx.fillStyle = "#4e342e";
    signCtx.fillRect(0, 0, 512, 128);
    signCtx.strokeStyle = "#ffd166";
    signCtx.lineWidth = 6;
    signCtx.strokeRect(6, 6, 500, 116);
    signCtx.fillStyle = "#fffaf0";
    signCtx.font = "bold 44px 'Trebuchet MS', sans-serif";
    signCtx.textAlign = "center";
    signCtx.fillText("🌸 喫茶サクラ • CAFÉ SAKURA 🌸", 256, 75);
    const signTex = new THREE.CanvasTexture(signCanvas);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.9, 0.1),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signBoard.position.set(0, doorHeight + 0.85, depth / 2 + 0.25);
    cafe.add(signBoard);

    // 5. Interior Service Counter & Barista Corner
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 1.2), this.darkWoodMat);
    counter.position.set(-2.0, 0.6, -1.5);
    counter.castShadow = true;
    cafe.add(counter);

    // Espresso Machine on Counter
    const espressoMachine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.5), this.metalMat);
    espressoMachine.position.set(-3.2, 1.4, -1.5);
    cafe.add(espressoMachine);

    // Glass Pastry Vitrine with sweets
    const pastryCase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.45, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.5 })
    );
    pastryCase.position.set(-1.6, 1.35, -1.5);
    cafe.add(pastryCase);

    // Mini cakes inside pastry case
    for (let c = -1; c <= 1; c++) {
      const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), this.pastryMat);
      cake.position.set(-1.6 + c * 0.35, 1.2, -1.5);
      cafe.add(cake);
    }

    // Warm Interior Ambient Lighting
    const warmPendant = new THREE.PointLight(0xffd54f, 2.5, 9);
    warmPendant.position.set(-2.0, 3.2, -1.5);
    cafe.add(warmPendant);

    // Chalkboard Menu on back wall
    const menuCanvas = document.createElement("canvas");
    menuCanvas.width = 512;
    menuCanvas.height = 512;
    const mCtx = menuCanvas.getContext("2d")!;
    mCtx.fillStyle = "#263238";
    mCtx.fillRect(0, 0, 512, 512);
    mCtx.fillStyle = "#ffb7c5";
    mCtx.font = "bold 34px sans-serif";
    mCtx.fillText("~ Seasonal Menu ~", 110, 60);
    mCtx.fillStyle = "#ffffff";
    mCtx.font = "26px sans-serif";
    mCtx.fillText("• Sakura Matcha Latte ...... ¥620", 50, 130);
    mCtx.fillText("• Iced Peach Oolong Tea ... ¥550", 50, 190);
    mCtx.fillText("• Caramel Macchiato ....... ¥580", 50, 250);
    mCtx.fillText("• Strawberry Shortcake .... ¥680", 50, 310);
    mCtx.fillText("• Matcha Roll Cake ........ ¥640", 50, 370);
    const menuTex = new THREE.CanvasTexture(menuCanvas);

    const menuBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: menuTex })
    );
    menuBoard.position.set(-2.0, 2.5, -depth / 2 + 0.18);
    cafe.add(menuBoard);

    // 6. Outdoor Dining Terrace with Parasol Tables
    const terraceWidth = 14;
    const terraceDepth = 6;
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(terraceWidth, 0.15, terraceDepth), this.deckMat);
    terrace.position.set(0, 0.08, depth / 2 + terraceDepth / 2);
    terrace.receiveShadow = true;
    cafe.add(terrace);

    // Tables on Terrace
    const tablePositions = [
      { x: -4.0, z: depth / 2 + 3.0 },
      { x: 4.0, z: depth / 2 + 3.0 },
    ];

    tablePositions.forEach((pos) => {
      // Table
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 16), this.woodMat);
      table.position.set(pos.x, 0.78, pos.z);
      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), this.darkWoodMat);
      tableLeg.position.set(pos.x, 0.42, pos.z);
      cafe.add(table);
      cafe.add(tableLeg);

      // Parasol Umbrella
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), this.metalMat);
      pole.position.set(pos.x, 1.3, pos.z);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 12), this.parasolMat);
      canopy.position.set(pos.x, 2.5, pos.z);
      canopy.castShadow = true;
      cafe.add(pole);
      cafe.add(canopy);

      // Coffee cups on table
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 10), this.whiteMat);
      cup.position.set(pos.x + 0.2, 0.85, pos.z - 0.1);
      cafe.add(cup);

      // 2 Chairs per table
      for (const offset of [-0.9, 0.9]) {
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), this.woodMat);
        chairSeat.position.set(pos.x + offset, 0.45, pos.z);
        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.05), this.woodMat);
        chairBack.position.set(pos.x + offset, 0.68, pos.z + (offset > 0 ? 0.18 : -0.18));
        cafe.add(chairSeat);
        cafe.add(chairBack);
      }
    });

    // Register Solid Colliders into CollisionSystem
    // Back wall collider
    collisionSystem.addBox(cx - width / 2, cx + width / 2, cz - depth / 2 - 0.2, cz - depth / 2 + 0.2);
    // Left wall collider
    collisionSystem.addBox(cx - width / 2 - 0.2, cx - width / 2 + 0.2, cz - depth / 2, cz + depth / 2);
    // Right wall collider
    collisionSystem.addBox(cx + width / 2 - 0.2, cx + width / 2 + 0.2, cz - depth / 2, cz + depth / 2);
    // Front wall Left segment
    collisionSystem.addBox(
      cx - width / 2,
      cx - doorWidth / 2,
      cz + depth / 2 - 0.2,
      cz + depth / 2 + 0.2
    );
    // Front wall Right segment
    collisionSystem.addBox(
      cx + doorWidth / 2,
      cx + width / 2,
      cz + depth / 2 - 0.2,
      cz + depth / 2 + 0.2
    );
    // Service Counter collider inside
    collisionSystem.addBox(cx - 4.2, cx + 0.2, cz - 2.2, cz - 0.8);

    return cafe;
  }
}
