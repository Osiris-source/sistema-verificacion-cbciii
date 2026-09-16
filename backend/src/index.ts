const UPLOAD_ACTION = 'plugin::upload.content-api.upload';

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: any }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      return;
    }

    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action: UPLOAD_ACTION } });

    if (!existing) {
      const permission = await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action: UPLOAD_ACTION } });

      await strapi.db
        .query('plugin::users-permissions.permission-role-link')
        .create({
          data: { role_id: publicRole.id, permission_id: permission.id },
        });
    }
  },
};
