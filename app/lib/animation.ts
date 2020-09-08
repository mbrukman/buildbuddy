import { clamp } from "./math";
import { TimeDelta } from "./time";

export class AnimationLoop {
  private dt = new TimeDelta();

  constructor(private callback: (dt: number) => void, private enabled_ = false) {
    if (enabled_) {
      this.start();
    }
  }

  private loop() {
    if (!this.enabled_ || this.isNextFrameScheduled) return;

    this.dt.update();
    this.callback(this.dt.get());
    this.scheduleNextFrame();
  }

  private isNextFrameScheduled = false;
  private scheduleNextFrame() {
    if (this.isNextFrameScheduled) return;
    this.isNextFrameScheduled = true;
    requestAnimationFrame(() => {
      this.isNextFrameScheduled = false;
      this.loop();
    });
  }

  start() {
    this.enabled_ = true;
    this.loop();
  }

  stop() {
    this.enabled_ = false;
    this.dt.reset();
  }
}

export class AnimatedValue {
  private target_: number;
  private value_: number;
  private min_: number;
  private max_: number;

  constructor(
    target: number,
    { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}
  ) {
    this.min_ = min;
    this.max_ = max;
    this.target_ = clamp(target, min, max);
    this.value_ = this.target_;
  }

  set target(target: number) {
    this.target_ = clamp(target, this.min_, this.max_);
  }
  get target() {
    return this.target_;
  }

  set value(value: number) {
    this.value_ = clamp(value, this.min_, this.max_);
  }
  get value() {
    return this.value_;
  }

  set min(min: number) {
    // Ensure min <= max
    min = Math.min(this.max_, min);
    this.min_ = min;
    this.value_ = Math.max(min, this.value_);
    this.target_ = Math.max(min, this.target_);
  }
  get min() {
    return this.min_;
  }

  set max(max: number) {
    // Ensure max >= min
    max = Math.max(this.min_, max);
    this.max_ = max;
    this.value_ = Math.min(max, this.value);
    this.target_ = Math.min(max, this.target_);
  }
  get max() {
    return this.max_;
  }

  step(dt: number, { p = 0.02, e = 0.01 } = {}) {
    const error = this.target_ - this.value_;
    const correction = error * dt * p;

    if (Math.abs(correction) > Math.abs(error) || Math.abs(this.value_ - this.target_) < e) {
      this.value_ = this.target_;
    } else {
      this.value_ = this.value_ + correction;
    }

    this.value_ = clamp(this.value_, this.min_, this.max_);
  }

  toString() {
    return String(this.value_);
  }

  get isAtTarget() {
    return this.value_ === this.target_;
  }

  toJson() {
    return {
      value: this.value_,
      target: this.target_,
      isAtTarget: this.isAtTarget,
      min: this.min_,
      max: this.max_,
    };
  }
}
