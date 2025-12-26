export interface WithInitializer {
  initialize: (...args: unknown[]) => void;
}
