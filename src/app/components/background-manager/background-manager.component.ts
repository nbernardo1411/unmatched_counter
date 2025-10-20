import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-background-manager',
  template: `
    <div class="bg-layer" [ngStyle]="bgStyle"></div>
  `,
  styles: [`
    .bg-layer {
      position: fixed;
      inset: 0;
      background-size: cover;
      background-position: center;
      transition: background-image 300ms ease-in-out;
      z-index: -1;
      filter: saturate(0.95) contrast(0.9);
    }
  `]
})
export class BackgroundManagerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedCharacter: string | null = null;

  backgroundImages: Record<string, string> = {
    'King Arthur': 'assets/backgrounds/king-arthur.png',
    'Medusa': 'assets/backgrounds/medusa.png',
    'Sinbad': 'assets/backgrounds/sinbad.png',
    'Alice': 'assets/backgrounds/alice.png',
    'Winter Soldier': 'assets/backgrounds/winter-soldier.png',
    // Robin Hood vs Bigfoot
    'Robin Hood': 'assets/backgrounds/robin-hood.png',
    'Bigfoot': 'assets/backgrounds/bigfoot.png',
    'Sherlock Holmes': 'assets/backgrounds/sherlock.png',
    'Dracula': 'assets/backgrounds/dracula.png',
    'Invisible Man': 'assets/backgrounds/invisible-man.png',
    'Jekyll & Hyde': 'assets/backgrounds/jekyll-hyde.png',
    // custom/promo backgrounds
    'T. Rex': 'assets/backgrounds/t-rex.png',
    'InGen Raptors': 'assets/backgrounds/ingen-raptors.png',
    'Golden Bat': 'assets/backgrounds/golden-bat.png',
    'Bruce Lee': 'assets/backgrounds/bruce-lee.png',
    'Nikola Tesla': 'assets/backgrounds/nikola-tesla.png'
  };

  bgStyle = { 'background-image': 'none' };

  private readonly defaultBackground = 'assets/backgrounds/unmatched.webp';

  private destroy$ = new Subject<void>();

  constructor(private characterService: CharacterService) {}

  ngOnInit(): void {
    // Subscribe to selection so the background updates even when no parent binding is provided
    this.characterService.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => {
        this.selectedCharacter = c ? (c as any).name : null;
        this.updateBg();
      });
  }

  ngOnChanges(_: SimpleChanges): void {
    this.updateBg();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateBg(): void {
    const key = this.selectedCharacter || '';
    const base = this.backgroundImages[key] || null;
    // if no mapping, use default unmatched background
    if (!base) {
      this.bgStyle = { 'background-image': `url('${this.defaultBackground}')` };
      return;
    }

    // try .webp, then .png, then original extension
    const candidates: string[] = [];
    const extMatch = base.match(/(.*)\.(png|jpg|jpeg)$/i);
    if (extMatch) {
      const prefix = extMatch[1];
      candidates.push(`${prefix}.webp`);
      candidates.push(`${prefix}.png`);
      candidates.push(`${prefix}.jpg`);
    } else {
      candidates.push(base);
    }

    // sequentially probe candidates and set the first that loads
    const probe = (idx: number) => {
      if (idx >= candidates.length) {
        this.bgStyle = { 'background-image': `url('${base}')` };
        return;
      }
      const url = candidates[idx];
      const img = new Image();
      img.onload = () => this.bgStyle = { 'background-image': `url('${url}')` };
      img.onerror = () => probe(idx + 1);
      img.src = url;
    };

    probe(0);
  }
}