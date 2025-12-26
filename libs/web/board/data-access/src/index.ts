export * from './lib/services/board.service';
export * from './lib/store';

// Backwards compatibility
export { BoardStore as BoardAdapter } from './lib/store/board.store';
export type { BoardStateModel } from './lib/store/board.types';

