export interface UniqueCounter {
  type: string;
  start: number;
  max?: number;
  description?: string;
  value?: number; // current runtime value (optional)
}

export interface ToggleState {
  name: string;
  state: boolean;
}

export interface Character {
  name: string;
  health: number;
  /** Maximum (default) health for this character; if unset we'll initialize to the starting health */
  maxHealth?: number;
  sidekicks?: Character[];
  background?: string;
  uniqueCounter?: UniqueCounter;
  hideHealth?: boolean; // optional flag to hide health display in UI
  toggles?: ToggleState[];
}
