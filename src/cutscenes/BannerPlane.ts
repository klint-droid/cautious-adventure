/**
 * BannerPlane.ts
 * Stylized anime skywriting airplane trailing an animated romantic banner
 * across the sunset sky above Mirror Lake.
 *
 * Displays the banner text:
 * "✦ If I have the chance to court you... 🌸"
 */

import * as THREE from "three";

export class BannerPlane {
  public group: THREE.Group;
  private planeGroup: THREE.Group;
  private bannerMesh: THREE.Mesh;
  private bannerGeometry: THREE.PlaneGeometry;
  private bannerMaterial: THREE.MeshStandardMaterial;
  private propeller: THREE.Mesh;

  private flightTime = 0;
  private flightSpeed = 0.22; // speed of orbit around lake
  private isActive = false;
  private bannerPointsCount = 32;

  // Orbit parameters around Mirror Lake (center: 20, -13)
  private orbitCenter = new THREE.Vector3(20, 8.2, -13);
  private orbitRadiusX = 22.0;
  private orbitRadiusZ = 15.0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // 1. Airplane Model Group
    this.planeGroup = new THREE.Group();
    this.group.add(this.planeGroup);
    this.propeller = this.buildAirplane();

    // 2. Trailing Banner
    const { mesh, geometry, material } = this.buildBanner();
    this.bannerMesh = mesh;
    this.bannerGeometry = geometry;
    this.bannerMaterial = material;
    this.group.add(this.bannerMesh);
  }

  /**
   * Build Stylized Anime Propeller Airplane
   */
  private buildAirplane(): THREE.Mesh {
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      roughness: 0.35,
      metalness: 0.1,
    });
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xe53935, // Vermilion anime red
      roughness: 0.4,
      metalness: 0.2,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x80deea,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.5,
    });

    // Main Fuselage
    const fuselageGeom = new THREE.ConeGeometry(0.42, 2.8, 16);
    fuselageGeom.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeom, whiteMat);
    fuselage.position.set(0, 0, 0);
    this.planeGroup.add(fuselage);

    // Nose Cowling
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 16, 12),
      redMat
    );
    nose.position.set(0, 0, 1.35);
    nose.scale.set(1, 1, 0.7);
    this.planeGroup.add(nose);

    // Glass Canopy Cockpit
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 12),
      canopyMat
    );
    canopy.position.set(0, 0.24, 0.25);
    canopy.scale.set(0.85, 0.95, 1.8);
    this.planeGroup.add(canopy);

    // Main Wings (Biplane / Monoplane wide wings)
    const wingSpan = 4.6;
    const wingChord = 0.85;
    const wingGeom = new THREE.BoxGeometry(wingSpan, 0.06, wingChord);
    const mainWing = new THREE.Mesh(wingGeom, whiteMat);
    mainWing.position.set(0, 0.1, 0.4);
    this.planeGroup.add(mainWing);

    // Red wingtips
    for (const side of [-wingSpan / 2 + 0.25, wingSpan / 2 - 0.25]) {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, wingChord), redMat);
      tip.position.set(side, 0.1, 0.4);
      this.planeGroup.add(tip);
    }

    // Lower Wing
    const lowerWing = new THREE.Mesh(
      new THREE.BoxGeometry(wingSpan * 0.85, 0.05, wingChord * 0.85),
      whiteMat
    );
    lowerWing.position.set(0, -0.25, 0.4);
    this.planeGroup.add(lowerWing);

    // Tail Fin (Vertical Stabilizer)
    const finGeom = new THREE.BoxGeometry(0.06, 0.75, 0.65);
    const tailFin = new THREE.Mesh(finGeom, redMat);
    tailFin.position.set(0, 0.4, -1.2);
    this.planeGroup.add(tailFin);

    // Horizontal Stabilizer
    const stabGeom = new THREE.BoxGeometry(1.6, 0.05, 0.45);
    const stabilizer = new THREE.Mesh(stabGeom, whiteMat);
    stabilizer.position.set(0, 0.1, -1.25);
    this.planeGroup.add(stabilizer);

    // Spinning Nose Propeller
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0, 1.72);

    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 12), redMat);
    spinner.rotateX(Math.PI / 2);
    propGroup.add(spinner);

    const bladeGeom = new THREE.BoxGeometry(0.12, 1.25, 0.025);
    const blade1 = new THREE.Mesh(bladeGeom, darkMat);
    propGroup.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeom, darkMat);
    blade2.rotation.z = Math.PI / 2;
    propGroup.add(blade2);

    this.planeGroup.add(propGroup);

    // Scale entire plane
    this.planeGroup.scale.set(1.2, 1.2, 1.2);
    return propGroup as unknown as THREE.Mesh;
  }

  /**
   * Build Trailing Cloth Banner with Dynamic Canvas Calligraphy
   */
  private buildBanner() {
    const bannerLength = 11.0;
    const bannerHeight = 1.35;

    // High resolution canvas for banner text
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // 1. Semi-translucent white silk ribbon background
    const bgGrad = ctx.createLinearGradient(0, 0, 2048, 0);
    bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    bgGrad.addColorStop(0.5, "rgba(255, 248, 250, 0.98)");
    bgGrad.addColorStop(1, "rgba(255, 235, 240, 0.92)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 256);

    // 2. Gold Border Trims along top and bottom
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(0, 0, 2048, 8);
    ctx.fillRect(0, 248, 2048, 8);

    // Subtle inner stitched line
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 14, 2032, 228);

    // 3. Banner Text: "✦ If I have the chance to court you... 🌸"
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Text Shadow
    ctx.shadowColor = "rgba(255, 105, 140, 0.6)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 3;

    // Bold anime calligraphy
    ctx.font = "900 78px 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Gold outline
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 6;
    ctx.strokeText("✦ If I have the chance to court you... 🌸", 1024, 128);

    // Deep romantic crimson fill
    ctx.fillStyle = "#881b34";
    ctx.fillText("✦ If I have the chance to court you... 🌸", 1024, 128);
    ctx.restore();

    // Swallowtail notched cut at the trailing end
    ctx.clearRect(1980, 0, 68, 256);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.beginPath();
    ctx.moveTo(2048, 0);
    ctx.lineTo(1980, 128);
    ctx.lineTo(2048, 256);
    ctx.fill();

    const bannerTexture = new THREE.CanvasTexture(canvas);
    bannerTexture.minFilter = THREE.LinearFilter;
    bannerTexture.magFilter = THREE.LinearFilter;
    bannerTexture.wrapS = THREE.ClampToEdgeWrapping;
    bannerTexture.wrapT = THREE.ClampToEdgeWrapping;

    const bannerMaterial = new THREE.MeshStandardMaterial({
      map: bannerTexture,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.05,
    });

    const bannerGeometry = new THREE.PlaneGeometry(
      bannerLength,
      bannerHeight,
      this.bannerPointsCount,
      1
    );

    const bannerMesh = new THREE.Mesh(bannerGeometry, bannerMaterial);
    bannerMesh.castShadow = true;

    return { mesh: bannerMesh, geometry: bannerGeometry, material: bannerMaterial };
  }

  public start() {
    this.isActive = true;
    this.group.visible = true;
    this.flightTime = 0;
  }

  public stop() {
    this.isActive = false;
    this.group.visible = false;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Update plane orbit and fluttering cloth banner
   */
  public update(delta: number) {
    if (!this.isActive) return;

    this.flightTime += delta;

    // Spin propeller rapidly
    if (this.propeller) {
      this.propeller.rotation.z += delta * 36;
    }

    // Flight Orbit Angle
    const angle = this.flightTime * this.flightSpeed + Math.PI * 0.15;

    // Current plane position along smooth ellipse over Mirror Lake
    const px = this.orbitCenter.x + Math.cos(angle) * this.orbitRadiusX;
    const pz = this.orbitCenter.z + Math.sin(angle) * this.orbitRadiusZ;
    // Gentle altitude wave
    const py = this.orbitCenter.y + Math.sin(this.flightTime * 0.6) * 0.45;

    this.planeGroup.position.set(px, py, pz);

    // Tangent vector for forward flight orientation
    const tangentX = -Math.sin(angle) * this.orbitRadiusX;
    const tangentZ = Math.cos(angle) * this.orbitRadiusZ;
    const forwardYaw = Math.atan2(tangentX, tangentZ);

    this.planeGroup.rotation.y = forwardYaw;
    // Bank gently into the turn
    this.planeGroup.rotation.z = 0.22;
    this.planeGroup.rotation.x = Math.cos(this.flightTime * 0.6) * 0.05;

    // Tow line offset from tail of plane
    const tailOffset = new THREE.Vector3(0, 0, -1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), forwardYaw);
    const towPoint = this.planeGroup.position.clone().add(tailOffset);

    // Position and orient banner trailing behind the plane
    // Banner spans backwards along the tangent
    const bannerLength = 11.0;
    const bannerHalfLength = bannerLength / 2;
    const bannerCenterOffset = new THREE.Vector3(0, -0.15, -bannerHalfLength - 1.2).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      forwardYaw
    );

    this.bannerMesh.position.copy(towPoint).add(bannerCenterOffset);
    this.bannerMesh.rotation.y = forwardYaw + Math.PI; // Face outwards to lake and camera
    this.bannerMesh.rotation.z = -0.06;

    // Cloth fluttering wave animation on banner mesh vertices
    const posAttr = this.bannerGeometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const waveSpeed = 8.5;
    const waveFreq = 0.85;

    // 2 rows of vertices (top and bottom), columns 0 to bannerPointsCount
    const cols = this.bannerPointsCount + 1;
    for (let c = 0; c < cols; c++) {
      // Flutter amplitude increases towards the trailing free end
      const distanceRatio = c / cols;
      const amplitude = 0.04 + distanceRatio * 0.32;
      const wave = Math.sin(c * waveFreq - this.flightTime * waveSpeed) * amplitude;

      // Top vertex index: c * 3 + 2 (z component)
      const topIdx = c * 3 + 2;
      // Bottom vertex index: (cols + c) * 3 + 2
      const botIdx = (cols + c) * 3 + 2;

      arr[topIdx] = wave;
      arr[botIdx] = wave * 0.85;
    }
    posAttr.needsUpdate = true;
    this.bannerGeometry.computeVertexNormals();
  }
}
