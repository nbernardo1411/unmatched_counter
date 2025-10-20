import { Component } from '@angular/core';
import { Character, UniqueCounter } from '../../models/character.model'; // fixed
import { CharacterService } from '../../services/character.service';     // fixed

@Component({
  selector: 'app-character-selector',
  templateUrl: './character-selector.component.html', // fixed
  styleUrls: ['./character-selector.component.css']
})
export class CharacterSelectorComponent {
  characters: Character[] = [];
  selectedName = '';
  showCreate = false;

  // form fields
  formName = '';
  formHp = 0;
  formHasEnrage = false; // new checkbox flag

  sidekicks: Character[] = [];
  uniqueCounters: any[] = [];

  constructor(private characterService: CharacterService) {
    this.characters = this.characterService.getCharacters();
  }

  toggleCreate(): void {
    this.showCreate = !this.showCreate;
  }

  addSidekick(): void {
    this.sidekicks.push({ name: '', health: 1 });
  }

  removeSidekick(i: number): void {
    this.sidekicks.splice(i, 1);
  }

  addUniqueCounter(): void {
    this.uniqueCounters.push({ type: '', start: 0, max: 0 });
  }

  removeUniqueCounter(j: number): void {
    this.uniqueCounters.splice(j, 1);
  }

  createCustom(): void {
    const newChar: Character = {
      name: this.formName,
      health: this.formHp,
      sidekicks: this.sidekicks,
      uniqueCounter: this.uniqueCounters[0],
      hasEnrage: this.formHasEnrage,
      enraged: false,
    };
    this.characterService.addTemporaryCharacter(newChar);
    this.resetForm();
  }

  resetForm(): void {
    this.formName = '';
    this.formHp = 0;
    this.sidekicks = [];
    this.uniqueCounters = [];
    this.formHasEnrage = false;
    this.showCreate = false;
  }

  selectByName(name: string): void {
    this.selectedName = name;
    const char = this.characters.find(c => c.name === name);
    if (char) this.characterService.selectCharacter(char);
  }

  trackByName(_: number, item: Character): string {
    return item.name;
  }
}
