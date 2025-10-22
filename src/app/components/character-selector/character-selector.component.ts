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
  // Returns the currently selected character object
  getSelectedCharacter(): Character | null {
    return this.characters.find(c => c.name === this.selectedName) || null;
  }
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

  // edit mode
  editMode = false;
  editOriginalName: string | null = null;

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
    // Restore temporary uploaded background (persist across PWA restarts)
    try {
      const tmp = localStorage.getItem('tempFormBackground');
      if (tmp) {
        this.formBackground = tmp;
        this.formBackgroundPreview = null;
      }
    } catch (_e) {
      // ignore storage errors (e.g., disabled)
    }
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

  // Check if character is custom (not in initial list)
  isCustomCharacter(character: Character | null | undefined): boolean {
    if (!character) return false;
    const initialNames = [
      'King Arthur','Medusa','Sinbad','Alice','Winter Soldier','Robin Hood','Bigfoot','Sherlock Holmes','Dracula','Invisible Man','Jekyll & Hyde','T. Rex','Raptors','Golden Bat','Bruce Lee','Nikola Tesla','Geralt of Rivia','Yennefer of Vengerberg','Ciri','Eredin','Ancient Leshen'
    ];
    return !initialNames.includes(character.name);
  }

  // Helper for template: returns true if any custom character exists
  hasCustomCharacters(): boolean {
    return this.characters && this.characters.some(c => this.isCustomCharacter(c));
  }

  // trackBy for ngFor
  trackByName(_: number, item: Character): string {
    return item?.name ?? '';
  }

  // toggle form visibility
  toggleCreate(): void {
    this.showCreate = !this.showCreate;
    this.editMode = false;
    this.editOriginalName = null;
    // When opening the create form, reset any existing selection so
    // the UI doesn't show both the selected character and the create form.
    if (this.showCreate) {
      this.selectedName = null;
      this.characterService.selectCharacterByName('');
      this.resetForm();
    }
  }

  // Start editing a custom character
  startEdit(character: Character): void {
    this.showCreate = true;
    this.editMode = true;
    this.editOriginalName = character.name;
    this.formName = character.name;
    this.formHp = character.health;
    this.formBackground = character.background || null;
    this.formBackgroundPreview = null;
    this.formBackgroundLoading = false;
    this.sidekicks = character.sidekicks ? character.sidekicks.map(sk => ({ name: sk.name, health: sk.health })) : [];
    this.uniqueCounters = character.uniqueCounter ? [{ type: character.uniqueCounter.type, start: character.uniqueCounter.start, max: character.uniqueCounter.max ?? null }] : [];
    this.toggles = character.toggles ? character.toggles.map(t => ({ name: t.name, state: t.state })) : [];
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
        // keep blob/object URL for immediate display, then convert to a persistent
        // data URL (base64) and save to sessionStorage so it survives reloads in
        // this browser session.
        this.formBackground = finalUrl;
        this.lastFormBackgroundUrl = finalUrl;
        // convert blob URL -> data URL and store persistently so the PWA
        // can restore the image across app restarts
        this.blobUrlToDataUrl(finalUrl)
          .then(dataUrl => {
            this.formBackground = dataUrl;
            try { localStorage.setItem('tempFormBackground', dataUrl); } catch (_e) { /* ignore */ }
          })
          .catch(err => {
            console.warn('Failed to persist image to localStorage', err);
          });
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
          try { localStorage.setItem('tempFormBackground', this.formBackground); } catch (_e) { /* ignore */ }
        };
        reader.readAsDataURL(file);
      })
      .finally(() => {
        this.formBackgroundLoading = false;
      });
  }

  // Convert a blob: or object URL to a data URL (base64) so it can be stored as text
  private blobUrlToDataUrl(url: string): Promise<string> {
    return fetch(url)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(new Error('Failed to read blob as data URL'));
        fr.readAsDataURL(blob);
      }));
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
  async createCustom(): Promise<void> {
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
    // ensure background is persisted as a data URL before saving
    if (this.formBackground) {
      const persisted = await this.ensurePersistentBackground();
      (ch as any).background = persisted ?? this.formBackground;
    }
    // include toggles if any
    const validToggles = this.toggles.filter(t => t.name.trim() !== '').map(t => ({ name: t.name.trim(), state: !!t.state }));
    if (validToggles.length) {
      (ch as any).toggles = validToggles;
    }
    if (this.editMode && this.editOriginalName) {
      // Edit existing custom character
      this.characterService.editCustomCharacter(this.editOriginalName, ch);
    } else {
      // Add new custom character
      this.characterService.addCustomCharacter(ch);
    }
    this.resetForm();
    this.showCreate = false;
    this.editMode = false;
    this.editOriginalName = null;
    // Refresh character list
    this.characters = this.characterService.getCharacters();
  }

  // Delete a custom character
  deleteCustom(character: Character): void {
    if (!this.isCustomCharacter(character)) return;
    if (confirm(`Delete custom character "${character.name}"? This cannot be undone.`)) {
      this.characterService.deleteCustomCharacter(character.name);
      this.characters = this.characterService.getCharacters();
      // If editing this character, reset form
      if (this.editMode && this.editOriginalName === character.name) {
        this.resetForm();
        this.showCreate = false;
        this.editMode = false;
        this.editOriginalName = null;
      }
    }
  }

  // Reset form fields
  resetForm(): void {
    this.formName = '';
    this.formHp = 10;
    this.formBackground = null;
    this.formBackgroundPreview = null;
    this.formBackgroundLoading = false;
    this.lastFormBackgroundUrl = null;
    this.sidekicks = [];
    this.uniqueCounters = [];
    this.toggles = [];
    try { localStorage.removeItem('tempFormBackground'); } catch (_e) { /* ignore */ }
  }

  // Ensure saving uses a persistent data URL if a blob URL is currently set
  private async ensurePersistentBackground(): Promise<string | null> {
    if (!this.formBackground) return null;
    if (this.formBackground.startsWith('data:')) return this.formBackground;
    try {
      const dataUrl = await this.blobUrlToDataUrl(this.formBackground);
      try { localStorage.setItem('tempFormBackground', dataUrl); } catch (_e) { /* ignore */ }
      this.formBackground = dataUrl;
      return dataUrl;
    } catch (e) {
      console.warn('Failed to convert blob URL to data URL before save', e);
      return null;
    }
  }
}


