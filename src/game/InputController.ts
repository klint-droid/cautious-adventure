/**
 * InputController.ts
 * Captures keyboard movement, sprint, interaction prompts,
 * mouse look, and camera zoom controls.
 */

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  interact: boolean;
  pause: boolean;
}

export class InputController {
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    interact: false,
    pause: false,
  };

  public mouseDeltaX = 0;
  public mouseDeltaY = 0;
  public mouseWheelDelta = 0;
  public isRightMouseDown = false;
  public isPointerLocked = false;

  private onInteractCallbacks: Array<() => void> = [];
  private onPauseCallbacks: Array<() => void> = [];

  constructor() {
    this.initKeyboard();
    this.initMouse();
  }

  public onInteract(cb: () => void) {
    this.onInteractCallbacks.push(cb);
  }

  public onPause(cb: () => void) {
    this.onPauseCallbacks.push(cb);
  }

  private initKeyboard() {
    window.addEventListener("keydown", (e) => {
      // Don't intercept if typing in an input
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          this.state.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          this.state.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.state.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          this.state.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          this.state.sprint = true;
          break;
        case "KeyE":
          if (!this.state.interact) {
            this.state.interact = true;
            this.onInteractCallbacks.forEach((cb) => cb());
          }
          break;
        case "Escape":
          this.state.pause = true;
          this.onPauseCallbacks.forEach((cb) => cb());
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          this.state.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          this.state.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.state.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          this.state.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          this.state.sprint = false;
          break;
        case "KeyE":
          this.state.interact = false;
          break;
        case "Escape":
          this.state.pause = false;
          break;
      }
    });
  }

  private initMouse() {
    window.addEventListener("mousedown", (e) => {
      if (e.button === 2) {
        this.isRightMouseDown = true;
      } else if (e.button === 0 && !this.isPointerLocked) {
        // Left click drag also controls camera if clicked on canvas
        if ((e.target as HTMLElement).tagName === "CANVAS") {
          this.isRightMouseDown = true;
        }
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 2 || e.button === 0) {
        this.isRightMouseDown = false;
      }
    });

    window.addEventListener("contextmenu", (e) => {
      if ((e.target as HTMLElement).tagName === "CANVAS") {
        e.preventDefault();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isRightMouseDown || this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });

    window.addEventListener("wheel", (e) => {
      this.mouseWheelDelta += Math.sign(e.deltaY) * 0.5;
    }, { passive: true });
  }

  public resetDeltas() {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.mouseWheelDelta = 0;
  }
}
