import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Character } from '../../models/character.model';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-life-counter',
  templateUrl: './life-counter.component.html',
  styleUrls: ['./life-counter.component.scss']
})
export class LifeCounterComponent implements OnInit, OnDestroy {
  characters: Character[] = [];
  selected: Character | null = null;
  private destroy$ = new Subject<void>();

  @HostBinding('style.backgroundImage') backgroundImage = '';
  private readonly defaultBackground = 'assets/backgrounds/unmatched.webp';
  private lastBackgroundObjectUrl: string | null = null;

  constructor(private characterService: CharacterService) {}

  ngOnInit(): void {
    this.characters = this.characterService.getCharacters();

    this.characterService.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => {
        this.selected = c;
        if (c && c.background) {
          const base = c.background;

          // If background is already a blob/object URL or data URL, set immediately
          if (base.startsWith('blob:') || base.startsWith('data:') || base.startsWith('http')) {
            // revoke previous object URL if different
            if (this.lastBackgroundObjectUrl && this.lastBackgroundObjectUrl !== base) {
              try { URL.revokeObjectURL(this.lastBackgroundObjectUrl); } catch { /* ignore */ }
              this.lastBackgroundObjectUrl = null;
            }
            this.backgroundImage = `url('${base}')`;
            // still probe for webp/png/jpg versions only if the base looks like an asset path
            const extMatch = base.match(/(.*)\.(png|jpg|jpeg)$/i);
            if (!extMatch) return;
          }

          // If we reach here, probe candidates (but set base immediately for UX)
          this.backgroundImage = `url('${base}')`;

          const extMatch = base.match(/(.*)\.(png|jpg|jpeg)$/i);
          const candidates: string[] = [];
          if (extMatch) {
            const prefix = extMatch[1];
            candidates.push(`${prefix}.webp`, `${prefix}.png`, `${prefix}.jpg`);
          } else {
            candidates.push(base);
          }

          // async probe to avoid blocking UI
          setTimeout(() => {
            const probe = (idx: number) => {
              if (idx >= candidates.length) return;
              const url = candidates[idx];
              const img = new Image();
              img.onload = () => {
                // only replace if different
                const current = (this.backgroundImage as string) || '';
                if (!current.includes(url)) {
                  this.backgroundImage = `url('${url}')`;
                }
              };
              img.onerror = () => probe(idx + 1);
              img.src = url;
            };
            probe(0);
          }, 0);
        } else {
          this.backgroundImage = `url('${this.defaultBackground}')`;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  select(character: Character): void {
    this.characterService.selectCharacter(character);
  }

  inc(target?: Character): void {
    this.characterService.addHealth(1, target);
  }

  dec(target?: Character): void {
    this.characterService.addHealth(-1, target);
  }

  // sidekick helpers
  incSide(parentName: string, index: number): void {
    this.characterService.adjustSidekickHealth(parentName, index, 1);
  }

  decSide(parentName: string, index: number): void {
    this.characterService.adjustSidekickHealth(parentName, index, -1);
  }

  // unique counter helpers
  incCounter(): void {
    if (!this.selected) return;
    this.characterService.adjustUniqueCounter(this.selected.name, 1);
  }

  decCounter(): void {
    if (!this.selected) return;
    this.characterService.adjustUniqueCounter(this.selected.name, -1);
  }

  // flip a toggle on the selected character
  toggleToggle(index: number): void {
    if (!this.selected || !this.selected.toggles) return;
    const t = this.selected.toggles[index];
    if (!t) return;
    t.state = !t.state;
    // re-emit selected so templates bound to selected update
    this.characterService.selectCharacter(this.selected);
  }
}
