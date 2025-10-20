import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Character } from '../models/character.model';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private characters: Character[] = [
    // Unmatched: Battle of Legends Vol. 1
    { name: 'King Arthur', health: 18, sidekicks: [{ name: 'Merlin', health: 7 }], background: 'assets/backgrounds/king-arthur.png' },
    { name: 'Medusa', health: 16, sidekicks: [
        { name: 'Harpie #1', health: 1 },
        { name: 'Harpie #2', health: 1 },
        { name: 'Harpie #3', health: 1 },
      ], background: 'assets/backgrounds/medusa.png' },
    { name: 'Sinbad', health: 15, sidekicks: [{ name: 'Porter', health: 6 }], background: 'assets/backgrounds/sinbad.png' },
    { name: 'Alice', health: 13, background: 'assets/backgrounds/alice.png' },

    // Unmatched: Robin Hood vs Bigfoot
    { name: 'Robin Hood', health: 14, sidekicks: [
        { name: 'Outlaw #1', health: 6 },
        { name: 'Outlaw #2', health: 6 },
        { name: 'Outlaw #3', health: 6 },
        { name: 'Outlaw #4', health: 6 },
      ], background: 'assets/backgrounds/robin-hood.png' },
    { name: 'Bigfoot', health: 16, sidekicks: [{ name: 'Jackalope', health: 6 }], background: 'assets/backgrounds/bigfoot.png' },

    // Unmatched: Cobble & Fog
    { name: 'Sherlock Holmes', health: 16, sidekicks: [{ name: 'Dr. Watson', health: 8 }], background: 'assets/backgrounds/sherlock.png' },
    { name: 'Dracula', health: 13, sidekicks: [
        { name: 'Sister #1', health: 1 },
        { name: 'Sister #2', health: 1 },
        { name: 'Sister #3', health: 1 },
      ], background: 'assets/backgrounds/dracula.png' },
    { name: 'Invisible Man', health: 15, background: 'assets/backgrounds/invisible-man.png' },
    { name: 'Jekyll & Hyde', health: 16, background: 'assets/backgrounds/jekyll-hyde.png' },
      // Additional custom / promo characters
      { name: 'T. Rex', health: 27, background: 'assets/backgrounds/t-rex.png' },
      { name: 'InGen Raptors', health: 14, sidekicks: [{ name: 'Raptor Pack', health: 14 }], background: 'assets/backgrounds/ingen-raptors.png' },
      { name: 'Golden Bat', health: 18, background: 'assets/backgrounds/golden-bat.png' },
      { name: 'Bruce Lee', health: 14, background: 'assets/backgrounds/bruce-lee.png' },
      { name: 'Nikola Tesla', health: 16, background: 'assets/backgrounds/nikola-tesla.png', uniqueCounter: { type: 'Conductor', start: 3, max: 4, value: 3 } },
      // The Witcher set additions
      { name: 'Geralt of Rivia', health: 16, sidekicks: [{ name: 'Dandelion', health: 5 }], background: 'assets/backgrounds/witcher.png'},
      { name: 'Yennefer of Vengerberg', health: 14, sidekicks: [{ name: 'Triss', health: 6 }], background: 'assets/backgrounds/witcher.png'},
      { name: 'Ciri', health: 15, sidekicks: [{ name: 'Ihuarraquax', health: 7 }], background: 'assets/backgrounds/witcher.png', uniqueCounter: { type: 'Source', start: 0, max: 7, value: 0 } },
      { name: 'Eredin', health: 14, sidekicks: [
          { name: 'Red Rider #1', health: 1 },
          { name: 'Red Rider #2', health: 1 },
          { name: 'Red Rider #3', health: 1 },
          { name: 'Red Rider #4', health: 1 }
        ], background: 'assets/backgrounds/witcher.png'},
      { name: 'Ancient Leshen', health: 13, sidekicks: [{ name: 'Wolf #1', health: 1 }, { name: 'Wolf #2', health: 1 }], background: 'assets/backgrounds/witcher.png'},
  ];

  constructor() {
    // Ensure every character and sidekick has a maxHealth initialized to their starting health
    this.characters.forEach(ch => {
      if (ch.maxHealth == null) ch.maxHealth = ch.health;
      if (ch.sidekicks) {
        ch.sidekicks.forEach(sk => {
          if (sk.maxHealth == null) sk.maxHealth = sk.health;
        });
      }
      // initialize uniqueCounter value if present
      if (ch.uniqueCounter && ch.uniqueCounter.value == null) {
        ch.uniqueCounter.value = ch.uniqueCounter.start;
        if (ch.uniqueCounter.max == null) ch.uniqueCounter.max = ch.uniqueCounter.start;
      }
    });
  }

  // Helper to adjust a character's unique counter (if present)
  adjustUniqueCounter(name: string, delta: number): void {
    const ch = this.characters.find(c => c.name === name) as any;
    if (!ch || !ch.uniqueCounter) return;
    const uc = ch.uniqueCounter;
    uc.value = Math.max(0, Math.min(uc.max ?? uc.start, (uc.value ?? uc.start) + delta));
    // emit if selected is this character
    const sel = this.getSelectedCharacter();
    if (sel && sel.name === name) this.selectedSubject.next(sel);
  }

  private selectedSubject = new BehaviorSubject<Character | null>(null);
  selected$ = this.selectedSubject.asObservable();

  getCharacters(): Character[] {
    return this.characters;
  }

  // Add a temporary character at runtime (not persisted)
  addTemporaryCharacter(ch: Character): void {
    // initialize maxHealth for new temporary character and its sidekicks
    if (ch.maxHealth == null) ch.maxHealth = ch.health;
    if (ch.sidekicks) ch.sidekicks.forEach(sk => { if (sk.maxHealth == null) sk.maxHealth = sk.health; });
    if (ch.uniqueCounter && ch.uniqueCounter.value == null) ch.uniqueCounter.value = ch.uniqueCounter.start;
    this.characters.push(ch);
    // emit new list by selecting the new character
    this.selectedSubject.next(ch);
  }

  selectCharacter(character: Character): void {
    this.selectedSubject.next(character);
  }

  selectCharacterByName(name: string): void {
    const c = this.characters.find(ch => ch.name === name) || null;
    this.selectedSubject.next(c);
  }

  // Select a specific sidekick by parent name and index
  selectSubCharacter(parentName: string, subIndex: number): void {
    const parent = this.characters.find(ch => ch.name === parentName);
    if (!parent || !parent.sidekicks) return;
    if (subIndex < 0 || subIndex >= parent.sidekicks.length) return;
    this.selectedSubject.next(parent.sidekicks[subIndex]);
  }

  getSelectedCharacter(): Character | null {
    return this.selectedSubject.getValue();
  }

  addHealth(points: number, target?: Character): void {
    const t = target ?? this.getSelectedCharacter();
    if (!t) return;
    const newHealth = Math.floor(t.health + points);
    const cap = (t.maxHealth != null) ? t.maxHealth : newHealth;
    t.health = Math.max(0, Math.min(cap, newHealth));
    this.selectedSubject.next(t);
  }

  subtractHealth(points: number, target?: Character): void {
    const t = target ?? this.getSelectedCharacter();
    if (!t) return;
    const newHealth = Math.floor(t.health - points);
    t.health = Math.max(0, newHealth);
    this.selectedSubject.next(t);
  }

  adjustSidekickHealth(parentName: string, subIndex: number, delta: number): void {
    const parent = this.characters.find(ch => ch.name === parentName);
    if (!parent || !parent.sidekicks) return;
    const sk = parent.sidekicks[subIndex];
    if (!sk) return;
  const newSkHealth = Math.floor(sk.health + delta);
  const skCap = (sk.maxHealth != null) ? sk.maxHealth : newSkHealth;
  sk.health = Math.max(0, Math.min(skCap, newSkHealth));
      // Notify subscribers. If the currently selected item is the sidekick, emit
      // the sidekick. If the currently selected item is the parent (typical UI
      // case where sidekicks are shown inside the parent), emit the parent so
      // templates that bind to parent.sidekicks get change-detection updates.
      const sel = this.getSelectedCharacter();
      if (sel) {
        if (sel.name === sk.name) {
          this.selectedSubject.next(sk);
        }
        if (sel.name === parent.name) {
          this.selectedSubject.next(parent);
        }
      }
  }
}
