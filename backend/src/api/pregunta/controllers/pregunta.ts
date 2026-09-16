/**
 * pregunta controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::pregunta.pregunta',
  ({ strapi }) => ({
    async crearPublica(ctx) {
      const { data } = ctx.request.body as { data?: Record<string, unknown> };
      const servicio = strapi.service('api::pregunta.pregunta');

      const creada = await servicio.create({ data: data ?? {} });

      const publicada = await servicio.update(creada.documentId, {
        data: {
          publishedAt: new Date().toISOString(),
        } as Record<string, unknown>,
      });

      ctx.body = { data: publicada };
    },
    async eliminarPublica(ctx) {
      const { documentId } = ctx.params;
      const servicio = strapi.service('api::pregunta.pregunta');

      await servicio.delete(documentId);

      ctx.body = { data: { documentId } };
    },
  })
);