/**
 * AnimeModelFactory.ts
 * Builds beautiful, expressive, cel-shaded 3D anime characters
 * (Female Protagonist & Male NPC Ren Takahiro) with full skeletal joint hierarchies
 * for procedural animation, toon shaders, and optional external VRM/GLTF loading.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM } from "@pixiv/three-vrm";

export interface AnimeCharacterRig {
  root: THREE.Group;
  meshGroup: THREE.Group;
  bones: {
    hips: THREE.Group;
    spine: THREE.Group;
    chest: THREE.Group;
    neck: THREE.Group;
    head: THREE.Group;
    hairBangs?: THREE.Group;
    hairPony?: THREE.Group;
    leftUpperArm: THREE.Group;
    leftForearm: THREE.Group;
    leftHand: THREE.Group;
    rightUpperArm: THREE.Group;
    rightForearm: THREE.Group;
    rightHand: THREE.Group;
    leftUpperLeg: THREE.Group;
    leftLowerLeg: THREE.Group;
    leftFoot: THREE.Group;
    rightUpperLeg: THREE.Group;
    rightLowerLeg: THREE.Group;
    rightFoot: THREE.Group;
  };
  blushMeshes: THREE.Mesh[];
  eyeMeshes: THREE.Mesh[];
  vrm?: VRM;
}

// Generate a 4-tone stepped gradient map for Three.js MeshToonMaterial (Anime Cel-Shading)
export function createToonGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  // 4 steps: Deep Shadow -> Midtone -> Base Tone -> Specular Highlight
  const colors = ["#8a7b90", "#bfaec2", "#e8dbed", "#ffffff"];
  colors.forEach((col, idx) => {
    ctx.fillStyle = col;
    ctx.fillRect(idx, 0, 1, 1);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export class AnimeModelFactory {
  private gradientMap: THREE.CanvasTexture;

  constructor() {
    this.gradientMap = createToonGradientTexture();
  }

  // --- Material Helper for Cel-Shaded Anime Look ---
  public createToonMaterial(color: THREE.ColorRepresentation): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap: this.gradientMap,
    });
  }

  // --- Create Expressive Anime Eye Canvas Texture ---
  private createAnimeEyeTexture(irisColor: string, pupilColor: string): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Sclera (White)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(128, 128, 110, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris Gradient
    const grad = ctx.createLinearGradient(128, 40, 128, 220);
    grad.addColorStop(0, pupilColor);
    grad.addColorStop(0.5, irisColor);
    grad.addColorStop(1, "#fff1f8");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(128, 136, 75, 88, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = pupilColor;
    ctx.beginPath();
    ctx.ellipse(128, 140, 42, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparkling anime specular highlights
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(105, 95, 22, 28, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(155, 175, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(145, 90, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyelash line top
    ctx.fillStyle = "#2d2335";
    ctx.beginPath();
    ctx.ellipse(128, 40, 95, 18, 0, Math.PI, 0);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Build Female Protagonist Anime Character
   * Includes stylized twin-tails/ponytail hair, sailor collar cardigan,
   * pleated skirt, knee-high socks, and full joint rig.
   */
  public buildFemaleProtagonist(): AnimeCharacterRig {
    const root = new THREE.Group();
    root.name = "Player_Rig";
    const meshGroup = new THREE.Group();
    root.add(meshGroup);

    // Materials
    const skinMat = this.createToonMaterial("#ffe2d2");
    const hairMat = this.createToonMaterial("#ff85a2"); // Soft cherry blossom pink hair
    const hairRibbonMat = this.createToonMaterial("#880e4f");
    const shirtMat = this.createToonMaterial("#ffffff");
    const cardiganMat = this.createToonMaterial("#5c6bc0"); // Soft periwinkle cardigan
    const skirtMat = this.createToonMaterial("#3949ab"); // Darker navy pleated skirt
    const sockMat = this.createToonMaterial("#263238"); // Charcoal thigh-high socks
    const shoeMat = this.createToonMaterial("#8d6e63"); // Brown loafers
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff4081, transparent: true, opacity: 0.55 });

    // Eye texture
    const eyeTex = this.createAnimeEyeTexture("#ab47bc", "#4a148c"); // Purple-violet anime eyes
    const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTex });

    // --- Bone Joint Hierarchy ---
    const hips = new THREE.Group();
    hips.position.y = 0.95;
    meshGroup.add(hips);

    const spine = new THREE.Group();
    spine.position.y = 0.12;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.18;
    spine.add(chest);

    const neck = new THREE.Group();
    neck.position.y = 0.22;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.12;
    neck.add(head);

    // Hair bones
    const hairBangs = new THREE.Group();
    head.add(hairBangs);
    const hairPony = new THREE.Group();
    hairPony.position.set(0, 0.08, -0.15);
    head.add(hairPony);

    // Arms
    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.set(0.24, 0.16, 0);
    chest.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.24, 0);
    leftUpperArm.add(leftForearm);

    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.22, 0);
    leftForearm.add(leftHand);

    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.set(-0.24, 0.16, 0);
    chest.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.24, 0);
    rightUpperArm.add(rightForearm);

    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.22, 0);
    rightForearm.add(rightHand);

    // Legs
    const leftUpperLeg = new THREE.Group();
    leftUpperLeg.position.set(0.12, -0.05, 0);
    hips.add(leftUpperLeg);

    const leftLowerLeg = new THREE.Group();
    leftLowerLeg.position.set(0, -0.42, 0);
    leftUpperLeg.add(leftLowerLeg);

    const leftFoot = new THREE.Group();
    leftFoot.position.set(0, -0.42, 0.04);
    leftLowerLeg.add(leftFoot);

    const rightUpperLeg = new THREE.Group();
    rightUpperLeg.position.set(-0.12, -0.05, 0);
    hips.add(rightUpperLeg);

    const rightLowerLeg = new THREE.Group();
    rightLowerLeg.position.set(0, -0.42, 0);
    rightUpperLeg.add(rightLowerLeg);

    const rightFoot = new THREE.Group();
    rightFoot.position.set(0, -0.42, 0.04);
    rightLowerLeg.add(rightFoot);

    // --- Mesh Geometries Attached to Bones ---

    // 1. Torso & Clothes
    const hipsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 16), skirtMat);
    hipsMesh.castShadow = true;
    hips.add(hipsMesh);

    // Pleated Skirt (Flared cone)
    const skirtMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.26, 20, 1, true), skirtMat);
    skirtMesh.position.y = -0.08;
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);

    // Torso (Spine + Cardigan)
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.32, 16), cardiganMat);
    torsoMesh.position.y = 0.08;
    torsoMesh.castShadow = true;
    chest.add(torsoMesh);

    // Shirt Collar
    const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.08, 12), shirtMat);
    collarMesh.position.y = 0.22;
    chest.add(collarMesh);

    // Ribbon Bow
    const ribbonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.04), hairRibbonMat);
    ribbonMesh.position.set(0, 0.18, 0.15);
    chest.add(ribbonMesh);

    // 2. Head & Anime Face
    const headGeom = new THREE.SphereGeometry(0.17, 24, 24);
    headGeom.scale(1.0, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Anime Eyes (Planes with eye texture curved onto front of face)
    const eyeGeom = new THREE.PlaneGeometry(0.085, 0.085);
    const eyeMeshes: THREE.Mesh[] = [];

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.062, 0.01, 0.165);
    leftEye.rotation.y = 0.15;
    head.add(leftEye);
    eyeMeshes.push(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.062, 0.01, 0.165);
    rightEye.rotation.y = -0.15;
    head.add(rightEye);
    eyeMeshes.push(rightEye);

    // Anime Blush
    const blushGeom = new THREE.PlaneGeometry(0.06, 0.03);
    const blushMeshes: THREE.Mesh[] = [];

    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(0.09, -0.05, 0.158);
    leftBlush.rotation.y = 0.28;
    head.add(leftBlush);
    blushMeshes.push(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(-0.09, -0.05, 0.158);
    rightBlush.rotation.y = -0.28;
    head.add(rightBlush);
    blushMeshes.push(rightBlush);

    // Stylized Anime Hair (Bangs, Side Tufts, Back Hair)
    const hairCapGeom = new THREE.SphereGeometry(0.19, 20, 20);
    hairCapGeom.scale(1.04, 1.15, 1.05);
    const hairCap = new THREE.Mesh(hairCapGeom, hairMat);
    hairCap.position.set(0, 0.04, -0.03);
    head.add(hairCap);

    // Bangs strands
    for (let i = -3; i <= 3; i++) {
      const bang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), hairMat);
      bang.position.set(i * 0.04, 0.08, 0.16);
      bang.rotation.x = Math.PI + 0.2;
      bang.rotation.z = i * 0.08;
      hairBangs.add(bang);
    }

    // High Ponytail / Twin-Tails
    const ponyCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 10), hairMat);
    ponyCone.position.set(0, -0.22, 0);
    ponyCone.rotation.x = 0.25;
    hairPony.add(ponyCone);

    const hairRibbon = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), hairRibbonMat);
    hairRibbon.rotation.x = Math.PI / 2;
    hairPony.add(hairRibbon);

    // 3. Arms & Hands
    const armGeom = new THREE.CylinderGeometry(0.05, 0.045, 0.24, 12);
    armGeom.translate(0, -0.12, 0);

    const leftArmMesh = new THREE.Mesh(armGeom, cardiganMat);
    leftUpperArm.add(leftArmMesh);
    const rightArmMesh = new THREE.Mesh(armGeom, cardiganMat);
    rightUpperArm.add(rightArmMesh);

    const forearmGeom = new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12);
    forearmGeom.translate(0, -0.11, 0);

    const leftForeMesh = new THREE.Mesh(forearmGeom, skinMat);
    leftForearm.add(leftForeMesh);
    const rightForeMesh = new THREE.Mesh(forearmGeom, skinMat);
    rightForearm.add(rightForeMesh);

    const handGeom = new THREE.SphereGeometry(0.04, 8, 8);
    const leftHandMesh = new THREE.Mesh(handGeom, skinMat);
    leftHand.add(leftHandMesh);
    const rightHandMesh = new THREE.Mesh(handGeom, skinMat);
    rightHand.add(rightHandMesh);

    // 4. Legs & Shoes
    const thighGeom = new THREE.CylinderGeometry(0.07, 0.055, 0.42, 12);
    thighGeom.translate(0, -0.21, 0);

    const leftThigh = new THREE.Mesh(thighGeom, skinMat);
    leftUpperLeg.add(leftThigh);
    const rightThigh = new THREE.Mesh(thighGeom, skinMat);
    rightUpperLeg.add(rightThigh);

    const calfGeom = new THREE.CylinderGeometry(0.055, 0.045, 0.42, 12);
    calfGeom.translate(0, -0.21, 0);

    const leftCalf = new THREE.Mesh(calfGeom, sockMat);
    leftLowerLeg.add(leftCalf);
    const rightCalf = new THREE.Mesh(calfGeom, sockMat);
    rightLowerLeg.add(rightCalf);

    const footGeom = new THREE.BoxGeometry(0.09, 0.07, 0.17);
    footGeom.translate(0, -0.035, 0.04);

    const leftFootMesh = new THREE.Mesh(footGeom, shoeMat);
    leftFoot.add(leftFootMesh);
    const rightFootMesh = new THREE.Mesh(footGeom, shoeMat);
    rightFoot.add(rightFootMesh);

    return {
      root,
      meshGroup,
      bones: {
        hips,
        spine,
        chest,
        neck,
        head,
        hairBangs,
        hairPony,
        leftUpperArm,
        leftForearm,
        leftHand,
        rightUpperArm,
        rightForearm,
        rightHand,
        leftUpperLeg,
        leftLowerLeg,
        leftFoot,
        rightUpperLeg,
        rightLowerLeg,
        rightFoot,
      },
      blushMeshes,
      eyeMeshes,
    };
  }

  /**
   * Build Male NPC Anime Character ("Ren Takahiro")
   * Includes stylish tousled anime hair, layered open cardigan, casual trousers,
   * sneakers, and sketchbook accessory.
   */
  public buildMaleNPC(): AnimeCharacterRig {
    const root = new THREE.Group();
    root.name = "Klint_Rig";
    const meshGroup = new THREE.Group();
    root.add(meshGroup);

    // Materials
    const skinMat = this.createToonMaterial("#ffe7d8");
    const hairMat = this.createToonMaterial("#2e1c2b"); // Deep espresso brown anime hair
    const shirtMat = this.createToonMaterial("#fdfbf7"); // Cream inner t-shirt
    const jacketMat = this.createToonMaterial("#37474f"); // Dark slate open jacket
    const pantsMat = this.createToonMaterial("#455a64"); // Casual trousers
    const shoeMat = this.createToonMaterial("#ffffff"); // White sneakers with brown trim
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff3d00, transparent: true, opacity: 0.0 }); // Starts subtle
    const bookMat = this.createToonMaterial("#8d6e63"); // Leather sketchbook
    const pageMat = this.createToonMaterial("#fff9c4");

    // Eye texture
    const eyeTex = this.createAnimeEyeTexture("#ffb300", "#3e2723"); // Warm amber-hazel anime eyes
    const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTex });

    // --- Bone Joint Hierarchy ---
    const hips = new THREE.Group();
    hips.position.y = 1.02;
    meshGroup.add(hips);

    const spine = new THREE.Group();
    spine.position.y = 0.14;
    hips.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.22;
    spine.add(chest);

    const neck = new THREE.Group();
    neck.position.y = 0.22;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.13;
    neck.add(head);

    const hairBangs = new THREE.Group();
    head.add(hairBangs);

    // Arms
    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.set(0.28, 0.18, 0);
    chest.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.27, 0);
    leftUpperArm.add(leftForearm);

    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.24, 0);
    leftForearm.add(leftHand);

    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.set(-0.28, 0.18, 0);
    chest.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.27, 0);
    rightUpperArm.add(rightForearm);

    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.24, 0);
    rightForearm.add(rightHand);

    // Legs
    const leftUpperLeg = new THREE.Group();
    leftUpperLeg.position.set(0.14, -0.06, 0);
    hips.add(leftUpperLeg);

    const leftLowerLeg = new THREE.Group();
    leftLowerLeg.position.set(0, -0.46, 0);
    leftUpperLeg.add(leftLowerLeg);

    const leftFoot = new THREE.Group();
    leftFoot.position.set(0, -0.46, 0.05);
    leftLowerLeg.add(leftFoot);

    const rightUpperLeg = new THREE.Group();
    rightUpperLeg.position.set(-0.14, -0.06, 0);
    hips.add(rightUpperLeg);

    const rightLowerLeg = new THREE.Group();
    rightLowerLeg.position.set(0, -0.46, 0);
    rightUpperLeg.add(rightLowerLeg);

    const rightFoot = new THREE.Group();
    rightFoot.position.set(0, -0.46, 0.05);
    rightLowerLeg.add(rightFoot);

    // --- Mesh Geometries ---
    // Torso (Layered Jacket & Shirt)
    const hipsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.18, 16), pantsMat);
    hips.add(hipsMesh);

    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.38, 16), shirtMat);
    torsoMesh.position.y = 0.1;
    chest.add(torsoMesh);

    // Open Jacket sides
    const leftJacket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.26), jacketMat);
    leftJacket.position.set(0.14, 0.08, 0.01);
    chest.add(leftJacket);

    const rightJacket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.26), jacketMat);
    rightJacket.position.set(-0.14, 0.08, 0.01);
    chest.add(rightJacket);

    // Head & Face
    const headGeom = new THREE.SphereGeometry(0.18, 24, 24);
    headGeom.scale(1.0, 1.18, 1.08);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    head.add(headMesh);

    // Eyes
    const eyeGeom = new THREE.PlaneGeometry(0.082, 0.082);
    const eyeMeshes: THREE.Mesh[] = [];

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.064, 0.01, 0.178);
    leftEye.rotation.y = 0.14;
    head.add(leftEye);
    eyeMeshes.push(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.064, 0.01, 0.178);
    rightEye.rotation.y = -0.14;
    head.add(rightEye);
    eyeMeshes.push(rightEye);

    // Blush
    const blushGeom = new THREE.PlaneGeometry(0.07, 0.035);
    const blushMeshes: THREE.Mesh[] = [];

    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(0.09, -0.06, 0.17);
    leftBlush.rotation.y = 0.25;
    head.add(leftBlush);
    blushMeshes.push(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(-0.09, -0.06, 0.17);
    rightBlush.rotation.y = -0.25;
    head.add(rightBlush);
    blushMeshes.push(rightBlush);

    // Tousled Anime Boy Hair
    const hairCapGeom = new THREE.SphereGeometry(0.21, 20, 20);
    hairCapGeom.scale(1.03, 1.12, 1.05);
    const hairCap = new THREE.Mesh(hairCapGeom, hairMat);
    hairCap.position.set(0, 0.06, -0.03);
    head.add(hairCap);

    // Tousled spikes
    const spikePositions = [
      { x: -0.08, y: 0.12, z: 0.16, rx: 2.8, rz: 0.2 },
      { x: 0.0, y: 0.14, z: 0.18, rx: 2.9, rz: -0.1 },
      { x: 0.08, y: 0.11, z: 0.17, rx: 2.8, rz: -0.3 },
      { x: -0.14, y: 0.05, z: 0.14, rx: 2.6, rz: 0.5 },
      { x: 0.14, y: 0.04, z: 0.14, rx: 2.6, rz: -0.5 },
    ];
    spikePositions.forEach((pos) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 6), hairMat);
      spike.position.set(pos.x, pos.y, pos.z);
      spike.rotation.x = pos.rx;
      spike.rotation.z = pos.rz;
      hairBangs.add(spike);
    });

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.06, 0.055, 0.27, 12);
    armGeom.translate(0, -0.135, 0);

    const leftArmMesh = new THREE.Mesh(armGeom, jacketMat);
    leftUpperArm.add(leftArmMesh);
    const rightArmMesh = new THREE.Mesh(armGeom, jacketMat);
    rightUpperArm.add(rightArmMesh);

    const forearmGeom = new THREE.CylinderGeometry(0.055, 0.05, 0.26, 12);
    forearmGeom.translate(0, -0.13, 0);

    const leftForeMesh = new THREE.Mesh(forearmGeom, shirtMat);
    leftForearm.add(leftForeMesh);
    const rightForeMesh = new THREE.Mesh(forearmGeom, shirtMat);
    rightForearm.add(rightForeMesh);

    const handGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const leftHandMesh = new THREE.Mesh(handGeom, skinMat);
    leftHand.add(leftHandMesh);
    const rightHandMesh = new THREE.Mesh(handGeom, skinMat);
    rightHand.add(rightHandMesh);

    // Sketchbook accessory tucked under left arm
    const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.18), bookMat);
    const bookPages = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.16), pageMat);
    bookMesh.add(bookPages);
    bookMesh.position.set(0.08, -0.05, 0.04);
    bookMesh.rotation.z = 0.2;
    leftForearm.add(bookMesh);

    // Legs
    const thighGeom = new THREE.CylinderGeometry(0.08, 0.065, 0.46, 12);
    thighGeom.translate(0, -0.23, 0);

    const leftThigh = new THREE.Mesh(thighGeom, pantsMat);
    leftUpperLeg.add(leftThigh);
    const rightThigh = new THREE.Mesh(thighGeom, pantsMat);
    rightUpperLeg.add(rightThigh);

    const calfGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.46, 12);
    calfGeom.translate(0, -0.23, 0);

    const leftCalf = new THREE.Mesh(calfGeom, pantsMat);
    leftLowerLeg.add(leftCalf);
    const rightCalf = new THREE.Mesh(calfGeom, pantsMat);
    rightLowerLeg.add(rightCalf);

    const footGeom = new THREE.BoxGeometry(0.1, 0.08, 0.22);
    footGeom.translate(0, -0.04, 0.06);

    const leftFootMesh = new THREE.Mesh(footGeom, shoeMat);
    leftFoot.add(leftFootMesh);
    const rightFootMesh = new THREE.Mesh(footGeom, shoeMat);
    rightFoot.add(rightFootMesh);

    return {
      root,
      meshGroup,
      bones: {
        hips,
        spine,
        chest,
        neck,
        head,
        hairBangs,
        leftUpperArm,
        leftForearm,
        leftHand,
        rightUpperArm,
        rightForearm,
        rightHand,
        leftUpperLeg,
        leftLowerLeg,
        leftFoot,
        rightUpperLeg,
        rightLowerLeg,
        rightFoot,
      },
      blushMeshes,
      eyeMeshes,
    };
  }

  /**
   * Optional Loader for custom external VRM/GLTF models
   * Loads from `path` (e.g. `/assets/avatar.vrm`) if available,
   * falling back to procedurally generated anime characters.
   */
  public async loadVRM(url: string): Promise<VRM | null> {
    try {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      const gltf = await loader.loadAsync(url);
      const vrm = gltf.userData.vrm as VRM;
      if (vrm) {
        // VRM 0.0 vs 1.0 orientation
        vrm.scene.rotation.y = Math.PI;
        return vrm;
      }
    } catch (e) {
      console.info(`VRM asset not present at ${url}; using stylized anime procedural model.`);
    }
    return null;
  }
}
