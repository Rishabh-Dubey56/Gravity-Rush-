import { VehicleInputs } from './VehiclePhysics';

export class VehicleController {
  private inputs: VehicleInputs;
  private keyState: Record<string, boolean> = {};
  private onGravitySwitchCb?: () => void;
  private onCameraToggleCb?: () => void;
  private onPauseCb?: () => void;

  constructor() {
    this.inputs = {
      throttle: 0,
      brake: 0,
      steer: 0,
      nitro: false,
      handbrake: false,
      recover: false,
    };

    this.bindEvents();
  }

  private isTyping(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    const tagName = target.tagName.toUpperCase();
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isTyping(e)) return;

    const code = e.code;
    this.keyState[code] = true;

    if (code === 'KeyG' && !e.repeat) {
      this.onGravitySwitchCb?.();
    }
    if (code === 'KeyC' && !e.repeat) {
      this.onCameraToggleCb?.();
    }
    if (code === 'Escape' && !e.repeat) {
      this.onPauseCb?.();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const code = e.code;
    this.keyState[code] = false;
  };

  private onBlur = () => {
    this.keyState = {};
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.keyState = {};
  }

  public onGravitySwitch(cb: () => void) {
    this.onGravitySwitchCb = cb;
  }

  public onCameraToggle(cb: () => void) {
    this.onCameraToggleCb = cb;
  }

  public onPause(cb: () => void) {
    this.onPauseCb = cb;
  }

  public getInputs(): VehicleInputs {
    // Throttle: W, ArrowUp
    const throttle = this.keyState['KeyW'] || this.keyState['ArrowUp'] ? 1 : 0;

    // Brake / Reverse: S, ArrowDown
    const brake = this.keyState['KeyS'] || this.keyState['ArrowDown'] ? 1 : 0;

    // Steer: A / ArrowLeft (-1), D / ArrowRight (+1)
    let steer = 0;
    if (this.keyState['KeyA'] || this.keyState['ArrowLeft']) steer -= 1;
    if (this.keyState['KeyD'] || this.keyState['ArrowRight']) steer += 1;

    // Nitro: Space
    const nitro = !!this.keyState['Space'];

    // Handbrake: ShiftLeft, ShiftRight
    const handbrake = !!(this.keyState['ShiftLeft'] || this.keyState['ShiftRight']);

    // Recover: KeyR
    const recover = !!this.keyState['KeyR'];

    this.inputs.throttle = throttle;
    this.inputs.brake = brake;
    this.inputs.steer = steer;
    this.inputs.nitro = nitro;
    this.inputs.handbrake = handbrake;
    this.inputs.recover = recover;

    return this.inputs;
  }
}
