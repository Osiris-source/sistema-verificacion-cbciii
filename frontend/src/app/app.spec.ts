import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { CbcService } from './services/cbc.service';

describe('App', () => {
  let cbcServiceStub: Partial<CbcService>;

  beforeEach(async () => {
    cbcServiceStub = {
      getChecklists: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: CbcService, useValue: cbcServiceStub }],
    }).compileComponents();
  });

  it('debe crear el componente', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debe cargar los ámbitos de ambiente al iniciar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const app = fixture.componentInstance;
    expect(app.cargando).toBe(false);
    expect(app.checklists).toEqual([]);
  });

  it('debe renderizar el título', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fila-titulo')?.textContent).toContain(
      'Estado situacional de la infraestructura, mantenimiento y seguridad'
    );
  });

  it('debe mostrar un mensaje cuando no hay checklist', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.estado')?.textContent).toContain(
      'No hay checklist disponible'
    );
  });
});