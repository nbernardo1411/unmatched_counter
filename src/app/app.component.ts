import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Unmatched Health App';

  // Controls visibility of the User Guide modal
  showGuide = false;
  // PWA install prompt
  showInstall = false;
  private deferredPrompt: any = null;

  openGuide() {
    this.showGuide = true;
  }

  closeGuide() {
    this.showGuide = false;
  }

  // Feedback redirect handled by onFeedbackClick()

  constructor() {
    // Listen for the beforeinstallprompt event and show an in-app Install button
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstall = true;
    });
  }

  // When user clicks the Leave feedback button: ask whether to open Gmail.
  onFeedbackClick(): void {
    const openGmail = confirm('You will be redirected to Gmail to send feedback. Continue?');
    if (openGmail) {
      // prefill compose to kirigayazuki@gmail.com
      const to = encodeURIComponent('kirigayazuki@gmail.com');
      const subject = encodeURIComponent('App feedback from Unmatched Health App');
      const body = encodeURIComponent('Describe your feedback here...');
      // Gmail compose URL
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
      window.open(url, '_blank');
      return;
    }
  // user cancelled; do nothing
  }

  // Trigger the saved beforeinstallprompt event to show the browser install dialog
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;

    try {
      // Show the native install prompt
      this.deferredPrompt.prompt();
      const choiceResult = await (this.deferredPrompt as any).userChoice;
      // Optionally inspect choiceResult.outcome ('accepted'|'dismissed')
      this.showInstall = false;
    } catch (_e) {
      // ignore
    } finally {
      this.deferredPrompt = null;
      this.showInstall = false;
    }
  }
}