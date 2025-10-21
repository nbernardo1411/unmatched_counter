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
      try { (e as any).preventDefault(); } catch {}
      this.deferredPrompt = e;
      this.showInstall = true;
      console.log('beforeinstallprompt fired');
    });
  }

  // When user clicks the Leave feedback button: ask whether to open Gmail.
  onFeedbackClick(): void {
    const openGmail = confirm('You will be redirected to Gmail to send feedback. Continue?');
    if (openGmail) {
      // prefill compose to kirigayazuki@gmail.com
      const toRaw = 'kirigayazuki@gmail.com';
      const subjectRaw = 'App feedback from Unmatched Health Counter App';
      const bodyRaw = 'Describe your feedback here...';
      const to = encodeURIComponent(toRaw);
      const subject = encodeURIComponent(subjectRaw);
      const body = encodeURIComponent(bodyRaw);

      // Gmail web compose URL (desktop fallback)
      const gmailWeb = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
      // mailto: fallback (opens native mail app / chooser on mobile)
      const mailto = `mailto:${toRaw}?subject=${subject}&body=${body}`;
      // Gmail app URL scheme (works when Gmail app is installed on mobile)
      const gmailApp = `googlegmail://co?to=${to}&subject=${subject}&body=${body}`;

      const ua = navigator.userAgent || '';
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua);

      if (isMobile) {
        // Attempt to open the Gmail app first. If it isn't installed the browser
        // will stay on this page; after a short timeout we fallback to mailto,
        // which should open the device's mail composer (or show a chooser).
        try {
          // navigate to the app scheme
          window.location.href = gmailApp;
        } catch (_e) {
          // ignore and continue to fallback
        }

        // fallback sequence after trying the app
        setTimeout(() => {
          // Open native mail client via mailto: (this opens the installed mail app)
          try { window.location.href = mailto; } catch { /* ignore */ }
          // final fallback: open Gmail web compose in a new tab after a short delay
          setTimeout(() => { try { window.open(gmailWeb, '_blank'); } catch { /* ignore */ } }, 500);
        }, 800);
      } else {
        // Desktop: open Gmail web compose in a new tab
        window.open(gmailWeb, '_blank');
      }
      return;
    }
  // user cancelled; do nothing
  }

  // Trigger the saved beforeinstallprompt event to show the browser install dialog
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      // Fallback: show instructions for manual install via the browser UI
      alert('This browser did not provide an automatic install prompt. To install, open your browser menu and choose "Add to Home screen" or "Install app".');
      return;
    }

    try {
      // Show the native install prompt
      (this.deferredPrompt as any).prompt();
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