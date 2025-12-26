import { Signal } from '@angular/core';
import { BoardStateModel } from './board.types';

/**
 * Creates and returns view model signals for the Board feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createBoardViewModel = (store: any) => {
  const wishLists: Signal<BoardStateModel['wishLists']> = store.signal('wishLists');

  return {
    wishLists
  };
};

export type BoardViewModel = ReturnType<typeof createBoardViewModel>;
