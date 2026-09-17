import { ChangeDetectorRef, Component } from '@angular/core';
import { apiMediaUrl } from '../services/api-url';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CbcService } from '../services/cbc.service';
import {
  EvaluacionDetalle,
  EvaluacionReporte,
  FACULTADES,
  Pregunta,
  RespuestaDetalle,
  Seccion,
  TODAS_LAS_ESCUELAS,
  escuelasDeFacultad,
  facultadesDeSede,
} from '../models/cbc.models';

interface DetallePregunta {
  pregunta: Pregunta;
  respuesta?: RespuestaDetalle;
}

interface DetalleSeccion {
  seccion: Seccion;
  preguntas: DetallePregunta[];
}

@Component({
  selector: 'app-reportes',
  imports: [FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes {
  facultadesDisponibles: string[] = [...FACULTADES];
  escuelasDisponibles = [...TODAS_LAS_ESCUELAS];
  sedeFilial = '';
  facultad = '';
  escuela = '';
  ambiente = '';
  fechaDesde = '';
  fechaHasta = '';
  estado = '';

  evaluaciones: EvaluacionReporte[] = [];
  cargando = false;
  mostrarOk = '';
  mostrarError = '';

  detalle: EvaluacionDetalle | null = null;
  cargandoDetalle = false;
  detalleFilas: DetalleSeccion[] = [];
  imagenAmpliada: string | null = null;

  constructor(
    private cbcService: CbcService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  onSedeChange(sede: string): void {
    this.facultadesDisponibles = sede ? facultadesDeSede(sede) : [...FACULTADES];
    if (this.facultad && !this.facultadesDisponibles.includes(this.facultad)) {
      this.facultad = '';
    }
    this.escuelasDisponibles = this.facultad
      ? escuelasDeFacultad(this.facultad)
      : [...TODAS_LAS_ESCUELAS];
    if (this.escuela && !this.escuelasDisponibles.includes(this.escuela)) {
      this.escuela = '';
    }
  }

  onFacultadChange(facultad: string): void {
    this.escuelasDisponibles = facultad
      ? escuelasDeFacultad(facultad)
      : [...TODAS_LAS_ESCUELAS];
    if (this.escuela && !this.escuelasDisponibles.includes(this.escuela)) {
      this.escuela = '';
    }
  }

  async buscar(): Promise<void> {
    this.cargando = true;
    this.mostrarOk = '';
    this.mostrarError = '';
    try {
      this.evaluaciones = await firstValueFrom(
        this.cbcService.getEvaluaciones({
          sede: this.sedeFilial.trim() || undefined,
          facultad: this.facultad.trim() || undefined,
          escuela: this.escuela.trim() || undefined,
          ambiente: this.ambiente.trim() || undefined,
          fechaDesde: this.fechaDesde || undefined,
          fechaHasta: this.fechaHasta || undefined,
          estado: this.estado || undefined,
        })
      );
      if (this.evaluaciones.length === 0) {
        this.mostrarOk =
          'No se encontraron evaluaciones con los filtros indicados.';
      }
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      this.mostrarError =
        'No se pudieron obtener las evaluaciones. Verifique la conexión.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  limpiar(): void {
    this.sedeFilial = '';
    this.facultad = '';
    this.escuela = '';
    this.facultadesDisponibles = [...FACULTADES];
    this.escuelasDisponibles = [...TODAS_LAS_ESCUELAS];
    this.ambiente = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.estado = '';
    this.evaluaciones = [];
    this.mostrarOk = '';
    this.mostrarError = '';
  }

  get hayResultados(): boolean {
    return this.evaluaciones.length > 0;
  }

  async verDetalle(evaluacion: EvaluacionReporte): Promise<void> {
    this.cargandoDetalle = true;
    this.detalle = null;
    this.detalleFilas = [];
    this.mostrarError = '';
    try {
      this.detalle = await firstValueFrom(
        this.cbcService.getEvaluacionDetalle(evaluacion.documentId)
      );
      this.construirDetalle();
    } catch (error) {
      console.error('Error obteniendo el detalle de la evaluación:', error);
      this.mostrarError =
        'No se pudo cargar el reporte individual de la evaluación.';
    } finally {
      this.cargandoDetalle = false;
      this.cdr.markForCheck();
    }
  }

  cerrarDetalle(): void {
    this.detalle = null;
    this.detalleFilas = [];
    this.imagenAmpliada = null;
  }

  ampliarImagen(url: string): void {
    this.imagenAmpliada = url;
    this.cdr.markForCheck();
  }

  cerrarImagen(): void {
    this.imagenAmpliada = null;
    this.cdr.markForCheck();
  }

  private construirDetalle(): void {
    const detalle = this.detalle;
    this.detalleFilas = [];
    if (!detalle) {
      return;
    }

    const secciones = detalle.checklist?.secciones;
    if (!secciones || secciones.length === 0) {
      const sinSeccion = (detalle.respuestas ?? [])
        .filter((r) => r.pregunta)
        .sort((a, b) => (a.pregunta!.orden ?? 0) - (b.pregunta!.orden ?? 0))
        .map((r) => ({ pregunta: r.pregunta!, respuesta: r }));
      if (sinSeccion.length) {
        this.detalleFilas = [
          {
            seccion: {
              documentId: '',
              codigo: '',
              nombre: 'Checklist',
              activo: null,
            },
            preguntas: sinSeccion,
          },
        ];
      }
      return;
    }

    this.detalleFilas = secciones
      .filter((s) => s.activo !== false)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((seccion) => ({
        seccion,
        preguntas: (seccion.preguntas ?? [])
          .filter((p) => p.activo !== false)
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((pregunta) => ({
            pregunta,
            respuesta: this.buscarRespuesta(pregunta.documentId),
          })),
      }));
  }

  private buscarRespuesta(
    preguntaDocumentId: string
  ): RespuestaDetalle | undefined {
    return this.detalle?.respuestas?.find(
      (r) => r.pregunta?.documentId === preguntaDocumentId
    );
  }

  etiquetaRespuesta(respuesta?: RespuestaDetalle): string {
    if (!respuesta?.respuesta) {
      return '—';
    }
    if (respuesta.respuesta === 'SI') {
      return 'Sí';
    }
    if (respuesta.respuesta === 'NO') {
      return 'No';
    }
    return 'N/A';
  }

  urlMedia(url: string): string {
    return apiMediaUrl(url);
  }

  private filas(): string[][] {
    return this.evaluaciones.map((e) => [
      e.fechaEvaluacion ?? '',
      e.sedeFilial ?? '',
      e.facultad ?? '',
      e.escuela ?? '',
      e.ambienteNumero ?? '',
      e.checklist?.nombre ?? '',
      e.estado ?? '',
      e.totalAplicables?.toString() ?? '0',
      e.totalConformes?.toString() ?? '0',
      e.totalNoConformes?.toString() ?? '0',
      e.totalNoAplica?.toString() ?? '0',
      e.porcentajeCumplimiento != null
        ? `${e.porcentajeCumplimiento}%`
        : '0%',
    ]);
  }

  exportarExcel(): void {
    void import('xlsx').then((XLSX) => {
      const filas = this.filas();
      const hoja = XLSX.utils.aoa_to_sheet([
        [
          'Fecha',
          'Sede / Filial',
          'Facultad',
          'Escuela',
          'Ambiente',
          'Checklist',
          'Estado',
          'Aplicables',
          'Conformes',
          'No conformes',
          'No aplica',
          '% Cumplimiento',
        ],
        ...filas,
      ]);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Evaluaciones');
      XLSX.writeFile(
        libro,
        `reporte-evaluaciones-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    });
  }

  exportarPDF(): void {
    void Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]).then(([{ jsPDF }, { default: autoTable }]) => {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(12);
      doc.text('Reporte de evaluaciones CBC III', 14, 14);

      autoTable(doc, {
        startY: 20,
        head: [
          [
            'Fecha',
            'Sede / Filial',
            'Facultad',
            'Escuela',
            'Ambiente',
            'Checklist',
            'Estado',
            'Apl.',
            'Conf.',
            'No conf.',
            'N/A',
            '%',
          ],
        ],
        body: this.filas(),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [39, 103, 73] },
      });

      doc.save(
        `reporte-evaluaciones-${new Date().toISOString().slice(0, 10)}.pdf`
      );
    });
  }

  exportarDetallePDF(): void {
    const detalle = this.detalle;
    if (!detalle) {
      return;
    }
    void Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]).then(([{ jsPDF }, { default: autoTable }]) => {
      const formatoLargo = this.detalleFilas.some(
        (grupo) => grupo.preguntas.length > 18
      );
      const doc = new jsPDF({
        orientation: formatoLargo ? 'portrait' : 'landscape',
      });

      doc.setFontSize(11);
      doc.text(
        `Reporte individual de evaluación - ${detalle.checklist?.nombre ?? 'CBC III'}`,
        14,
        12
      );

      const datos: [string, string][] = [
        ['Fecha', detalle.fechaEvaluacion ?? ''],
        ['Sede / Filial', detalle.sedeFilial ?? ''],
        ['Facultad', detalle.facultad ?? ''],
        ['Escuela', detalle.escuela ?? ''],
        ['Ambiente', detalle.ambienteNumero ?? ''],
        ['Ubicación', detalle.ubicacionAmbiente ?? ''],
        ['Estado', detalle.estado ?? ''],
      ];
      autoTable(doc, {
        startY: 17,
        head: [['Dato', 'Valor']],
        body: datos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [39, 103, 73] },
        theme: 'grid',
      });

      const cuerpo: (string | string[])[][] = [];
      for (const grupo of this.detalleFilas) {
        cuerpo.push([grupo.seccion.nombre, `(${grupo.preguntas.length} preguntas)`, '', '', '']);
        for (const fila of grupo.preguntas) {
          const evidencias = (fila.respuesta?.evidencias ?? []).map(
            (m) => m.name
          );
          cuerpo.push([
            String(fila.pregunta.numero ?? ''),
            fila.pregunta.texto ?? '',
            this.etiquetaRespuesta(fila.respuesta),
            fila.respuesta?.observacion ?? '',
            evidencias.length ? evidencias.join(', ') : '',
          ]);
        }
      }

      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY
          ? ((doc as unknown as { lastAutoTable: { finalY: number } })
              .lastAutoTable.finalY + 6)
          : 40,
        head: [
          ['Item', 'Consideraciones', 'Cumplimiento', 'Observaciones', 'Prueba'],
        ],
        body: cuerpo,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [39, 103, 73] },
      });

      if (detalle.observacionesGenerales) {
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } })
          .lastAutoTable.finalY;
        doc.setFontSize(9);
        doc.text('Observaciones generales:', 14, finalY + 8);
        doc.text(detalle.observacionesGenerales, 14, finalY + 14);
      }

      doc.save(
        `reporte-individual-${new Date().toISOString().slice(0, 10)}.pdf`
      );
    });
  }
}