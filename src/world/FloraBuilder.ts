/**
 * FloraBuilder.ts
 * Builds stylized anime trees, cherry blossom clusters, Japanese pines,
 * flower beds, and registers trunk colliders with CollisionSystem.
 */

import * as THREE from "three";
import { collisionSystem } from "./CollisionSystem";
import { createToonGradientTexture } from "../characters/AnimeModelFactory";

export class FloraBuilder {
  private toonGradient: THREE.CanvasTexture;
  private trunkMat: THREE.MeshToonMaterial;
  private sakuraLeafMat: THREE.MeshToonMaterial;
  private sakuraLeafDarkMat: THREE.MeshToonMaterial;
  private pineLeafMat: THREE.MeshToonMaterial;
  private mapleLeafMat: THREE.MeshToonMaterial;
  private flowerMats: THREE.MeshToonMaterial[];

  constructor() {
    this.toonGradient = createToonGradientTexture();

    this.trunkMat = new THREE.MeshToonMaterial({
      color: 0x5d4037, // Warm rich bark
      gradientMap: this.toonGradient,
    });

    this.sakuraLeafMat = new THREE.MeshToonMaterial({
      color: 0xffb7c5, // Soft pastel sakura pink
      gradientMap: this.toonGradient,
    });

    this.sakuraLeafDarkMat = new THREE.MeshToonMaterial({
      color: 0xf48fb1, // Deeper contrast pink
      gradientMap: this.toonGradient,
    });

    this.pineLeafMat = new THREE.MeshToonMaterial({
      color: 0x2e7d32, // Stylized lush forest green
      gradientMap: this.toonGradient,
    });

    this.mapleLeafMat = new THREE.MeshToonMaterial({
      color: 0xd84315, // Japanese autumn red
      gradientMap: this.toonGradient,
    });

    this.flowerMats = [
      new THREE.MeshToonMaterial({ color: 0xff80ab, gradientMap: this.toonGradient }), // Pink
      new THREE.MeshToonMaterial({ color: 0xba68c8, gradientMap: this.toonGradient }), // Lavender
      new THREE.MeshToonMaterial({ color: 0x64b5f6, gradientMap: this.toonGradient }), // Soft blue
      new THREE.MeshToonMaterial({ color: 0xfff59d, gradientMap: this.toonGradient }), // Pale yellow
    ];
  }

  /**
   * Builds a stylized Cherry Blossom (Sakura) Tree with multi-tiered fluffy petal canopies.
   */
  public createSakuraTree(x: number, z: number, scale = 1.0, isGreatTree = false): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    const trunkRadius = isGreatTree ? 0.8 : 0.28;
    const trunkHeight = isGreatTree ? 5.5 : 3.6;

    // Gnarled stylized trunk
    const trunkGeom = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius * 1.2, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeom, this.trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Root buttresses
    const numRoots = isGreatTree ? 5 : 3;
    for (let i = 0; i < numRoots; i++) {
      const angle = (i / numRoots) * Math.PI * 2;
      const rootMesh = new THREE.Mesh(
        new THREE.ConeGeometry(trunkRadius * 0.5, trunkRadius * 2, 6),
        this.trunkMat
      );
      rootMesh.position.set(Math.cos(angle) * trunkRadius * 0.9, trunkRadius * 0.4, Math.sin(angle) * trunkRadius * 0.9);
      rootMesh.rotation.x = 0.4;
      rootMesh.rotation.y = angle;
      group.add(rootMesh);
    }

    // Lush stylized foliage cloud clusters (low-poly rounded geodesic domes)
    const clusterPositions = isGreatTree
      ? [
          { x: 0, y: trunkHeight + 1.8, z: 0, r: 3.4 },
          { x: 1.8, y: trunkHeight + 1.2, z: 1.2, r: 2.6 },
          { x: -1.9, y: trunkHeight + 1.1, z: 1.4, r: 2.7 },
          { x: 1.5, y: trunkHeight + 0.9, z: -1.7, r: 2.5 },
          { x: -1.6, y: trunkHeight + 1.0, z: -1.6, r: 2.6 },
          { x: 0, y: trunkHeight + 3.2, z: 0, r: 2.8 },
          { x: 2.4, y: trunkHeight + 0.4, z: 0, r: 2.0 },
          { x: -2.3, y: trunkHeight + 0.5, z: 0, r: 2.1 },
        ]
      : [
          { x: 0, y: trunkHeight + 1.1, z: 0, r: 1.8 },
          { x: 1.1, y: trunkHeight + 0.7, z: 0.6, r: 1.4 },
          { x: -1.1, y: trunkHeight + 0.6, z: 0.7, r: 1.3 },
          { x: 0.5, y: trunkHeight + 0.5, z: -1.0, r: 1.3 },
          { x: -0.6, y: trunkHeight + 0.7, z: -0.9, r: 1.2 },
          { x: 0, y: trunkHeight + 1.9, z: 0, r: 1.4 },
        ];

    clusterPositions.forEach((cp, idx) => {
      const mat = idx % 3 === 0 ? this.sakuraLeafDarkMat : this.sakuraLeafMat;
      const sphereGeom = new THREE.DodecahedronGeometry(cp.r, 2);
      const cluster = new THREE.Mesh(sphereGeom, mat);
      cluster.position.set(cp.x, cp.y, cp.z);
      cluster.castShadow = true;
      cluster.receiveShadow = true;
      group.add(cluster);
    });

    // Register cylinder collider for character movement
    collisionSystem.addCylinder(x, z, trunkRadius * scale * 1.3);

    return group;
  }

  /**
   * Japanese Garden Pine Tree
   */
  public createPineTree(x: number, z: number, scale = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.2, 8), this.trunkMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    group.add(trunk);

    // Conical pine tiers
    const tiers = [
      { y: 1.8, r: 1.4, h: 1.2 },
      { y: 2.6, r: 1.1, h: 1.0 },
      { y: 3.3, r: 0.75, h: 0.9 },
      { y: 3.9, r: 0.45, h: 0.7 },
    ];

    tiers.forEach((t) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), this.pineLeafMat);
      cone.position.y = t.y;
      cone.castShadow = true;
      group.add(cone);
    });

    collisionSystem.addCylinder(x, z, 0.4 * scale);
    return group;
  }

  /**
   * Decorative Flowering Garden Bush
   */
  public createFlowerBed(x: number, z: number, radius = 1.5, flowerCount = 12): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Base green bush foliage
    const bush = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.8, 8, 8), this.pineLeafMat);
    bush.scale.set(1.2, 0.4, 1.2);
    bush.position.y = 0.2;
    group.add(bush);

    // Colorful flower heads
    const flowerGeom = new THREE.SphereGeometry(0.1, 6, 6);
    for (let i = 0; i < flowerCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.8;
      const mat = this.flowerMats[Math.floor(Math.random() * this.flowerMats.length)];
      const fl = new THREE.Mesh(flowerGeom, mat);
      fl.position.set(Math.cos(angle) * dist, 0.25 + Math.random() * 0.15, Math.sin(angle) * dist);
      group.add(fl);
    }

    return group;
  }
}
