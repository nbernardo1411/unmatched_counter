import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService, ModalPayload } from './modal.service';

@Component({
  selector: 'app-modal',
  template: `
  <div class="modal-backdrop" *ngIf="visible">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <h2 id="modalTitle">{{ title }}</h2>
      <div class="modal-body">{{ message }}</div>
      <div class="modal-actions">
        <button class="button" *ngIf="hasCancel" (click)="cancel()">Cancel</button>
        <button class="button primary" (click)="confirm()">OK</button>
      </div>
    </div>
  </div>
  `,
  styles: [
    `
    .modal-backdrop { position: fixed; inset: 0; display:flex;align-items:center;justify-content:center;z-index:2000;backdrop-filter: blur(6px);background: rgba(8,10,18,0.55); }
    .modal { width: min(560px,92%); background: linear-gradient(180deg,#0f1724,#071022); color: #e6eef8; border-radius: 12px; box-shadow: 0 20px 60px rgba(6,10,20,0.7); padding:18px; border:1px solid rgba(255,255,255,0.04); }
    .modal h2 { margin:0 0 8px 0; font-size:18px; }
    .modal-body { font-size:14px; color: rgba(230,238,248,0.9); margin-bottom:14px; }
    .modal-actions { display:flex; justify-content:flex-end; gap:8px; }
    .button.primary { background: linear-gradient(180deg,#2b9af3,#167ad6); color:white; border:1px solid rgba(255,255,255,0.06); padding:8px 12px; border-radius:8px; }
    .modal .button { padding:8px 12px; border-radius:8px; }
    `
  ]
})
export class ModalComponent implements OnInit, OnDestroy {
  visible = false;
  title = '';
  message = '';
  hasCancel = false;
  private sub = new Subscription();
  private currentResponder: ((v: boolean) => void) | null = null;

  constructor(private modal: ModalService) {}

  ngOnInit(): void {
    this.sub.add(this.modal.modal$.subscribe((p: ModalPayload | null) => {
      if (!p) {
        this.visible = false;
        this.currentResponder = null;
        return;
      }
      this.title = p.title;
      this.message = p.message;
      this.hasCancel = p.hasCancel;
      this.currentResponder = p.responder;
      this.visible = true;
    }));
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  confirm(): void { if (this.currentResponder) this.currentResponder(true); this.modal.close(); }
  cancel(): void { if (this.currentResponder) this.currentResponder(false); this.modal.close(); }
}
