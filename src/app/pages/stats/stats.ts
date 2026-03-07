import { Component, OnInit } from '@angular/core';
import { MainService } from '../../services/main-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartType,
  Chart,
  registerables,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(PieController, ArcElement, Tooltip, Legend);

Chart.register(...registerables);
interface GameAction {
  type: string;
  team: number;
  index: number;
  position: [number, number] | null;
  goalie: string;
  '7m': boolean;
}

interface FieldStats {
  saves: number;
  goals: number;
}
interface Game {
  date: string;
  actions: GameAction[];
}
@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss'],
})
export class Stats implements OnInit {
  constructor(private mainService: MainService) {}

  gkOptions: string[] = [];
  gameOptions: any[] = [];

  selectedGame: string | 'all' = 'all';
  selectedGK: string | 'all' = 'all';

  saves = 0;
  misses = 0;
  goals = 0;

  selectedHm: string = 'savequote';

  fieldStats: FieldStats[] = [
    { saves: 3, goals: 2 }, // Feld 1
    { saves: 1, goals: 4 }, // Feld 2
    { saves: 5, goals: 1 }, // Feld 3
    { saves: 5, goals: 1 }, // Feld 4
    { saves: 2, goals: 10 }, // Feld 5
    { saves: 5, goals: 1 }, // Feld 6
    { saves: 5, goals: 1 }, // Feld 7
    { saves: 1, goals: 1 }, // Feld 8
    { saves: 5, goals: 6 }, // Feld 9
  ];

  fieldColors: string[] = [];
  ngOnInit() {
    this.mainService.loadFromCache();

    this.gameOptions = this.mainService.getGameOptions();
    this.updateGoalies();
    this.calculateStats();
    this.onSelectionChange();
    const saveRates = this.fieldStats.map((f) => f.saves / (f.saves + f.goals));
    const minRate = Math.min(...saveRates);
    const maxRate = Math.max(...saveRates);
    this.fieldColors = saveRates.map((rate) => this.interpolateColorHSL(rate, minRate, maxRate));
  }

  updateGoalies() {
    const oldGK = this.selectedGK;
    this.gkOptions = this.mainService.getGoalieOptions(this.selectedGame);

    if (this.gkOptions.length === 0) {
      this.selectedGK = 'all';
    } else if (!oldGK || oldGK === 'all' || !this.gkOptions.includes(oldGK)) {
      this.selectedGK = this.gkOptions[0];
    } else {
      this.selectedGK = oldGK;
    }
  }

  onGameChange() {
    this.updateGoalies();
    [this.misses];
  }

  getFilteredActions(): GameAction[] {
    console.log('getting actions');
    const data = this.mainService.getData();

    if (!data || !data.games) {
      console.log('returning early');
      return [];
    }

    const games: Game[] = data.games;

    let filteredActions: GameAction[] = [];
    if (this.selectedGame !== 'all') {
      const game = games.find((g) => g.date === this.selectedGame);
      if (game && game.actions) {
        filteredActions = game.actions;
      }
    } else {
      filteredActions = games.flatMap((g) => g.actions ?? []); // <-- safe
    }
    if (this.selectedGK !== 'all') {
      if (this.selectedGK === 'team1') {
        filteredActions = filteredActions.filter((a) => a.team === 1);
      } else if (this.selectedGK === 'team2') {
        filteredActions = filteredActions.filter((a) => a.team === 2);
      } else {
        console.log(this.selectedGK);
        filteredActions = filteredActions.filter((a) => a.goalie === this.selectedGK);
      }
    }

    return filteredActions;
  }

  calculateStats() {
    const actions = this.getFilteredActions();
    console.log(actions);
    this.saves = actions.filter((a) => a.type === 'save').length;
    this.goals = actions.filter((a) => a.type === 'goal').length;
    this.misses = actions.filter((a) => a.type === 'miss').length;
  }

  onSelectionChange() {
    if (this.selectedGame !== 'all') {
      this.updateGoalies();
    }
    this.calculateStats();
  }

  // interpolateColor(rate: number, minRate: number, maxRate: number): string {
  //   const t = (rate - minRate) / (maxRate - minRate);

  //   const r = Math.round(254 + (44 - 254) * t);
  //   const g = Math.round(95 + (110 - 95) * t);
  //   const b = Math.round(85 + (73 - 85) * t);

  //   return `rgb(${r}, ${g}, ${b})`;
  // }

  interpolateColorHSL(rate: number, minRate: number, maxRate: number): string {
    const t = (rate - minRate) / (maxRate - minRate); // 0..1

    // RGB von SCSS
    const start = { r: 44, g: 110, b: 73 }; // $green
    const end = { r: 254, g: 95, b: 85 }; // $red

    const r = Math.round(start.r + (end.r - start.r) * (1 - t)); // Grün->Rot, 1-t für richtig
    const g = Math.round(start.g + (end.g - start.g) * (1 - t));
    const b = Math.round(start.b + (end.b - start.b) * (1 - t));

    return `rgb(${r},${g},${b})`;
  }

  onHmChange() {}
}
