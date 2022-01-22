/**
 * Manage starting and stopping a `requestAnimationFrame` loop.
 *
 * Will fallback to running a `setTimeout` once per second if the
 * `requestAnimationFrame` callback isn’t executed in time (for example when
 * the browser tab is in the background).
 */
export class RafRunner {
  private running = false;
  private raf?: number;
  private timeout?: NodeJS.Timeout;
  constructor(private readonly callback: () => void) {}

  private requestFrame(onFrame: () => void): void {
    this.raf = requestAnimationFrame(onFrame);
    this.timeout = setTimeout(onFrame, 1000);
  }

  private cancelFrames(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.timeout) clearTimeout(this.timeout);
  }

  public start(): void {
    if (this.running) return;
    const onFrame = () => {
      if (!this.running) return;
      this.cancelFrames();
      this.callback();
      this.requestFrame(onFrame);
    };
    this.running = true;
    this.requestFrame(onFrame);
  }

  public stop(): void {
    this.running = false;
    this.cancelFrames();
  }
}
