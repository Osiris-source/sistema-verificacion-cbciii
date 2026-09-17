export const FACULTADES = [
  'Facultad de Ingeniería de Sistemas e Informática',
  'Facultad de Derecho y Ciencias Políticas',
  'Facultad de Medicina Humana',
  'Facultad de Ciencias de la Salud',
  'Facultad de Ciencias Económicas',
  'FEyH - Idiomas',
  'Facultad de Ingeniería Agroindustrial',
  'Facultad de Ciencias Agrarias',
  'Facultad de Ingeniería Civil y Arquitectura',
  'Facultad de Medicina Veterinaria',
  'FCE - Turismo',
  'Facultad de Educación y Humanidades',
  'Facultad de Ecología',
];

export const FACULTAD_ESCUELAS: Record<string, string[]> = {
  'Facultad de Ingeniería de Sistemas e Informática': [
    'Ingeniería de Sistemas e Informática',
  ],
  'Facultad de Derecho y Ciencias Políticas': ['Derecho'],
  'Facultad de Medicina Humana': ['Medicina Humana', 'Enfermería'],
  'Facultad de Ciencias de la Salud': ['Obstetricia'],
  'Facultad de Ciencias Económicas': [
    'Administración',
    'Economía',
    'Contabilidad',
  ],
  'FEyH - Idiomas': ['Idiomas'],
  'Facultad de Ingeniería Agroindustrial': ['Ingeniería Agroindustrial'],
  'Facultad de Ciencias Agrarias': ['Agronomía'],
  'Facultad de Ingeniería Civil y Arquitectura': [
    'Ingeniería Civil',
    'Arquitectura',
  ],
  'Facultad de Medicina Veterinaria': ['Medicina Veterinaria'],
  'FCE - Turismo': ['Turismo'],
  'Facultad de Educación y Humanidades': [
    'Educación Inicial',
    'Educación Primaria',
    'Educación Secundaria',
    'Psicología',
  ],
  'Facultad de Ecología': ['Ingeniería Ambiental', 'Ingeniería Sanitaria'],
};

export function escuelasDeFacultad(facultad: string): string[] {
  return FACULTAD_ESCUELAS[facultad] ?? [];
}

export const SEDE_FACULTADES: Record<string, string[]> = {
  Tarapoto: [
    'Facultad de Ingeniería de Sistemas e Informática',
    'Facultad de Derecho y Ciencias Políticas',
    'Facultad de Medicina Humana',
    'Facultad de Ciencias de la Salud',
    'Facultad de Ciencias Económicas',
    'FEyH - Idiomas',
    'Facultad de Ingeniería Agroindustrial',
    'Facultad de Ciencias Agrarias',
    'Facultad de Ingeniería Civil y Arquitectura',
    'Facultad de Medicina Veterinaria',
  ],
  Lamas: ['FCE - Turismo'],
  Rioja: ['Facultad de Educación y Humanidades'],
  Moyobamba: ['Facultad de Ecología'],
};

export function facultadesDeSede(sede: string): string[] {
  return SEDE_FACULTADES[sede] ?? FACULTADES;
}

export const TODAS_LAS_ESCUELAS = Array.from(
  new Set(Object.values(FACULTAD_ESCUELAS).flat())
);

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