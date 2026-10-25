/**
 * LakeBuilder.ts
 * Builds Mirror Lake with animated translucent water ripples,
 * long wooden pier with romantic sunset gazebo, and traditional arched footbridge.
 * Registers colliders with CollisionSystem.
 */

import * as THREE from "three";
import { collisionSystem } from "./CollisionSystem";
import { createToonGradientTexture } from "../characters/AnimeModelFactory";

export class LakeBuilder {
  private toonGradient: THREE.CanvasTexture;
  private woodMat: THREE.MeshToonMaterial;
  private redBridgeMat: THREE.MeshToonMaterial;
  private waterMaterial: THREE.MeshStandardMaterial;
  private waterMesh: THREE.Mesh | null = null;
  private waterTime = 0;

  constructor() {
    this.toonGradient = createToonGradientTexture();

    this.woodMat = new THREE.MeshToonMaterial({
      color: 0x6d4c41,
      gradientMap: this.toonGradient,
    });

    this.redBridgeMat = new THREE.MeshToonMaterial({
      color: 0xd32f2f, // Traditional Japanese vermilion red
      gradientMap: this.toonGradient,
    });

    // Translucent stylized anime water material
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4dd0e1, // Bright anime turquoise
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82,
    });
  }

  /**
   * Build Lake & Pier at (lx, lz)
   * Lake diameter ~36m
   */
  public buildLakeAndPier(lx: number, lz: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(lx, 0, lz);

    const lakeRadius = 18;

    // 1. Water Surface
    const waterGeom = new THREE.CircleGeometry(lakeRadius, 48);
    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -0.15;
    this.waterMesh.receiveShadow = true;
    group.add(this.waterMesh);

    // Lake Bed / Shore Basin (concave dark rim)
    const basin = new THREE.Mesh(
      new THREE.RingGeometry(lakeRadius - 0.5, lakeRadius + 2.5, 48),
      new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.9 })
    );
    basin.rotation.x = -Math.PI / 2;
    basin.position.y = -0.12;
    group.add(basin);

    // Floating Lotus / Lily Pads
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (i % 3) * 0.4;
      const dist = 5.0 + (i % 5) * 2.2;
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(0.55 + (i % 3) * 0.2, 10),
        new THREE.MeshToonMaterial({ color: 0x43a047, gradientMap: this.toonGradient })
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(Math.cos(angle) * dist, -0.12, Math.sin(angle) * dist);
      group.add(pad);
    }

    // 2. Wooden Boardwalk / Pier Extending over the Lake
    // Origin starts at shore (lx, lz - 18) and stretches 20m towards center
    const pierLength = 22;
    const pierWidth = 3.4;
    const pierHeight = 0.25;

    const pierDeck = new THREE.Mesh(
      new THREE.BoxGeometry(pierWidth, pierHeight, pierLength),
      this.woodMat
    );
    pierDeck.position.set(0, 0.1, -pierLength / 2 + 3);
    pierDeck.receiveShadow = true;
    pierDeck.castShadow = true;
    group.add(pierDeck);

    // Support Pilings anchored into the lake
    const numPilings = 7;
    for (let i = 0; i < numPilings; i++) {
      const pz = -i * 3.0 + 2;
      for (const px of [-pierWidth / 2 + 0.2, pierWidth / 2 - 0.2]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), this.woodMat);
        post.position.set(px, -0.8, pz);
        post.castShadow = true;
        group.add(post);

        // Pier railing post above deck
        const railPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8), this.woodMat);
        railPost.position.set(px, 0.6, pz);
        group.add(railPost);
      }
    }

    // Pier Rope Railings along the sides
    for (const px of [-pierWidth / 2 + 0.2, pierWidth / 2 - 0.2]) {
      const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, pierLength),
        this.woodMat
      );
      topRail.position.set(px, 1.0, -pierLength / 2 + 3);
      group.add(topRail);
    }

    // 3. Sunset Pier Gazebo at Pier Terminus
    const gazeboZ = -pierLength + 3;
    const gazeboRadius = 3.6;

    // Hexagonal gazebo floor
    const gazFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(gazeboRadius, gazeboRadius, 0.3, 6),
      this.woodMat
    );
    gazFloor.position.set(0, 0.15, gazeboZ);
    gazFloor.receiveShadow = true;
    group.add(gazFloor);

    // Gazebo Pillars (6 pillars)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const gx = Math.cos(angle) * (gazeboRadius - 0.4);
      const gz = gazeboZ + Math.sin(angle) * (gazeboRadius - 0.4);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 8), this.woodMat);
      pillar.position.set(gx, 1.7, gz);
      pillar.castShadow = true;
      group.add(pillar);

      // Register collider for pillars
      collisionSystem.addCylinder(lx + gx, lz + gz, 0.3);
    }

    // Gazebo Pagoda-style Roof
    const gazRoof = new THREE.Mesh(
      new THREE.ConeGeometry(gazeboRadius * 1.25, 2.0, 6),
      new THREE.MeshToonMaterial({ color: 0x37474f, gradientMap: this.toonGradient })
    );
    gazRoof.position.set(0, 4.0, gazeboZ);
    gazRoof.castShadow = true;
    group.add(gazRoof);

    // Warm Hanging Lantern inside Gazebo
    const gazLantern = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.45, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffd54f })
    );
    gazLantern.position.set(0, 2.9, gazeboZ);
    group.add(gazLantern);

    const gazLight = new THREE.PointLight(0xffb74d, 2.0, 8);
    gazLight.position.set(0, 2.7, gazeboZ);
    group.add(gazLight);

    // Benches inside gazebo facing sunset
    const gBench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.5), this.woodMat);
    gBench.position.set(0, 0.55, gazeboZ - 1.8);
    group.add(gBench);

    // 4. Traditional Arched Japanese Vermilion Footbridge (Taiko Bashi)
    // Placed at the north inlet of the lake
    const bridgeX = 14;
    const bridgeZ = -4;
    const bridge = new THREE.Group();
    bridge.position.set(bridgeX, 0, bridgeZ);
    bridge.rotation.y = 0.5;

    const bridgeLen = 8.0;
    const bridgeW = 2.4;

    // Arched curve segments
    const archSegments = 12;
    for (let s = 0; s < archSegments; s++) {
      const u = s / (archSegments - 1); // 0 to 1
      const segZ = (u - 0.5) * bridgeLen;
      const archHeight = Math.sin(u * Math.PI) * 0.9 + 0.1;

      const plank = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 0.14, bridgeLen / archSegments), this.woodMat);
      plank.position.set(0, archHeight, segZ);
      plank.rotation.x = -Math.cos(u * Math.PI) * 0.25;
      plank.receiveShadow = true;
      bridge.add(plank);

      // Vermilion side rails
      for (const rx of [-bridgeW / 2 + 0.1, bridgeW / 2 - 0.1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), this.redBridgeMat);
        post.position.set(rx, archHeight + 0.45, segZ);
        bridge.add(post);
      }
    }

    // Top vermilion handrail
    for (const rx of [-bridgeW / 2 + 0.1, bridgeW / 2 - 0.1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, bridgeLen), this.redBridgeMat);
      rail.position.set(rx, 1.25, 0);
      bridge.add(rail);
    }
    group.add(bridge);

    // Colliders for deep water boundary:
    // Left lake bank collider & Right lake bank collider (keeps player on walkways and piers)
    collisionSystem.addBox(lx - lakeRadius - 2, lx - pierWidth / 2 - 0.5, lz - lakeRadius, lz + 2);
    collisionSystem.addBox(lx + pierWidth / 2 + 0.5, lx + lakeRadius + 2, lz - lakeRadius, lz + 2);

    return group;
  }

  public updateWater(delta: number) {
    this.waterTime += delta * 1.5;
    if (this.waterMaterial) {
      // Subtle color oscillation representing gentle sunset ripple highlights
      const shimmer = Math.sin(this.waterTime * 2) * 0.04;
      this.waterMaterial.color.setRGB(0.3 + shimmer, 0.8 + shimmer, 0.9);
    }
  }
}
