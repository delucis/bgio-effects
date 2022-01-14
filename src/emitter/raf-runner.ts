/** Manage starting and stopping a `requestAnimationFrame` loop. */
export class RafRunner {
  private running = false;
  private raf?: number;
  constructor(private readonly callback: () => void) {}

  public start(): void {
    if (this.running) return;
    const frameCallback = () => {
      if (!this.running) return;
      this.callback();
      this.raf = requestAnimationFrame(frameCallback);
    };
    this.running = true;
    this.raf = requestAnimationFrame(frameCallback);
  }

  public stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
