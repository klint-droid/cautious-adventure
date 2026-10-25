/**
 * WeatherSystem.ts
 * Manages anime atmospheric weather effects: swirling cherry blossom petals,
 * dynamic wind simulation, and golden-hour lighting mood.
 */

import * as THREE from "three";

interface PetalData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  vrz: number;
  scale: number;
}

export class WeatherSystem {
  private petalMesh: THREE.InstancedMesh;
  private petalCount = 750;
  private petals: PetalData[] = [];
  private dummy = new THREE.Object3D();
  private time = 0;

  constructor(scene: THREE.Scene) {
    // Curved sakura petal geometry
    const petalGeom = new THREE.PlaneGeometry(0.18, 0.24, 2, 2);
    // Slight curve to geometry for realistic light catching
    const posAttr = petalGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(y * 10) * 0.04);
    }
    petalGeom.computeVertexNormals();

    const petalMat = new THREE.MeshBasicMaterial({
      color: 0xffb7c5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });

    this.petalMesh = new THREE.InstancedMesh(petalGeom, petalMat, this.petalCount);
    this.petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.petalMesh);

    // Initialize random petal field across the 80x80m park area
    for (let i = 0; i < this.petalCount; i++) {
      this.petals.push({
        x: (Math.random() - 0.5) * 80,
        y: 1.0 + Math.random() * 12.0,
        z: (Math.random() - 0.5) * 80,
        vx: 0.3 + Math.random() * 0.4,
        vy: -(0.5 + Math.random() * 0.6),
        vz: (Math.random() - 0.5) * 0.3,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        vrx: (Math.random() - 0.5) * 2.5,
        vry: (Math.random() - 0.5) * 3.0,
        vrz: (Math.random() - 0.5) * 2.5,
        scale: 0.7 + Math.random() * 0.6,
      });
    }

    this.update(0);
  }

  public update(delta: number) {
    this.time += delta;

    // Wind gust turbulence
    const windGustX = Math.sin(this.time * 0.6) * 0.5 + 0.6;
    const windGustZ = Math.cos(this.time * 0.4) * 0.3;

    for (let i = 0; i < this.petalCount; i++) {
      const p = this.petals[i];

      // Update positions
      p.x += (p.vx + windGustX) * delta;
      p.y += p.vy * delta;
      p.z += (p.vz + windGustZ) * delta;

      // Update tumbling rotations
      p.rx += p.vrx * delta;
      p.ry += p.vry * delta;
      p.rz += p.vrz * delta;

      // Wrap around ground or boundaries
      if (p.y < 0.1 || p.x > 45 || p.x < -45 || p.z > 45 || p.z < -45) {
        p.y = 10.0 + Math.random() * 5.0;
        p.x = (Math.random() - 0.5) * 80;
        p.z = (Math.random() - 0.5) * 80;
      }

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.rotation.set(p.rx, p.ry, p.rz);
      this.dummy.scale.setScalar(p.scale);
      this.dummy.updateMatrix();

      this.petalMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.petalMesh.instanceMatrix.needsUpdate = true;
  }
}
