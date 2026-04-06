declare module 'heerich' {
  export class Heerich {
    constructor(options?: Record<string, unknown>)
    addGeometry(opts: Record<string, unknown>): void
    clear(): void
    toSVG(opts?: Record<string, unknown>): string
  }
}
