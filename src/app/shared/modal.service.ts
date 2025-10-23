import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalPayload {
  title: string;
  message: string;
  hasCancel: boolean;
  responder: (v: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private subject = new Subject<ModalPayload | null>();
  modal$ = this.subject.asObservable();

  showAlert(title: string, message: string): Promise<void> {
    return new Promise(resolve => {
      this.subject.next({ title, message, hasCancel: false, responder: () => resolve() });
    });
  }

  showConfirm(title: string, message: string): Promise<boolean> {
    return new Promise(resolve => {
      this.subject.next({ title, message, hasCancel: true, responder: (v: boolean) => resolve(v) });
    });
  }

  // internal: clear modal
  close() { this.subject.next(null); }
}
