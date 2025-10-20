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
  formSidekicks = ''; // comma separated "Name:HP,Name:HP"
  formUniqueType = '';
  formUniqueStart: number | null = null;
  formUniqueMax: number | null = null;

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

  selectByName(name: string): void {
    if (!name) {
      return;
    }
    const found = this.characters.find(c => c.name === name);
    if (found) {
      this.characterService.selectCharacter(found);
    }
  }

  trackByName(_: number, item: Character): string {
    return item?.name ?? '';
  }

  toggleCreate(): void {
    this.showCreate = !this.showCreate;
  }

  createCustom(): void {
    if (!this.formName) return;
    const sidekicks = this.parseSidekicks(this.formSidekicks);
    const ch: Character = {
      name: this.formName,
      health: Math.max(0, Math.floor(this.formHp)),
      sidekicks: sidekicks.length ? sidekicks : undefined,
      uniqueCounter: this.formUniqueType ? { type: this.formUniqueType, start: this.formUniqueStart ?? 0, max: this.formUniqueMax ?? undefined, description: '' } : undefined
    } as any;

    this.characterService.addTemporaryCharacter(ch);
    // reset form
    this.formName = '';
    this.formHp = 10;
    this.formSidekicks = '';
    this.formUniqueType = '';
    this.formUniqueStart = null;
    this.formUniqueMax = null;
    this.showCreate = false;
  }

  private parseSidekicks(input: string): Character[] {
    if (!input) return [];
    return input.split(',').map(s => s.trim()).filter(Boolean).map(tok => {
      // support either "Name" or "Name:HP"
      const parts = tok.split(':').map(p => p.trim());
      const name = parts[0];
      const hp = parts[1] ? Math.max(0, Math.floor(Number(parts[1]) || 0)) : 1;
      return { name, health: hp } as Character;
    });
  }
}