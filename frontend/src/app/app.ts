import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CbcService } from './services/cbc.service';
import {
  Checklist,
  FACULTADES,
  Pregunta,
  RespuestaFormulario,
  Seccion,
  TipoAmbiente,
  TipoRespuesta,
  escuelasDeFacultad,
  facultadesDeSede,
} from './models/cbc.models';

interface SeccionAgrupada {
  seccion: Seccion;
  preguntas: Pregunta[];
}

interface BorradorRespuesta {
  respuesta: string;
  observacion: string;
  evidenciaNombre?: string;
}

interface Borrador {
  tipoAmbiente: TipoAmbiente;
  checklistSeleccionado: string;
  sedeFilial: string;
  facultad: string;
  escuela: string;
  ambienteNumero: string;
  ubicacionAmbiente: string;
  observacionesGenerales: string;
  respuestasPorChecklist: Record<string, Record<string, BorradorRespuesta>>;
}

const CLAVE_BORRADOR = 'cbc_iii_borrador_v1';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  facultadesDisponibles: string[] = [...FACULTADES];
  escuelasDisponibles: string[] = [];
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

  @HostListener('window:beforeunload', ['$event'])
  evitarSalida(event: BeforeUnloadEvent): void {
    this.persistirBorrador();
    if (this.tieneDatosParaGuardar() && !this.guardando) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  ngOnInit(): void {
    const borrador = this.leerBorrador();
    if (borrador) {
      this.tipoAmbiente = borrador.tipoAmbiente;
      this.sedeFilial = borrador.sedeFilial ?? '';
      this.facultadesDisponibles = this.sedeFilial
        ? facultadesDeSede(this.sedeFilial)
        : [...FACULTADES];
      this.facultad = borrador.facultad ?? '';
      this.escuelasDisponibles = escuelasDeFacultad(this.facultad);
      this.escuela = borrador.escuela ?? '';
      if (this.escuelasDisponibles.length === 1 && !this.escuela) {
        this.escuela = this.escuelasDisponibles[0];
      }
      this.ambienteNumero = borrador.ambienteNumero ?? '';
      this.ubicacionAmbiente = borrador.ubicacionAmbiente ?? '';
      this.observacionesGenerales = borrador.observacionesGenerales ?? '';
    }
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
        const borrador = this.leerBorrador();
        const guardado = borrador?.checklistSeleccionado;
        this.checklistSeleccionado =
          guardado &&
          this.checklists.some((checklist) => checklist.documentId === guardado)
            ? guardado
            : this.checklists[0].documentId;
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
    this.persistirBorrador();
    this.tipoAmbiente = tipoAmbiente;
    void this.cargarChecklists();
  }

  onSedeChange(sede: string): void {
    this.facultadesDisponibles = sede ? facultadesDeSede(sede) : [...FACULTADES];
    if (!this.facultadesDisponibles.includes(this.facultad)) {
      this.facultad = '';
    }
    this.escuelasDisponibles = escuelasDeFacultad(this.facultad);
    if (!this.escuelasDisponibles.includes(this.escuela)) {
      this.escuela =
        this.escuelasDisponibles.length === 1
          ? this.escuelasDisponibles[0]
          : '';
    }
    this.persistirBorrador();
  }

  onFacultadChange(facultad: string): void {
    this.escuelasDisponibles = escuelasDeFacultad(facultad);
    this.escuela =
      this.escuelasDisponibles.length === 1
        ? this.escuelasDisponibles[0]
        : '';
    this.persistirBorrador();
  }

  onChecklistChange(): void {
    this.persistirBorrador();
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
    const guardados =
      this.leerBorrador()?.respuestasPorChecklist?.[this.checklistSeleccionado];
    for (const grupo of this.secciones) {
      for (const pregunta of grupo.preguntas) {
        this.respuestas[pregunta.documentId] = {
          respuesta: '',
          observacion: '',
        };
        const guardado = guardados?.[pregunta.documentId];
        if (guardado) {
          this.respuestas[pregunta.documentId].respuesta =
            (guardado.respuesta as TipoRespuesta) ?? '';
          this.respuestas[pregunta.documentId].observacion =
            guardado.observacion ?? '';
        }
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

  async seleccionarEvidencia(event: Event, pregunta: Pregunta): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const archivo = await this.comprimirImagen(input.files[0]);
    const respuesta = this.respuestas[pregunta.documentId];
    if (respuesta.evidenciaUrl) {
      URL.revokeObjectURL(respuesta.evidenciaUrl);
    }
    respuesta.evidencia = archivo;
    respuesta.evidenciaUrl = URL.createObjectURL(archivo);
    this.persistirBorrador();
  }

  private async comprimirImagen(
    archivo: File,
    maxLado = 1600,
    calidad = 0.72
  ): Promise<File> {
    if (!archivo.type.startsWith('image/')) {
      return archivo;
    }
    try {
      const bitmap = await createImageBitmap(archivo);
      const mayor = Math.max(bitmap.width, bitmap.height);
      if (mayor <= maxLado && archivo.size <= 400000) {
        bitmap.close();
        return archivo;
      }
      const escala = Math.min(1, maxLado / mayor);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * escala));
      canvas.height = Math.max(1, Math.round(bitmap.height * escala));
      const contexto = canvas.getContext('2d');
      if (!contexto) {
        bitmap.close();
        return archivo;
      }
      contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolver) =>
        canvas.toBlob(resolver, 'image/jpeg', calidad)
      );
      if (!blob) {
        return archivo;
      }
      const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], nombre, { type: 'image/jpeg' });
    } catch (error) {
      console.error('No se pudo comprimir la imagen:', error);
      return archivo;
    }
  }

  eliminarEvidencia(pregunta: Pregunta): void {
    const respuesta = this.respuestas[pregunta.documentId];
    if (respuesta.evidenciaUrl) {
      URL.revokeObjectURL(respuesta.evidenciaUrl);
    }
    respuesta.evidencia = undefined;
    respuesta.evidenciaUrl = undefined;
    this.persistirBorrador();
  }

  persistirBorrador(): void {
    const borrador: Borrador = {
      tipoAmbiente: this.tipoAmbiente,
      checklistSeleccionado: this.checklistSeleccionado,
      sedeFilial: this.sedeFilial,
      facultad: this.facultad,
      escuela: this.escuela,
      ambienteNumero: this.ambienteNumero,
      ubicacionAmbiente: this.ubicacionAmbiente,
      observacionesGenerales: this.observacionesGenerales,
      respuestasPorChecklist: this.leerBorrador()?.respuestasPorChecklist ?? {},
    };

    const respuestasActuales: Record<string, BorradorRespuesta> = {};
    for (const grupo of this.secciones) {
      for (const pregunta of grupo.preguntas) {
        const respuesta = this.respuestas[pregunta.documentId];
        if (!respuesta) {
          continue;
        }
        respuestasActuales[pregunta.documentId] = {
          respuesta: respuesta.respuesta,
          observacion: respuesta.observacion,
          evidenciaNombre: respuesta.evidencia?.name,
        };
      }
    }
    borrador.respuestasPorChecklist[this.checklistSeleccionado] =
      respuestasActuales;

    try {
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    } catch (error) {
      console.error('No se pudo guardar el borrador en el dispositivo:', error);
    }
  }

  private leerBorrador(): Borrador | null {
    try {
      const crudo = localStorage.getItem(CLAVE_BORRADOR);
      if (!crudo) {
        return null;
      }
      return JSON.parse(crudo) as Borrador;
    } catch (error) {
      console.error('No se pudo leer el borrador del dispositivo:', error);
      return null;
    }
  }

  limpiarBorradorPendiente(): void {
    try {
      localStorage.removeItem(CLAVE_BORRADOR);
    } catch (error) {
      console.error('No se pudo limpiar el borrador del dispositivo:', error);
    }
  }

  private tieneDatosParaGuardar(): boolean {
    if (this.sedeFilial || this.facultad || this.escuela || this.ambienteNumero || this.ubicacionAmbiente) {
      return true;
    }
    for (const grupo of this.secciones) {
      for (const pregunta of grupo.preguntas) {
        const respuesta = this.respuestas[pregunta.documentId];
        if (respuesta?.respuesta || respuesta?.observacion || respuesta?.evidencia) {
          return true;
        }
      }
    }
    return this.observacionesGenerales.length > 0;
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
      const evidenciasPorPregunta: Record<string, number[]> = {};
      const preguntasConEvidencia = preguntas.filter(
        (p) => this.respuestas[p.documentId].evidencia
      );

      const subidas = await Promise.all(
        preguntasConEvidencia.map(async (p) => {
          const media = await firstValueFrom(
            this.cbcService.subirEvidencia(this.respuestas[p.documentId].evidencia!)
          );
          return { idPregunta: p.documentId, id: media.id };
        })
      );
      for (const { idPregunta, id } of subidas) {
        evidenciasPorPregunta[idPregunta] = [id];
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

      await Promise.all(
        preguntas.map((p) => {
          const respuesta = this.respuestas[p.documentId];
          return firstValueFrom(
            this.cbcService.crearRespuesta({
              respuesta: respuesta.respuesta as 'SI' | 'NO' | 'NO_APLICA',
              esConforme: this.esConforme(p, respuesta.respuesta),
              observacion: respuesta.observacion,
              evaluacion: evaluacion.documentId,
              pregunta: p.documentId,
              evidencias: evidenciasPorPregunta[p.documentId] ?? [],
            })
          );
        })
      );

      this.mensajeExito = 'Evaluación guardada correctamente.';
      this.limpiarBorradorPendiente();
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