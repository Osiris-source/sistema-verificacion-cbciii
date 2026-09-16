import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet],
  template: `
    <nav class="navegacion">
      <div class="navegacion-titulo">
        <a routerLink="/">CBCC III</a>
      </div>
      <div class="navegacion-link">
        <a
          routerLink="/"
          routerLinkActive="activo"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Evaluación
        </a>
        <a
          routerLink="/reportes"
          routerLinkActive="activo"
        >
          Reportes
        </a>
      </div>
    </nav>

    <main class="contenido">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: `
    .navegacion {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      background: #276749;
      padding: 12px 40px;
    }

    .navegacion-titulo a {
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      text-decoration: none;
      letter-spacing: 1px;
    }

    .navegacion-link {
      display: flex;
      gap: 8px;
    }

    .navegacion-link a {
      color: #ffffff;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    .navegacion-link a:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .navegacion-link a.activo {
      background: #ffffff;
      color: #276749;
    }

    .contenido {
      min-height: 100vh;
    }

    @media (max-width: 700px) {
      .navegacion {
        padding: 10px 12px;
      }
    }
  `,
  standalone: true,
})
export class Pagina {}