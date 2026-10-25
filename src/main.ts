/**
 * main.ts
 * Entry point for Sakura Moments — Anime 3D Courtship Open World.
 */

import "./style.css";
import { Game } from "./game/Game";

window.addEventListener("DOMContentLoaded", () => {
  const game = new Game("canvas-container");
  game.start();
});
