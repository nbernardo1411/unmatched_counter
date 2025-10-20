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

  openGuide() {
    this.showGuide = true;
  }

  closeGuide() {
    this.showGuide = false;
  }
}