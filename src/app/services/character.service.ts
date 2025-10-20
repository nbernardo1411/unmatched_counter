// character.service.ts
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
        { name: 'Harpie 1', health: 1 },
        { name: 'Harpie 2', health: 1 },
        { name: 'Harpie 3', health: 1 },
      ], background: 'assets/backgrounds/medusa.png' },
    { name: 'Sinbad', health: 15, sidekicks: [{ name: 'Porter', health: 6 }], background: 'assets/backgrounds/sinbad.png' },
    { name: 'Alice', health: 13, background: 'assets/backgrounds/alice.png' },

    // Unmatched: Robin Hood vs Bigfoot
    { name: 'Robin Hood', health: 14, sidekicks: [
        { name: 'Outlaw 1', health: 1 },
        { name: 'Outlaw 2', health: 1 },
        { name: 'Outlaw 3', health: 1 },
        { name: 'Outlaw 4', health: 1 },
      ], background: 'assets/backgrounds/robin-hood.png' },
    { name: 'Bigfoot', health: 16, sidekicks: [{ name: 'Jackalope', health: 6 }], background: 'assets/backgrounds/bigfoot.png' },

    // Unmatched: Cobble & Fog
    { name: 'Sherlock Holmes', health: 16, sidekicks: [{ name: 'Dr. Watson', health: 8 }], background: 'assets/backgrounds/sherlock.png' },
    { name: 'Dracula', health: 13, sidekicks: [
        { name: 'Sister 1', health: 1 },
        { name: 'Sister 2', health: 1 },
        { name: 'Sister 3', health: 1 },
      ], background: 'assets/backgrounds/dracula.png' },
    { name: 'Invisible Man', health: 15, background: 'assets/backgrounds/invisible-man.png' },
    { name: 'Jekyll & Hyde', health: 16, background: 'assets/backgrounds/jekyll-hyde.png' },

    // The Witcher Set
    { name: 'Geralt of Rivia', health: 16, sidekicks: [{ name: 'Dandelion', health: 5 }], background: 'assets/backgrounds/witcher.png' },
    { name: 'Yennefer of Vengerberg', health: 14, sidekicks: [{ name: 'Triss', health: 6 }], background: 'assets/backgrounds/witcher.png' },
    { name: 'Ciri', health: 15, sidekicks: [{ name: 'Ihuarraquax', health: 7 }], background: 'assets/backgrounds/witcher.png', uniqueCounter: { type: 'Source', start: 0, max: 7, value: 0 } },
    { 
      name: 'Eredin', 
      health: 14, 
      sidekicks: [
        { name: 'Red Rider #1', health: 1 },
        { name: 'Red Rider #2', health: 1 },
        { name: 'Red Rider #3', health: 1 },
        { name: 'Red Rider #4', health: 1 }
      ],
      background: 'assets/backgrounds/witcher.png',
      hasEnrage: true,   // 🔥 Eredin can go Enraged
      enraged: false     // default calm state
    },
    { name: 'Ancient Leshen', health: 13, sidekicks: [{ name: 'Wolf #1', health: 1 }, { name: 'Wolf #2', health: 1 }], background: 'assets/backgrounds/witcher.png' },
  ];

  private selectedSubject = new BehaviorSubject<Character | null>(null);
  selected$ = this.selectedSubject.asObservable();

  constructor() {
    // ensure every character and sidekick has a maxHealth initialized
    this.characters.forEach(ch => {
      if (ch.maxHealth == null) ch.maxHealth = ch.health;
      if (ch.sidekicks) {
        ch.sidekicks.forEach(sk => {
          if (sk.maxHealth == null) sk.maxHealth = sk.health;
        });
      }
    });
  }

  getCharacters(): Character[] {
    return this.characters;
  }

  selectCharacter(character: Character): void {
    this.selectedSubject.next(character);
  }

  getSelectedCharacter(): Character | null {
    return this.selectedSubject.getValue();
  }

  // New helper: toggle enrage state
  toggleEnrage(character: Character): void {
    if (!character.hasEnrage) return;
    character.enraged = !character.enraged;
    this.selectedSubject.next(character);
  }
}
