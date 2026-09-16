export type TipoAmbiente = 'AULA' | 'LABORATORIO' | 'PABELLON';

export type TipoRespuesta = 'SI' | 'NO' | 'NO_APLICA' | '';

export interface Checklist {
  documentId: string;
  nombre: string;
  tipoAmbiente: TipoAmbiente;
  version?: string;
  descripcion?: string;
  activo: boolean | null;
  secciones?: Seccion[];
}

export interface Seccion {
  documentId: string;
  codigo: string;
  nombre: string;
  orden?: number;
  activo: boolean | null;
  preguntas?: Pregunta[];
}

export interface Pregunta {
  documentId: string;
  codigo: string;
  numero?: number;
  texto?: string;
  orden?: number;
  respuestaConforme?: 'SI' | 'NO';
  permiteEvidencia: boolean;
  requiereEvidenciaNoConforme: boolean;
  requiereObservacionNoConforme: boolean;
  activo: boolean | null;
}

export interface RespuestaFormulario {
  respuesta: TipoRespuesta;
  observacion: string;
  evidencia?: File;
  evidenciaUrl?: string;
}

export interface Respuesta {
  respuesta: 'SI' | 'NO' | 'NO_APLICA';
  esConforme: boolean;
  observacion?: string;
  evaluacion: string;
  pregunta: string;
  evidencias?: number[];
}

export interface Evaluacion {
  fechaEvaluacion: string;
  estado: 'BORRADOR' | 'FINALIZADO';
  observacionesGenerales?: string;
  porcentajeCumplimiento?: number;
  totalAplicables?: number;
  totalConformes?: number;
  totalNoConformes?: number;
  totalNoAplica?: number;
  sedeFilial?: string;
  facultad?: string;
  escuela?: string;
  ambienteNumero?: string;
  ubicacionAmbiente?: string;
  checklist?: string;
}

export interface EvaluacionReporte {
  id: number;
  documentId: string;
  fechaEvaluacion: string;
  estado: string;
  observacionesGenerales?: string;
  porcentajeCumplimiento?: number;
  totalAplicables?: number;
  totalConformes?: number;
  totalNoConformes?: number;
  totalNoAplica?: number;
  sedeFilial?: string;
  facultad?: string;
  escuela?: string;
  ambienteNumero?: string;
  ubicacionAmbiente?: string;
  checklist?: { nombre?: string };
}

export interface RespuestaDetalle {
  documentId: string;
  respuesta: 'SI' | 'NO' | 'NO_APLICA';
  esConforme: boolean;
  observacion?: string;
  pregunta?: Pregunta;
  evidencias?: StrapiMedia[];
}

export interface EvaluacionDetalle extends EvaluacionReporte {
  checklist?: Checklist;
  respuestas?: RespuestaDetalle[];
}

export interface FiltrosReporte {
  sede?: string;
  facultad?: string;
  escuela?: string;
  ambiente?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}

export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  url: string;
}

export interface EntidadCreada {
  documentId: string;
}

export interface NuevaPregunta {
  codigo: string;
  numero: number;
  orden: number;
  texto: string;
  respuestaConforme: 'SI' | 'NO';
  permiteEvidencia: boolean;
  requiereEvidenciaNoConforme: boolean;
  requiereObservacionNoConforme: boolean;
  activo: boolean;
  seccion: string;
}