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
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
    { saves: 0, goals: 0 },
  ];

  fieldColors: string[] = [];
  ngOnInit() {
    this.mainService.loadFromCache();
    this.gameOptions = this.mainService.getGameOptions();
    this.updateGoalies();
    this.calculateStats();
    this.onSelectionChange();
    this.updateHeatmap();
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
      filteredActions = games.flatMap((g) => g.actions ?? []);
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
    this.updateHeatmap();
  }

  interpolateColorHSL(rate: number, minRate: number, maxRate: number): string {
    const t = (rate - minRate) / (maxRate - minRate);

    const start = { r: 44, g: 110, b: 73 };
    const end = { r: 254, g: 95, b: 85 };

    const r = Math.round(start.r + (end.r - start.r) * (1 - t));
    const g = Math.round(start.g + (end.g - start.g) * (1 - t));
    const b = Math.round(start.b + (end.b - start.b) * (1 - t));

    return `rgb(${r},${g},${b})`;
  }

  calculateFieldStats(): FieldStats[] {
    const actions = this.getFilteredActions();

    const stats: FieldStats[] = Array(9)
      .fill(0)
      .map(() => ({ saves: 0, goals: 0 }));

    actions.forEach((action) => {
      if (!action.position) return;
      const [row, col] = action.position;
      const fieldIndex = row * 3 + col;

      if (fieldIndex < 0 || fieldIndex >= stats.length) return;

      if (action.type === 'save') stats[fieldIndex].saves += 1;
      if (action.type === 'goal') stats[fieldIndex].goals += 1;
    });

    return stats;
  }
  heatmapValues: string[] = [];

  updateHeatmap() {
    const stats = this.calculateFieldStats();

    const rates = stats.map((f) => {
      if (this.selectedHm === 'savequote') {
        const total = f.saves + f.goals;
        return total === 0 ? 0 : f.saves / total;
      } else if (this.selectedHm === 'throwcount') {
        return f.saves + f.goals;
      } else if (this.selectedHm === 'goaldensity') {
        return f.goals;
      }
      return 0;
    });

    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    this.fieldColors = rates.map((rate) => this.interpolateColorHSL(rate, minRate, maxRate));

    this.heatmapValues = rates.map((rate) => {
      if (this.selectedHm === 'savequote') return `${Math.round(rate * 100)}%`;
      return `${rate}`;
    });
  }

  onHmChange() {
    this.updateHeatmap();
  }

  deleteGameByIndex(index: number) {
    this.mainService.deleteGame(index);
    this.gameOptions = this.mainService.getGameOptions();
    this.onSelectionChange();
  }

  exportGame(date: string) {
    const game = this.mainService.getData().games.find((g: any) => g.date === date);
    if (!game) return;

    const blob = new Blob([JSON.stringify({ games: [game] }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `game_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportData() {
    const dataStr = JSON.stringify(this.mainService.getData(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'handball_data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const jsonData = JSON.parse(reader.result as string);

        if (!jsonData || !Array.isArray(jsonData.games)) {
          console.error('Importierte Datei hat falsches Format', jsonData);
          return;
        }
        this.mainService.addImportedGames(jsonData);

        this.gameOptions = this.mainService.getGameOptions();

        this.onSelectionChange();

        console.log('Import erfolgreich abgeschlossen');
      } catch (e) {
        console.error('Fehler beim Importieren der Datei', e);
      } finally {
        input.value = '';
      }
    };
    reader.onerror = (err) => {
      console.error('Fehler beim Lesen der Datei', err);
    };

    reader.readAsText(file);
  }
}
