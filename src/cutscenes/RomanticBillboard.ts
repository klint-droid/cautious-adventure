/**
 * RomanticBillboard.ts
 * High-resolution 3D romantic billboard with custom canvas calligraphy,
 * traditional anime timber frame, warm paper lanterns, and smooth reveal animation.
 *
 * Displays the exact text:
 * CYRIL, CAN I COURT YOU?
 * Sincerely, Klint.
 */

import * as THREE from "three";

export class RomanticBillboard {
  public group: THREE.Group;
  public spotlight: THREE.SpotLight;
  public pointLight: THREE.PointLight;

  private boardMesh: THREE.Mesh;
  private boardMat: THREE.MeshStandardMaterial;
  private frameMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private goldMat: THREE.MeshStandardMaterial;
  private lanternMat: THREE.MeshStandardMaterial;

  private isRevealed = false;
  private revealProgress = 0;
  private revealDuration = 2.0;

  // Floating ambient petals around the billboard
  private petalParticles: THREE.Points;
  private petalGeo: THREE.BufferGeometry;
  private petalMat: THREE.PointsMaterial;

  constructor(position: THREE.Vector3 = new THREE.Vector3(24.2, 2.5, -11.8), rotationY: number = -0.65) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = rotationY;

    // 1. Generate High-Res 2048x1024 Canvas Texture
    const canvasTexture = this.createCanvasTexture();

    // 2. Materials
    this.boardMat = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      transparent: true,
      opacity: 0,
      roughness: 0.35,
      metalness: 0.05,
    });

    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // Dark lacquered wood
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
    });

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x2b1b17,
      roughness: 0.5,
      metalness: 0.15,
      transparent: true,
      opacity: 0,
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f, // Warm gold trim
      roughness: 0.25,
      metalness: 0.8,
      transparent: true,
      opacity: 0,
    });

    this.lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe0b2,
      emissive: 0xff8f00,
      emissiveIntensity: 0,
      roughness: 0.3,
      transparent: true,
      opacity: 0,
    });

    // 3. Main Billboard Board (6.6m wide x 3.6m tall)
    const boardWidth = 6.6;
    const boardHeight = 3.6;
    const boardDepth = 0.16;

    const boardGeom = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
    // Apply canvas to front face (material index 4), wood to others
    const materials = [
      this.woodMat, // right
      this.woodMat, // left
      this.woodMat, // top
      this.woodMat, // bottom
      this.boardMat, // front (+Z)
      this.woodMat, // back
    ];
    this.boardMesh = new THREE.Mesh(boardGeom, materials);
    this.boardMesh.position.set(0, 0, 0);
    this.boardMesh.castShadow = true;
    this.boardMesh.receiveShadow = true;
    this.group.add(this.boardMesh);

    // 4. Gold Beveled Trim around the billboard face
    const trimThick = 0.06;
    const trimDepth = 0.08;

    // Top & Bottom Gold Trim
    for (const yOffset of [boardHeight / 2 + trimThick / 2, -boardHeight / 2 - trimThick / 2]) {
      const hTrim = new THREE.Mesh(
        new THREE.BoxGeometry(boardWidth + 0.2, trimThick, trimDepth),
        this.goldMat
      );
      hTrim.position.set(0, yOffset, boardDepth / 2 + trimDepth / 2);
      this.group.add(hTrim);
    }
    // Left & Right Gold Trim
    for (const xOffset of [boardWidth / 2 + trimThick / 2, -boardWidth / 2 - trimThick / 2]) {
      const vTrim = new THREE.Mesh(
        new THREE.BoxGeometry(trimThick, boardHeight + 0.2, trimDepth),
        this.goldMat
      );
      vTrim.position.set(xOffset, 0, boardDepth / 2 + trimDepth / 2);
      this.group.add(vTrim);
    }

    // 5. Traditional Japanese Roof Ridge Cap on Top
    const roofGeom = new THREE.BoxGeometry(boardWidth + 0.6, 0.22, 0.6);
    const roof = new THREE.Mesh(roofGeom, this.frameMat);
    roof.position.set(0, boardHeight / 2 + 0.18, 0);
    roof.castShadow = true;
    this.group.add(roof);

    // Decorative curved ridge eave
    const ridgeGeom = new THREE.CylinderGeometry(0.08, 0.08, boardWidth + 0.8, 8);
    const ridge = new THREE.Mesh(ridgeGeom, this.goldMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, boardHeight / 2 + 0.32, 0);
    this.group.add(ridge);

    // 6. Two Heavy Timber Support Posts
    const postHeight = 4.8;
    const postRadius = 0.14;
    const postSpacing = 2.4;

    for (const xSide of [-postSpacing, postSpacing]) {
      // Wood pillar
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16),
        this.woodMat
      );
      post.position.set(xSide, -0.6, 0);
      post.castShadow = true;
      this.group.add(post);

      // Carved stone foundation plinth
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.38, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.9 })
      );
      plinth.position.set(xSide, -2.8, 0);
      this.group.add(plinth);

      // Hanging Warm Paper Lantern at each top corner
      const lanternGroup = new THREE.Group();
      lanternGroup.position.set(xSide > 0 ? boardWidth / 2 + 0.15 : -boardWidth / 2 - 0.15, boardHeight / 2 - 0.4, 0.35);

      // Cord
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), this.goldMat);
      cord.position.set(0, 0.15, 0);
      lanternGroup.add(cord);

      // Lantern body (oval paper globe)
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 12),
        this.lanternMat
      );
      globe.scale.set(1, 1.35, 1);
      lanternGroup.add(globe);

      // Cap and tassel
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8), this.woodMat);
      cap.position.set(0, 0.34, 0);
      lanternGroup.add(cap);

      this.group.add(lanternGroup);
    }

    // 7. Cinematic Lighting: Spotlight aimed directly at the billboard
    this.spotlight = new THREE.SpotLight(0xfff3e0, 0, 16, Math.PI / 3, 0.4, 1.2);
    this.spotlight.position.set(0, 3.2, 4.5);
    this.spotlight.target = this.boardMesh;
    this.spotlight.castShadow = false;
    this.group.add(this.spotlight);

    // Warm ambient fill point light
    this.pointLight = new THREE.PointLight(0xffb7c5, 0, 10, 1.5);
    this.pointLight.position.set(0, 0, 2.2);
    this.group.add(this.pointLight);

    // 8. Floating Petal Particles around the billboard
    const petalCount = 45;
    const petalPos = new Float32Array(petalCount * 3);
    for (let i = 0; i < petalCount; i++) {
      petalPos[i * 3] = (Math.random() - 0.5) * 8.0;
      petalPos[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
      petalPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5 + 0.8;
    }
    this.petalGeo = new THREE.BufferGeometry();
    this.petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPos, 3));

    const petalCanvas = document.createElement("canvas");
    petalCanvas.width = 64;
    petalCanvas.height = 64;
    const pCtx = petalCanvas.getContext("2d")!;
    pCtx.fillStyle = "#ffb7c5";
    pCtx.beginPath();
    pCtx.ellipse(32, 32, 24, 14, Math.PI / 4, 0, Math.PI * 2);
    pCtx.fill();
    const petalTexture = new THREE.CanvasTexture(petalCanvas);

    this.petalMat = new THREE.PointsMaterial({
      size: 0.22,
      map: petalTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.petalParticles = new THREE.Points(this.petalGeo, this.petalMat);
    this.group.add(this.petalParticles);
  }

  /**
   * Generates high-resolution 2048x1024 canvas with exact required text:
   * CYRIL, CAN I COURT YOU?
   * Sincerely, Klint.
   */
  private createCanvasTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // 1. Warm Soft Cream & Sunset Pastel Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    bgGrad.addColorStop(0, "#fffbf5");
    bgGrad.addColorStop(0.35, "#fff2f5");
    bgGrad.addColorStop(0.7, "#ffe7ee");
    bgGrad.addColorStop(1, "#ffd5e1");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // 2. Subtle Anime Watercolor Texture Wash
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const rx = (i * 127) % 2048;
      const ry = (i * 91) % 1024;
      const rad = 120 + ((i * 37) % 180);
      const radGrad = ctx.createRadialGradient(rx, ry, 10, rx, ry, rad);
      radGrad.addColorStop(0, "rgba(255, 183, 197, 0.22)");
      radGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Ornate Double Gold Borders with Corner Scrolls
    ctx.save();
    // Outer Gold Border
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 14;
    ctx.strokeRect(48, 48, 1952, 928);

    // Inner Delicate Gold Border
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.strokeRect(68, 68, 1912, 888);

    // Corner Ornate Filigree
    const corners = [
      { x: 68, y: 68, dx: 1, dy: 1 },
      { x: 1980, y: 68, dx: -1, dy: 1 },
      { x: 68, y: 956, dx: 1, dy: -1 },
      { x: 1980, y: 956, dx: -1, dy: -1 },
    ];
    corners.forEach((c) => {
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * 75);
      ctx.lineTo(c.x + c.dx * 75, c.y);
      ctx.stroke();

      // Corner Sakura Flower Motif
      this.drawSakuraFlower(ctx, c.x + c.dx * 36, c.y + c.dy * 36, 22);
    });
    ctx.restore();

    // 4. Floating Decorative Cherry Blossom Petals scattered across canvas
    for (let p = 0; p < 24; p++) {
      const px = 120 + ((p * 179) % 1800);
      const py = 120 + ((p * 137) % 780);
      const pr = 10 + (p % 4) * 3;
      const pAngle = (p * 0.6);
      this.drawPetal(ctx, px, py, pr, pAngle);
    }

    // 5. Top Ribbon / Heading Flourish
    ctx.save();
    ctx.fillStyle = "#e0a96d";
    ctx.font = "bold 32px 'Quicksand', -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🌸  ✦  A  P R O M I S E  U N D E R  T H E  S A K U R A  ✦  🌸", 1024, 210);
    ctx.restore();

    // 6. EXACT PRIMARY TEXT: "CYRIL, CAN I COURT YOU?"
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Text Shadow / Anime Glow
    ctx.shadowColor = "rgba(255, 105, 140, 0.55)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Font setup: Bold, crisp, romantic anime typography
    ctx.font = "900 86px 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Outline stroke for readability
    ctx.strokeStyle = "#ffd54f"; // Warm gold rim
    ctx.lineWidth = 8;
    ctx.strokeText("CYRIL, ARE YOU OPEN FOR COURTS?", 1024, 430);

    // Main Fill: Deep romantic wine/plum
    ctx.fillStyle = "#3b1120";
    ctx.fillText("CYRIL, ARE YOU OPEN FOR COURTS?", 1024, 430);
    ctx.restore();

    // 7. Romantic Decorative Floral Divider
    ctx.save();
    // Left divider line
    const leftGrad = ctx.createLinearGradient(480, 570, 930, 570);
    leftGrad.addColorStop(0, "rgba(212, 175, 55, 0)");
    leftGrad.addColorStop(1, "rgba(212, 175, 55, 0.9)");
    ctx.strokeStyle = leftGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(480, 570);
    ctx.lineTo(930, 570);
    ctx.stroke();

    // Center Flower
    this.drawSakuraFlower(ctx, 1024, 570, 24);

    // Right divider line
    const rightGrad = ctx.createLinearGradient(1118, 570, 1568, 570);
    rightGrad.addColorStop(0, "rgba(212, 175, 55, 0.9)");
    rightGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.strokeStyle = rightGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1118, 570);
    ctx.lineTo(1568, 570);
    ctx.stroke();
    ctx.restore();

    // 8. EXACT SIGNATURE: "Sincerely, Klint."
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    // Elegant Calligraphic Serif Italic
    ctx.font = "italic 700 66px 'Quicksand', Georgia, serif";
    ctx.fillStyle = "#6d1f35";
    ctx.fillText("Sincerely, Klint.", 1024, 710);
    ctx.restore();

    // 9. Create Three.js Texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  private drawSakuraFlower(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    ctx.save();
    ctx.fillStyle = "#ff85a2";
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * (r * 0.7);
      const py = cy + Math.sin(angle) * (r * 0.7);
      ctx.beginPath();
      ctx.arc(px, py, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flower center
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(255, 183, 197, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.6, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Start smooth fade-in and lighting reveal of the billboard
   */
  public reveal(duration: number = 2.0) {
    this.isRevealed = true;
    this.revealDuration = duration;
    this.revealProgress = 0;
  }

  public getIsRevealed(): boolean {
    return this.isRevealed;
  }

  public update(delta: number) {
    if (this.isRevealed && this.revealProgress < 1.0) {
      this.revealProgress = Math.min(1.0, this.revealProgress + delta / this.revealDuration);
      // Smooth sinusoidal ease-out
      const ease = Math.sin((this.revealProgress * Math.PI) / 2);

      this.boardMat.opacity = ease;
      this.woodMat.opacity = ease;
      this.frameMat.opacity = ease;
      this.goldMat.opacity = ease;
      this.lanternMat.opacity = ease;
      this.lanternMat.emissiveIntensity = ease * 1.8;

      this.spotlight.intensity = ease * 4.6;
      this.pointLight.intensity = ease * 2.8;
      this.petalMat.opacity = ease * 0.85;
    }

    // Gentle floating particle drift
    if (this.petalParticles && this.isRevealed) {
      const posAttr = this.petalGeo.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= delta * 0.25; // drift down
        arr[i] += Math.sin(arr[i + 1] * 2.0) * delta * 0.15; // flutter
        if (arr[i + 1] < -2.5) {
          arr[i + 1] = 2.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  }
}
