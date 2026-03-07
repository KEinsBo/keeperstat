import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MainService } from '../../services/main-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  constructor(private mainService: MainService) {}
  startNewGame() {
    this.mainService.startNewGame();
  }
}
