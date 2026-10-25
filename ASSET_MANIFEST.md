# Asset Manifest & Technical Documentation — Sakura Moments (Anime 3D Courtship Open World)

## 1. Overview

**Sakura Moments** is a browser-based, playable anime 3D open-world courtship simulation crafted with Three.js and TypeScript. All 3D meshes, anime characters, cel-shaded toon materials, dynamic particle systems, and audio are engineered locally with zero fragile external CDN dependencies or broken assets.

The game also features an automated loader pipeline supporting external standard `.vrm` anime character models and `.glb` environments via `@pixiv/three-vrm` and `GLTFLoader`.

---

## 2. Manifest of Built-in Assets & Procedural Generators

| Asset Name | Local File Path / Module | Source / Creation Method | License & Attribution | Optimization & Format Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Female Protagonist Anime Rig** | `src/characters/AnimeModelFactory.ts` (`buildFemaleProtagonist`) | Custom procedural geometry & anime joint hierarchy (Three.js) | MIT (Sakura Moments Project) | Hierarchical bone rig (hips, spine, chest, neck, head, hair physics bones, limbs). Cel-shaded `MeshToonMaterial` with custom 4-tone stepped gradient map. |
| **Male NPC "Ren Takahiro" Rig** | `src/characters/AnimeModelFactory.ts` (`buildMaleNPC`) | Custom procedural geometry & anime joint hierarchy (Three.js) | MIT (Sakura Moments Project) | Complete anime male model with tousled hair spikes, layered jacket, slacks, and sketchbook accessory. Includes blush mesh with alpha modulation. |
| **Anime Expressive Eye Textures** | `src/characters/AnimeModelFactory.ts` (`createAnimeEyeTexture`) | Dynamic Canvas 2D procedural gradient & specular generator | MIT (Sakura Moments Project) | 256x256 CanvasTexture generated at runtime. Sclera, iris gradient, pupil, and multi-layer anime specular highlights. Color space: `sRGB`. |
| **Cel-Shading 4-Tone Gradient Map** | `src/characters/AnimeModelFactory.ts` (`createToonGradientTexture`) | Custom stepped ramp texture generator (Three.js) | MIT (Sakura Moments Project) | 4x1 NearestFilter canvas texture with discrete shadow, midtone, and highlight steps for crisp cel-shading. |
| **Expressive Emotion Portraits (Ren)** | `src/ui/DialogueUI.ts` (`setPortrait`) | Custom inline SVG vector portraits | MIT (Sakura Moments Project) | Vector SVG portraits for emotions: `neutral`, `smiling`, `blushing`, `thinking`, `surprised`, `happy`. Scalable, 0 KB external footprint. |
| **Great Sakura & Cherry Trees** | `src/world/FloraBuilder.ts` (`createSakuraTree`) | Stylized multi-tiered geodesic canopy meshes & gnarled trunks | MIT (Sakura Moments Project) | Low-poly Dodecahedron canopies with contrasting soft and deep pink toon materials. Cylinder colliders registered automatically. |
| **Japanese Garden Pines & Maples** | `src/world/FloraBuilder.ts` (`createPineTree`) | Conical tiered canopy geometry | MIT (Sakura Moments Project) | Cel-shaded forest green materials with collision cylinders. |
| **Café Sakura Building & Terrace** | `src/world/CafeBuilder.ts` (`buildCafe`) | Modular architecture: walls, shingle roof, counter, terrace, espresso bar | MIT (Sakura Moments Project) | Accessible interior with wide doorway, polished hardwood floor, barista counter, pastry display, canvas chalkboard menu, and terrace parasols. |
| **Mirror Lake & Sunset Pier** | `src/world/LakeBuilder.ts` (`buildLakeAndPier`) | CircleGeometry water mesh, cedar plank boardwalk, hexagonal gazebo | MIT (Sakura Moments Project) | Translucent anime turquoise water material with animated specular color oscillation. Railing posts and pier pilings with collision boundaries. |
| **Taiko Bashi (Arched Footbridge)** | `src/world/LakeBuilder.ts` (`buildLakeAndPier`) | Arched segmented bridge with traditional vermilion red railings | MIT (Sakura Moments Project) | Traditional Japanese bridge arching over the garden water stream. |
| **Grand Torii Shrine Gate** | `src/world/ParkBuilder.ts` (`buildToriiGate`) | Vermilion cylindrical pillars, black stone plinths, curved Kasagi crossbeam | MIT (Sakura Moments Project) | Traditional entrance gateway marking the park boundary. |
| **Stone Lanterns (Toro)** | `src/world/ParkBuilder.ts` (`buildStoneLantern`) | Weathered stone tiered lanterns with warm amber point lights | MIT (Sakura Moments Project) | Self-illuminated inner light chambers with localized `PointLight` (range 6m). |
| **Falling Sakura Petal System** | `src/world/WeatherSystem.ts` (`WeatherSystem`) | InstancedMesh particle simulation (750 instances) | MIT (Sakura Moments Project) | Dynamic InstancedMesh with curl wind gusts, angular tumbling, and boundary wrapping. Single draw call. |
| **Romantic Piano BGM & Nature Audio** | `src/audio/SoundManager.ts` (`SoundManager`) | Procedural Web Audio API additive synth & biquad filtered oscillators | MIT (Sakura Moments Project) | Felted acoustic piano emulation, peaceful anime chord progression (Fmaj7-G6-Em7-Am7-Dm7-G7-Cmaj7), bird song FM chirps, and surface footsteps. |

---

## 3. External VRM & GLTF Model Support

The engine includes `@pixiv/three-vrm` and `three/examples/jsm/loaders/GLTFLoader.js` ready for drop-in custom models:
- **Directory**: `public/assets/`
- **Supported Formats**: `.vrm` (VRM 0.0 & 1.0), `.glb`, `.gltf`
- **Recommended Free Anime Asset Sources**:
  - [VRoid Hub](https://hub.vroid.com/) — Free CC-BY / CC0 humanoid anime avatars.
  - [Quaternius](https://quaternius.com/) — Free CC0 stylized nature, trees, buildings, and props.
  - [Poly Haven](https://polyhaven.com/) — CC0 environment textures and HDRI lighting.
- **Conversion / Optimization Guide**:
  1. Export character models as standard `.vrm` from VRoid Studio or Blender.
  2. For `.glb` props, run `gltf-pipeline -i model.glb -o model_opt.glb -d` (Draco compression).
  3. Place assets into `public/assets/` and load via `AnimeModelFactory.loadVRM()`.

---

## 4. Relationship & Courtship System Specifications

- **Affection Metric**: 0 – 100 (Progresses through Stranger, Acquaintance, Friend, Close Connection, Romantic Interest).
- **Trust Metric**: 0 – 100 (Unlocks deeper, more vulnerable conversation choices).
- **Memory Journal**: Tracks and recalls user preferences dynamically:
  - `favoriteDrink`: Referenced by Ren and Café Sakura.
  - `hobby`: Recalled when discussing art, books, photography, or music.
  - `dream`: Recalled during late-stage intimate conversations.
  - `favoriteSpot`: Recalled during scenic strolls.
- **Unlockable Date Activities**:
  - *A Serendipitous Encounter*: Central Sakura Plaza (Initial meeting)
  - *Afternoon at Café Sakura*: Café Terrace (Requires 25+ Affection)
  - *Lakeside Stroll*: Mirror Lake Boardwalk (Requires 45+ Affection)
  - *Shaded Conversation*: Hilltop Viewpoint Bench (Requires 65+ Affection)
  - *Sunset at the Pier*: Pier Gazebo at Golden Hour (Requires 85+ Affection — Romantic Confession)
- **Persistence**: Saved to `localStorage` under `sakura_moments_save` with auto-save and manual save/load options in the Pause Menu.
