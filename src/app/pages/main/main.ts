import { Component, OnInit } from '@angular/core';
import { MainService } from '../../services/main-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';
import { WebHaptics, defaultPatterns } from 'web-haptics';

@Component({
  selector: 'app-main',
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit {
  constructor(private mainService: MainService) {}
  haptics = new WebHaptics();
  freethrow = false;

  pqt1 = 0;
  pqt2 = 0;
  showPopup = false;

  enableConfetti = false;

  goalies = {
    team1: 'T1',
    team2: 'T2',
  };

  editingTeam: number | null = null;

  ngOnInit(): void {
    this.mainService.loadFromCache();
    this.goalies = this.getLastGoaliesFromGames();
    this.updateStats();
  }

  addEvent(type: string, team: number) {
    this.haptics.trigger();
    this.freethrow = false;
    this.mainService.addEvent(type, team, this.getGoalieName(team), this.freethrow);
    if (
      ((type === 'save' && team === 0) || (type === 'goal' && team === 1)) &&
      this.enableConfetti
    ) {
      console.log('confet');
      confetti({
        particleCount: 80,
        spread: 50,
        colors: ['#0A2463', '#FE5F55', '#2C6E49'],
      });
    }
    if (type != 'miss') {
      this.showPopup = true;
    }
    this.updateStats();
  }

  addPosition(posX: number, posY: number) {
    this.haptics.trigger();
    this.mainService.addPosition(posX, posY);
    this.closePopup();
  }

  undo() {
    this.mainService.undo();
  }

  closePopup() {
    this.showPopup = false;
  }

  startEditing(team: number) {
    this.editingTeam = team;
  }

  stopEditing() {
    this.editingTeam = null;
  }

  getGoalieName(team: number) {
    return team === 0 ? this.goalies.team1 : this.goalies.team2;
  }

  updateInputWidth(event: any) {
    event.target.style.width = `${event.target.value.length + 1}ch`;
  }

  getLastGoaliesFromGames() {
    let data = this.mainService.getData();
    if (!data.games.length) return { team1: 'T1', team2: 'T2' };

    const lastGame = data.games[data.games.length - 1];
    const actions = lastGame.actions;

    const lastGoalieTeam1 = [...actions].reverse().find((a) => a.team === 0)?.goalie ?? 'T1';
    const lastGoalieTeam2 = [...actions].reverse().find((a) => a.team === 1)?.goalie ?? 'T2';

    this.goalies.team1 = lastGoalieTeam1;
    this.goalies.team2 = lastGoalieTeam2;

    return this.goalies;
  }

  doFreethrow() {
    console.log('freethorwing');
    this.freethrow = !this.freethrow;
  }

  updateStats() {
    [this.pqt1, this.pqt2] = this.mainService.getSaveQuote();
  }
}
