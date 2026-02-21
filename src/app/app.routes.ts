import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Main } from './pages/main/main';
import { Settings } from './pages/settings/settings';
import { Stats } from './pages/stats/stats';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'main', component: Main },
  { path: 'settings', component: Settings },
  { path: 'stats', component: Stats }
];
