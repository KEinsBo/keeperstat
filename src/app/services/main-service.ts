import { Injectable } from '@angular/core';

interface GameAction {
  type: string;
  team: number;
  index: number;
  position: [number, number] | null;
  goalie: string;
  '7m': boolean;
}
interface Game {
  date: string;
  actions: GameAction[];
}

interface GameOption {
  label: string;
  value: string | 'all';
}

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private storageKey = 'gameData';
  private data: any = { games: [] };

  saveToCache() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    console.log('Data saved to cache', this.data);
  }

  loadFromCache() {
    const cached = localStorage.getItem(this.storageKey);
    if (cached) {
      try {
        this.data = JSON.parse(cached);
        console.log('Data loaded from cache', this.data);
      } catch (e) {
        console.error('Error parsing cached data', e);
      }
    }
  }

  getData() {
    return this.data;
  }

  addEvent(eventType: string, team: number, goalie: string, freethrow: boolean) {
    console.log('Adding Event');
    const lastGame = this.data.games[this.data.games.length - 1] || {
      date: new Date().toISOString().split('T')[0],
      actions: [],
    };
    lastGame.actions.push({
      type: eventType,
      team: team,
      index: lastGame.actions.length,
      position: null,
      goalie: goalie,
      '7m': freethrow,
    });
    if (!this.data.games.length) this.data.games.push(lastGame);
    this.saveToCache();
  }

  addPosition(posX: number, posY: number) {
    const lastGame = this.data.games[this.data.games.length - 1];
    if (lastGame && lastGame.actions.length) {
      lastGame.actions[lastGame.actions.length - 1].position = [posX, posY];
      console.log('Adding Position');
      this.saveToCache();
    }
  }

  undo() {
    const lastGame = this.data.games[this.data.games.length - 1];
    if (lastGame && lastGame.actions.length) {
      lastGame.actions.pop();
      this.saveToCache();
      console.log('Undid last action');
    }
  }

  startNewGame() {
    const newGame = {
      date: new Date().toISOString().split('T')[0],
      actions: [],
    };

    this.data.games.push(newGame);
    this.saveToCache();
    console.log('New game created', newGame);
  }

  deleteGame(index: number) {
    if (index >= 0 && index < this.data.games.length) {
      this.data.games.splice(index, 1);
      this.saveToCache();
      console.log('Game deleted at index', index);
    }
  }

  getSaveQuote(): number[] {
    const lastGame = this.data.games[this.data.games.length - 1];
    if (!lastGame || !lastGame.actions.length) {
      return [0, 0];
    }

    const actionsTeam1 = lastGame.actions.filter((a: GameAction) => a.team === 0);
    const totalGoalsTeam1 = actionsTeam1.filter((a: GameAction) => a.type === 'goal').length;
    const savesTeam1 = actionsTeam1.filter((a: GameAction) => a.type === 'save').length;
    const quoteTeam1 =
      totalGoalsTeam1 + savesTeam1 > 0 ? savesTeam1 / (totalGoalsTeam1 + savesTeam1) : 0;

    const actionsTeam2 = lastGame.actions.filter((a: GameAction) => a.team === 1);
    const totalGoalsTeam2 = actionsTeam2.filter((a: GameAction) => a.type === 'goal').length;
    const savesTeam2 = actionsTeam2.filter((a: GameAction) => a.type === 'save').length;
    const quoteTeam2 =
      totalGoalsTeam2 + savesTeam2 > 0 ? savesTeam2 / (totalGoalsTeam2 + savesTeam2) : 0;

    return [quoteTeam1 * 100, quoteTeam2 * 100];
  }

  getGameOptions(): GameOption[] {
    if (!this.data.games || !this.data.games.length) {
      return [{ label: 'Alle Spiele', value: 'all' }];
    }
    const sortedGames = [...this.data.games].sort((a, b) => b.date.localeCompare(a.date));

    const options: GameOption[] = sortedGames.map((game) => ({
      label: game.date,
      value: game.date,
    }));

    return [{ label: 'Alle Spiele', value: 'all' }, ...options];
  }

  getGoalieOptions(selectedGame: string): string[] {
    let games = this.data.games;

    if (selectedGame !== 'all') {
      games = games.filter((g: Game) => g.date === selectedGame);
    }

    const allActions = games.flatMap((g: Game) => g.actions);

    const goalies: string[] = allActions.map((a: GameAction) => a.goalie);

    const uniqueGoalies: string[] = [...new Set(goalies)].filter((g) => g);

    return uniqueGoalies;
  }

  addImportedGames(importedData: any) {
    if (!importedData || !Array.isArray(importedData.games)) {
      console.error('Importierte Daten sind ungültig:', importedData);
      return;
    }
    const existingDates = new Set(this.data.games.map((g: any) => g.date));

    const newGames = importedData.games.filter((g: any) => !existingDates.has(g.date));

    this.data.games.push(...newGames);
    this.saveToCache();

    console.log(`Import abgeschlossen. ${newGames.length} neue Spiele hinzugefügt.`, this.data);
  }
}
