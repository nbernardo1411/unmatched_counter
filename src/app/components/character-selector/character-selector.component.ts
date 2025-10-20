import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Character } from '../../models/character.model';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-character-selector',
  templateUrl: './character-selector.component.html',
  styleUrls: ['./character-selector.component.scss']
})
export class CharacterSelectorComponent implements OnInit, OnDestroy {
  characters: Character[] = [];
  selectedName: string | null = null;
  private sub = new Subscription();

  // form model for temporary character
  showCreate = false;
  formName = '';
  formHp = 10;

  // dynamic lists
  sidekicks: { name: string; health: number }[] = [];
  uniqueCounters: { type: string; start: number; max: number | null }[] = [];

  constructor(private characterService: CharacterService) {}

  ngOnInit(): void {
    console.log('CharacterSelectorComponent init'); // debug
    this.characters = this.characterService.getCharacters();
    this.sub.add(
      this.characterService.selected$.subscribe(c => {
        this.selectedName = c ? c.name : '';
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // select character from dropdown
  selectByName(name: string): void {
    if (!name) return;
    const found = this.characters.find(c => c.name === name);
    if (found) {
      this.characterService.selectCharacter(found);
    }
  }

  // trackBy for ngFor
  trackByName(_: number, item: Character): string {
    return item?.name ?? '';
  }

  // toggle form visibility
  toggleCreate(): void {
    this.showCreate = !this.showCreate;
    // When opening the create form, reset any existing selection so
    // the UI doesn't show both the selected character and the create form.
    if (this.showCreate) {
      this.selectedName = null;
      this.characterService.selectCharacterByName('');
    }
  }

  // add a new sidekick
  addSidekick(): void {
    this.sidekicks.push({ name: '', health: 1 });
  }

  // remove sidekick by index
  removeSidekick(index: number): void {
    this.sidekicks.splice(index, 1);
  }

  // add a new unique counter
  addUniqueCounter(): void {
    this.uniqueCounters.push({ type: '', start: 0, max: null });
  }

  // remove unique counter by index
  removeUniqueCounter(index: number): void {
    this.uniqueCounters.splice(index, 1);
  }

  // create a new custom character
  createCustom(): void {
    if (!this.formName) return;

    // filter valid sidekicks (must have name)
    const validSidekicks = this.sidekicks
      .filter(s => s.name.trim() !== '')
      .map(s => ({
        name: s.name.trim(),
        health: Math.max(0, Math.floor(s.health))
      }));

    // filter valid counters (must have type)
    const validCounters = this.uniqueCounters
      .filter(u => u.type.trim() !== '')
      .map(u => ({
        type: u.type.trim(),
        start: Math.max(0, Math.floor(u.start)),
        max: u.max ?? undefined,
        description: ''
      }));

    const ch: Character = {
      name: this.formName.trim(),
      health: Math.max(0, Math.floor(this.formHp)),
      sidekicks: validSidekicks.length ? validSidekicks : undefined,
      uniqueCounter: validCounters.length ? validCounters[0] : undefined // use first counter only
    } as any;

    this.characterService.addTemporaryCharacter(ch);

    // reset form
    this.formName = '';
    this.formHp = 10;
    this.sidekicks = [];
    this.uniqueCounters = [];
    this.showCreate = false;
  }
}
