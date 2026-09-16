import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CbcService } from './services/cbc.service';
import {
  Checklist,
  Pregunta,
  RespuestaFormulario,
  Seccion,
  TipoAmbiente,
} from './models/cbc.models';

interface SeccionAgrupada {
  seccion: Seccion;
  preguntas: Pregunta[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  tipoAmbiente: TipoAmbiente = 'AULA';
  checklists: Checklist[] = [];
  checklistSeleccionado = '';
  secciones: SeccionAgrupada[] = [];
  respuestas: Record<string, RespuestaFormulario> = {};
  errores: Record<string, string> = {};
  observacionesGenerales = '';
  sedeFilial = '';
  facultad = '';
  escuela = '';
  ambienteNumero = '';
  ubicacionAmbiente = '';
  cargando = false;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';
  agregarEnSeccion = '';
  nuevaPreguntaTexto = '';
  fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  constructor(
    private cbcService: CbcService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.cargarChecklists();
  }

  async cargarChecklists(): Promise<void> {
    this.cargando = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.errores = {};
    this.secciones = [];
    this.respuestas = {};
    this.checklistSeleccionado = '';

    try {
      this.checklists = await firstValueFrom(
        this.cbcService.getChecklists(this.tipoAmbiente)
      );
      if (this.checklists.length) {
        this.checklistSeleccionado = this.checklists[0].documentId;
        this.construirSecciones();
      }
    } catch (error) {
      console.error('Error obteniendo checklists:', error);
      this.mensajeError =
        'No se pudo cargar el checklist. Verifique la conexión con el servidor.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onTipoAmbienteChange(tipoAmbiente: TipoAmbiente): void {
    this.tipoAmbiente = tipoAmbiente;
    void this.cargarChecklists();
  }

  onChecklistChange(): void {
    this.construirSecciones();
  }

  private construirSecciones(): void {
    const checklist = this.checklists.find(
      (checklist) => checklist.documentId === this.checklistSeleccionado
    );
    if (!checklist || !checklist.secciones) {
      this.secciones = [];
      this.respuestas = {};
      return;
    }

    this.secciones = checklist.secciones
      .filter((seccion) => seccion.activo !== false)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((seccion) => ({
        seccion,
        preguntas: (seccion.preguntas ?? [])
          .filter((pregunta) => pregunta.activo !== false)
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
      }));

    this.inicializarRespuestas();
  }

  private inicializarRespuestas(): void {
    this.respuestas = {};
    for (const grupo of this.secciones) {
      for (const pregunta of grupo.preguntas) {
        this.respuestas[pregunta.documentId] = {
          respuesta: '',
          observacion: '',
        };
      }
    }
  }

  get totalPreguntas(): number {
    return this.secciones.reduce(
      (total, grupo) => total + grupo.preguntas.length,
      0
    );
  }

  get respondidas(): number {
    return Object.values(this.respuestas).filter(
      (respuesta) => respuesta.respuesta
    ).length;
  }

  get porcentajeProgreso(): number {
    return this.totalPreguntas
      ? Math.round((this.respondidas / this.totalPreguntas) * 100)
      : 0;
  }

  seleccionarEvidencia(event: Event, pregunta: Pregunta): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const archivo = input.files[0];
    const respuesta = this.respuestas[pregunta.documentId];
    if (respuesta.evidenciaUrl) {
      URL.revokeObjectURL(respuesta.evidenciaUrl);
    }
    respuesta.evidencia = archivo;
    respuesta.evidenciaUrl = URL.createObjectURL(archivo);
  }

  eliminarEvidencia(pregunta: Pregunta): void {
    const respuesta = this.respuestas[pregunta.documentId];
    if (respuesta.evidenciaUrl) {
      URL.revokeObjectURL(respuesta.evidenciaUrl);
    }
    respuesta.evidencia = undefined;
    respuesta.evidenciaUrl = undefined;
  }

  async guardar(): Promise<void> {
    if (this.guardando || this.totalPreguntas === 0) {
      return;
    }
    this.mensajeExito = '';
    this.mensajeError = '';
    this.errores = {};

    if (
      !this.sedeFilial.trim() ||
      !this.facultad.trim() ||
      !this.escuela.trim() ||
      !this.ambienteNumero.trim()
    ) {
      this.mensajeError =
        'Complete la sede/filial, facultad, escuela y ambiente antes de guardar.';
      return;
    }

    const preguntas = this.secciones.flatMap((grupo) => grupo.preguntas);

    if (this.validarFormulario(preguntas)) {
      this.mensajeError = 'Revise los campos marcados en rojo.';
      return;
    }

    this.guardando = true;
    try {
      const evidenciasPorPregunta: Record<string, string[]> = {};
      for (const pregunta of preguntas) {
        const respuesta = this.respuestas[pregunta.documentId];
        if (respuesta.evidencia) {
          const media = await firstValueFrom(
            this.cbcService.subirEvidencia(respuesta.evidencia)
          );
          evidenciasPorPregunta[pregunta.documentId] = [media.documentId];
        }
      }

      const totales = this.calcularTotales(preguntas);

      const evaluacion = await firstValueFrom(
        this.cbcService.crearEvaluacion({
          fechaEvaluacion: new Date().toISOString().slice(0, 10),
          estado: 'FINALIZADO',
          observacionesGenerales: this.observacionesGenerales,
          porcentajeCumplimiento: totales.porcentajeCumplimiento,
          totalAplicables: totales.totalAplicables,
          totalConformes: totales.totalConformes,
          totalNoConformes: totales.totalNoConformes,
          totalNoAplica: totales.totalNoAplica,
          sedeFilial: this.sedeFilial,
          facultad: this.facultad,
          escuela: this.escuela,
          ambienteNumero: this.ambienteNumero,
          ubicacionAmbiente: this.ubicacionAmbiente,
          checklist: this.checklistSeleccionado,
        })
      );

      try {
        await firstValueFrom(
          this.cbcService.publicarEntidad(
            'evaluaciones',
            evaluacion.documentId
          )
        );
      } catch (error) {
        console.error('Error publicando la evaluación:', error);
      }

      for (const pregunta of preguntas) {
        const respuesta = this.respuestas[pregunta.documentId];
        const creada = await firstValueFrom(
          this.cbcService.crearRespuesta({
            respuesta: respuesta.respuesta as 'SI' | 'NO' | 'NO_APLICA',
            esConforme: this.esConforme(pregunta, respuesta.respuesta),
            observacion: respuesta.observacion,
            evaluacion: evaluacion.documentId,
            pregunta: pregunta.documentId,
            evidencias: evidenciasPorPregunta[pregunta.documentId] ?? [],
          })
        );

        try {
          await firstValueFrom(
            this.cbcService.publicarEntidad('respuestas', creada.documentId)
          );
        } catch (error) {
          console.error('Error publicando la respuesta:', error);
        }
      }

      this.mensajeExito = 'Evaluación guardada correctamente.';
    } catch (error) {
      console.error('Error guardando la evaluación:', error);
      this.mensajeError =
        'Ocurrió un error al guardar la evaluación. Inténtelo nuevamente.';
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  private validarFormulario(preguntas: Pregunta[]): boolean {
    let hayErrores = false;
    for (const pregunta of preguntas) {
      const respuesta = this.respuestas[pregunta.documentId];
      if (!respuesta.respuesta) {
        this.errores[pregunta.documentId] = 'Debe responder la pregunta.';
        hayErrores = true;
      }
    }
    return hayErrores;
  }

  private calcularTotales(preguntas: Pregunta[]): {
    totalAplicables: number;
    totalConformes: number;
    totalNoConformes: number;
    totalNoAplica: number;
    porcentajeCumplimiento: number;
  } {
    let totalConformes = 0;
    let totalNoConformes = 0;
    let totalNoAplica = 0;

    for (const pregunta of preguntas) {
      const respuesta = this.respuestas[pregunta.documentId];
      if (respuesta.respuesta === 'SI') {
        totalConformes++;
      } else if (respuesta.respuesta === 'NO') {
        totalNoConformes++;
      } else {
        totalNoAplica++;
      }
    }

    const totalAplicables = totalConformes + totalNoConformes;
    const porcentajeCumplimiento = totalAplicables
      ? (totalConformes / totalAplicables) * 100
      : 0;

    return {
      totalAplicables,
      totalConformes,
      totalNoConformes,
      totalNoAplica,
      porcentajeCumplimiento: Math.round(porcentajeCumplimiento * 100) / 100,
    };
  }

  private esConforme(
    pregunta: Pregunta,
    respuesta: string
  ): boolean {
    return respuesta !== 'NO_APLICA' && respuesta === pregunta.respuestaConforme;
  }

  iniciarAgregarPregunta(grupo: SeccionAgrupada): void {
    this.agregarEnSeccion = grupo.seccion.documentId;
    this.nuevaPreguntaTexto = '';
  }

  cancelarAgregarPregunta(): void {
    this.agregarEnSeccion = '';
    this.nuevaPreguntaTexto = '';
  }

  async guardarNuevaPregunta(grupo: SeccionAgrupada): Promise<void> {
    const texto = this.nuevaPreguntaTexto.trim();
    if (!texto || this.guardando) {
      return;
    }

    this.mensajeExito = '';
    this.mensajeError = '';
    this.guardando = true;

    try {
      const numero =
        grupo.preguntas.reduce(
          (max, pregunta) => Math.max(max, pregunta.numero ?? 0),
          0
        ) + 1;
      const orden =
        grupo.preguntas.reduce(
          (max, pregunta) => Math.max(max, pregunta.orden ?? 0),
          0
        ) + 1;
      const codigo = `${grupo.seccion.codigo}-${String(numero).padStart(3, '0')}`;

      const creada = await firstValueFrom(
        this.cbcService.crearPregunta({
          codigo,
          numero,
          orden,
          texto,
          respuestaConforme: 'SI',
          permiteEvidencia: true,
          requiereEvidenciaNoConforme: true,
          requiereObservacionNoConforme: true,
          activo: true,
          seccion: grupo.seccion.documentId,
        })
      );

      grupo.preguntas.push(creada);
      this.respuestas[creada.documentId] = {
        respuesta: '',
        observacion: '',
      };
      this.agregarEnSeccion = '';
      this.nuevaPreguntaTexto = '';
      this.mensajeExito = 'Pregunta agregada correctamente.';
    } catch (error) {
      console.error('Error agregando la pregunta:', error);
      this.mensajeError =
        'No se pudo agregar la pregunta. Inténtelo nuevamente.';
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }
}