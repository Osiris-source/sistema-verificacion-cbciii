import { Routes } from '@angular/router';
import { App } from './app';
import { Reportes } from './reportes/reportes';

export const routes: Routes = [
  { path: '', component: App },
  { path: 'reportes', component: Reportes },
  { path: '**', redirectTo: '' },
];