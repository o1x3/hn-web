// Shim for tinykeys: its package.json `exports` doesn't expose types under
// "bundler" moduleResolution; declare the surface we use.

declare module "tinykeys" {
  export type KeyBindingHandler = (event: KeyboardEvent) => void;
  export interface KeyBindingMap {
    [key: string]: KeyBindingHandler;
  }
  export interface KeyBindingOptions {
    event?: "keydown" | "keyup";
    capture?: boolean;
  }
  export function tinykeys(
    target: Window | HTMLElement,
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingOptions,
  ): () => void;
}
