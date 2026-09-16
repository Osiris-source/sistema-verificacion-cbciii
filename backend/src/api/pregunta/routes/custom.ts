/**
 * Ruta custom pública para crear preguntas desde el frontend sin autenticación.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/preguntas/crear',
      handler: 'pregunta.crearPublica',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/preguntas/eliminar/:documentId',
      handler: 'pregunta.eliminarPublica',
      config: {
        auth: false,
      },
    },
  ],
};