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
  formBackground: string | null = null; // data URL for uploaded background image
  formBackgroundLoading = false;
  formBackgroundPreview: string | null = null; // fast object URL preview while processing
  private lastFormBackgroundUrl: string | null = null;

  // dynamic lists
  sidekicks: { name: string; health: number }[] = [];
  uniqueCounters: { type: string; start: number; max: number | null }[] = [];
  toggles: { name: string; state: boolean }[] = [];

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

  // handle background image file selection (reads as data URL)
  onBackgroundFileChange(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      if (this.lastFormBackgroundUrl) {
        try { URL.revokeObjectURL(this.lastFormBackgroundUrl); } catch { /* ignore */ }
        this.lastFormBackgroundUrl = null;
      }
      this.formBackground = null;
      return;
    }
    const file = input.files[0];
    // If file is small already, read directly; otherwise resize & compress
    const MAX_DIMENSION = 1024; // max width/height in px
    const QUALITY = 0.78; // JPEG quality 0..1

    // show loading indicator
    this.formBackgroundLoading = true;

    // immediate preview using an object URL so the user sees the image right away
    try {
      const previewUrl = URL.createObjectURL(file);
      this.formBackground = previewUrl;
      this.formBackgroundPreview = previewUrl;
      this.lastFormBackgroundUrl = previewUrl;
    } catch (e) {
      // if object URLs are not available, continue to processing fallback
      console.warn('object URL preview not available', e);
    }

    // process image asynchronously (non-blocking) and replace preview with compressed blob URL
    this.processImageFileToBlobUrl(file, MAX_DIMENSION, QUALITY)
      .then(finalUrl => {
        // revoke previous preview URL if it was an object URL and different
        if (this.formBackgroundPreview && this.formBackgroundPreview !== finalUrl) {
          try { URL.revokeObjectURL(this.formBackgroundPreview); } catch { /* ignore */ }
        }
        this.formBackgroundPreview = null;
        this.formBackground = finalUrl;
        this.lastFormBackgroundUrl = finalUrl;
  })
  .catch((err: any) => {
        console.error('Image processing failed', err);
        // fallback: read raw file as data URL (this may be slower but works)
        const reader = new FileReader();
        reader.onload = () => {
          // revoke previous object URLs to avoid leaks
          if (this.lastFormBackgroundUrl) try { URL.revokeObjectURL(this.lastFormBackgroundUrl); } catch {}
          this.lastFormBackgroundUrl = null;
          this.formBackground = reader.result as string;
        };
        reader.readAsDataURL(file);
      })
      .finally(() => {
        this.formBackgroundLoading = false;
      });
  }

  // Resize & compress an image File to a JPEG data URL (returns Promise<string>)
  private resizeImageFileToDataURL(file: File, maxDim: number, quality = 0.8): Promise<string> {
    // keep original method for compatibility but prefer processImageFileToBlobUrl
    return this.processImageFileToBlobUrl(file, maxDim, quality).then(blobUrl => {
      // Convert blob URL back to data URL only if caller expects string data URL
      return new Promise<string>((resolve, reject) => {
        fetch(blobUrl)
          .then(r => r.blob())
          .then(blob => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          })
          .catch(reject);
      });
    });
  }

  // Process image file using createImageBitmap + canvas.toBlob (async) and return a blob: URL
  private processImageFileToBlobUrl(file: File, maxDim: number, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const finishWithBlob = (canvas: HTMLCanvasElement) => {
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Canvas toBlob returned null'));
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/jpeg', quality);
      };

      // Prefer createImageBitmap which may decode off the main thread
      if ((window as any).createImageBitmap) {
        (window as any).createImageBitmap(file)
          .then((imgBitmap: any) => {
            try {
              const ratio = Math.min(1, maxDim / Math.max(imgBitmap.width, imgBitmap.height));
              const w = Math.round(imgBitmap.width * ratio);
              const h = Math.round(imgBitmap.height * ratio);
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('Canvas 2D context not available');
              ctx.drawImage(imgBitmap, 0, 0, w, h);
              finishWithBlob(canvas);
            } catch (e) {
                reject(e);
              }
              })
              .catch((err: any) => {
            // fallback to FileReader + Image path
            const reader = new FileReader();
            reader.onerror = e => reject(e);
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                try {
                  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
                  const w = Math.round(img.width * ratio);
                  const h = Math.round(img.height * ratio);
                  const canvas = document.createElement('canvas');
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('Canvas 2D context not available');
                  ctx.drawImage(img, 0, 0, w, h);
                  finishWithBlob(canvas);
                } catch (e) {
                  reject(e);
                }
              };
              img.onerror = e => reject(e);
              img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
          });
      } else {
        // no createImageBitmap: fallback to FileReader + Image
        const reader = new FileReader();
        reader.onerror = e => reject(e);
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            try {
              const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
              const w = Math.round(img.width * ratio);
              const h = Math.round(img.height * ratio);
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('Canvas 2D context not available');
              ctx.drawImage(img, 0, 0, w, h);
              finishWithBlob(canvas);
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = e => reject(e);
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
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

  // toggles management
  addToggle(): void {
    this.toggles.push({ name: '', state: false });
  }

  removeToggle(index: number): void {
    this.toggles.splice(index, 1);
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
    // include uploaded background if present
    if (this.formBackground) {
      (ch as any).background = this.formBackground;
    }
    // include toggles if any
    const validToggles = this.toggles.filter(t => t.name.trim() !== '').map(t => ({ name: t.name.trim(), state: !!t.state }));
    if (validToggles.length) {
      (ch as any).toggles = validToggles;
    }

    this.characterService.addTemporaryCharacter(ch);

    // reset form
    this.formName = '';
    this.formHp = 10;
  this.formBackground = null;
    this.sidekicks = [];
    this.uniqueCounters = [];
    this.showCreate = false;
  }
}
