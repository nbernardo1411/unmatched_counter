export interface UniqueCounter {
  type: string;
  start: number;
  max?: number;
  description?: string;
  value?: number; // current runtime value (optional)
}

export interface Character {
  name: string;
  health: number;
  /** Maximum (default) health for this character; if unset we'll initialize to the starting health */
  maxHealth?: number;
  sidekicks?: Character[];
  background?: string;
  uniqueCounter?: UniqueCounter;

  /** Whether this character can enter Enrage mode */
  hasEnrage?: boolean;

  /** Whether Enrage mode is currently active (runtime only) */
  enraged?: boolean;
}
