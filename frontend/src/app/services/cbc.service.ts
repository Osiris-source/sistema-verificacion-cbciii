import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  Checklist,
  EntidadCreada,
  Evaluacion,
  EvaluacionDetalle,
  EvaluacionReporte,
  FiltrosReporte,
  NuevaPregunta,
  Pregunta,
  Respuesta,
  StrapiMedia,
  TipoAmbiente,
} from '../models/cbc.models';

@Injectable({
  providedIn: 'root',
})
export class CbcService {
  private apiUrl = 'http://localhost:1337/api';

  constructor(private http: HttpClient) {}

  getChecklists(tipoAmbiente: TipoAmbiente): Observable<Checklist[]> {
    const params = new HttpParams()
      .set('filters[tipoAmbiente][$eq]', tipoAmbiente)
      .set('filters[activo][$eq]', 'true')
      .set('populate', 'secciones.preguntas')
      .set('sort', 'version:desc');
    return this.http
      .get<{ data: Checklist[] }>(`${this.apiUrl}/checklists`, { params })
      .pipe(map((respuesta) => respuesta.data));
  }

  subirEvidencia(archivo: File): Observable<StrapiMedia> {
    const formData = new FormData();
    formData.append('files', archivo);
    return this.http
      .post<StrapiMedia[]>(`${this.apiUrl}/upload`, formData)
      .pipe(map((respuesta) => respuesta[0]));
  }

  crearEvaluacion(evaluacion: Evaluacion): Observable<EntidadCreada> {
    return this.http
      .post<{ data: EntidadCreada }>(`${this.apiUrl}/evaluaciones`, {
        data: evaluacion,
      })
      .pipe(map((respuesta) => respuesta.data));
  }

  crearPregunta(pregunta: NuevaPregunta): Observable<Pregunta> {
    return this.http
      .post<{ data: Pregunta }>(`${this.apiUrl}/preguntas/crear`, {
        data: pregunta,
      })
      .pipe(map((respuesta) => respuesta.data));
  }

  crearRespuesta(respuesta: Respuesta): Observable<EntidadCreada> {
    return this.http
      .post<{ data: EntidadCreada }>(`${this.apiUrl}/respuestas`, {
        data: respuesta,
      })
      .pipe(map((respuesta) => respuesta.data));
  }

  publicarEntidad(entidad: string, documentId: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/${entidad}/${documentId}/publish`,
      {}
    );
  }

  getEvaluaciones(filtros: FiltrosReporte = {}): Observable<EvaluacionReporte[]> {
    let params = new HttpParams()
      .set('sort', 'fechaEvaluacion:desc')
      .set('populate[checklist]', 'true')
      .set('pagination[pageSize]', '1000');

    if (filtros.sede) {
      params = params.set(
        'filters[sedeFilial][$contains]',
        filtros.sede
      );
    }
    if (filtros.facultad) {
      params = params.set(
        'filters[facultad][$contains]',
        filtros.facultad
      );
    }
    if (filtros.escuela) {
      params = params.set(
        'filters[escuela][$contains]',
        filtros.escuela
      );
    }
    if (filtros.ambiente) {
      params = params.set(
        'filters[ambienteNumero][$contains]',
        filtros.ambiente
      );
    }
    if (filtros.fechaDesde) {
      params = params.set(
        'filters[fechaEvaluacion][$gte]',
        filtros.fechaDesde
      );
    }
    if (filtros.fechaHasta) {
      params = params.set(
        'filters[fechaEvaluacion][$lte]',
        filtros.fechaHasta
      );
    }
    if (filtros.estado) {
      params = params.set('filters[estado][$eq]', filtros.estado);
    }

    return this.http
      .get<{ data: EvaluacionReporte[] }>(`${this.apiUrl}/evaluaciones`, {
        params,
      })
      .pipe(map((respuesta) => respuesta.data));
  }

  getEvaluacionDetalle(documentId: string): Observable<EvaluacionDetalle> {
    const params = new HttpParams()
      .set('populate[respuestas][populate][pregunta]', 'true')
      .set('populate[respuestas][populate][evidencias]', 'true')
      .set(
        'populate[checklist][populate][secciones][populate][preguntas]',
        'true'
      );
    return this.http
      .get<{ data: EvaluacionDetalle }>(
        `${this.apiUrl}/evaluaciones/${documentId}`,
        { params }
      )
      .pipe(map((respuesta) => respuesta.data));
  }
}