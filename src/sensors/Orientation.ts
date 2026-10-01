// Laptop / Device Angle Sensor Manager with Smoothing & Fallbacks

export interface OrientationState {
  angle: number;           // Smooth angle in degrees (0 to 180)
  rawAngle: number;        // Unfiltered angle
  isSupported: boolean;    // Hardware/Browser support state
  hasPermission: boolean;  // Permission granted state
  sensorActive: boolean;   // Whether motion sensor is producing updates
  mode: 'sensor' | 'manual';
  statusText: string;
}

export type OrientationCallback = (state: OrientationState) => void;

class OrientationSensor {
  private angle: number = 72; // Default starting angle 72°
  private targetAngle: number = 72;
  private rawAngle: number = 72;
  private isSupported: boolean = false;
  private hasPermission: boolean = false;
  private sensorActive: boolean = false;
  private mode: 'sensor' | 'manual' = 'manual'; // Default to manual until sensor detected/enabled
  private statusText: string = 'Using Manual Angle';
  private callbacks: Set<OrientationCallback> = new Set();
  private smoothingTimer: number | null = null;
  private sensorTimeoutTimer: number | null = null;
  private lastSensorTimestamp: number = 0;

  constructor() {
    this.checkSupport();
    this.startSmoothingLoop();
  }

  private checkSupport(): void {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      this.isSupported = true;
      
      // If permission API exists (e.g. iOS Safari), prompt is required
      const deviceOrientationObj = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof deviceOrientationObj.requestPermission === 'function') {
        this.statusText = 'Motion access requires permission';
      } else {
        // Standard browsers - auto start listening
        this.hasPermission = true;
        this.startListening();
      }
    } else {
      this.isSupported = false;
      this.statusText = 'Motion sensor unavailable';
      this.mode = 'manual';
    }
  }

  /**
   * Request motion permission for modern iOS / Safari browsers
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    const deviceOrientationObj = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof deviceOrientationObj.requestPermission === 'function') {
      try {
        const res = await deviceOrientationObj.requestPermission();
        if (res === 'granted') {
          this.hasPermission = true;
          this.mode = 'sensor';
          this.startListening();
          this.notify();
          return true;
        } else {
          this.hasPermission = false;
          this.statusText = 'Permission denied - using manual mode';
          this.mode = 'manual';
          this.notify();
          return false;
        }
      } catch {
        this.hasPermission = false;
        this.statusText = 'Motion permission error';
        this.mode = 'manual';
        this.notify();
        return false;
      }
    } else {
      this.hasPermission = true;
      this.mode = 'sensor';
      this.startListening();
      this.notify();
      return true;
    }
  }

  /**
   * Start listening to window deviceorientation events
   */
  public startListening(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('deviceorientation', this.handleOrientation);
    window.addEventListener('deviceorientation', this.handleOrientation, true);

    // Watch for sensor timeout (if no orientation data arrives within 2 seconds)
    if (this.sensorTimeoutTimer) clearInterval(this.sensorTimeoutTimer);
    this.sensorTimeoutTimer = window.setInterval(() => {
      const now = Date.now();
      if (this.mode === 'sensor' && (now - this.lastSensorTimestamp > 3000)) {
        this.sensorActive = false;
        if (this.statusText !== 'Using Manual Angle') {
          this.statusText = 'No sensor motion detected (using manual slider)';
        }
        this.notify();
      }
    }, 1000);
  }

  private handleOrientation = (event: DeviceOrientationEvent): void => {
    // Check if beta axis is available
    if (event.beta === null && event.gamma === null) {
      return;
    }

    this.lastSensorTimestamp = Date.now();
    this.sensorActive = true;
    this.isSupported = true;

    // Use beta (front-back tilt) or fallback gamma
    let beta = event.beta ?? 0;
    
    // Normalize angle between 0° and 180°
    // 0° is flat/closed, 90° is upright, 180° is open flat
    let angle = Math.abs(beta);
    if (angle > 180) angle = 180;

    this.rawAngle = Math.round(angle);
    this.targetAngle = this.rawAngle;

    if (this.mode === 'sensor') {
      this.statusText = 'Sensor: Active';
    }
  };

  /**
   * Smooth loop (runs via setInterval/requestAnimationFrame for 60fps smoothing)
   */
  private startSmoothingLoop(): void {
    if (typeof window === 'undefined') return;

    const update = () => {
      // Exponential moving average for super smooth transitions
      const diff = this.targetAngle - this.angle;
      if (Math.abs(diff) > 0.1) {
        this.angle += diff * 0.15; // 15% interpolation per frame
      } else {
        this.angle = this.targetAngle;
      }
      this.notify();
    };

    if (this.smoothingTimer) clearInterval(this.smoothingTimer);
    this.smoothingTimer = window.setInterval(update, 1000 / 60); // 60 FPS update
  }

  /**
   * Set manual angle (used when mode is 'manual' or fallback slider is dragged)
   */
  public setManualAngle(angleDegrees: number): void {
    const clamped = Math.max(0, Math.min(180, Math.round(angleDegrees)));
    this.targetAngle = clamped;
    this.rawAngle = clamped;
    if (this.mode === 'manual') {
      this.statusText = 'Using Manual Angle';
    }
  }

  /**
   * Switch between Sensor mode and Manual mode
   */
  public setMode(newMode: 'sensor' | 'manual'): void {
    this.mode = newMode;
    if (newMode === 'sensor') {
      if (!this.hasPermission && this.isSupported) {
        this.requestPermission();
      } else {
        this.statusText = this.sensorActive ? 'Sensor: Active' : 'Waiting for motion...';
      }
    } else {
      this.statusText = 'Using Manual Angle';
    }
    this.notify();
  }

  public getState(): OrientationState {
    return {
      angle: Math.round(this.angle),
      rawAngle: this.rawAngle,
      isSupported: this.isSupported,
      hasPermission: this.hasPermission,
      sensorActive: this.sensorActive,
      mode: this.mode,
      statusText: this.statusText
    };
  }

  public subscribe(callback: OrientationCallback): () => void {
    this.callbacks.add(callback);
    callback(this.getState());
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.callbacks.forEach(cb => cb(state));
  }
}

export const orientationSensor = new OrientationSensor();
