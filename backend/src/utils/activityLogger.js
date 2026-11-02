const recordActivity = async (queryable, {
  actorId,
  actorName,
  actorRole,
  activityType,
  description,
  ticketId = null,
  metadata = {}
}) => {
  if (!actorId || !activityType || !description) {
    throw new Error('Data aktivitas wajib menyertakan pengguna, jenis, dan deskripsi.');
  }

  await queryable.query(
    `INSERT INTO activity_logs (
       user_id, actor_name, actor_role, activity_type, description, ticket_id, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      actorId,
      actorName || 'Pengguna',
      actorRole || 'UNKNOWN',
      activityType,
      description,
      ticketId,
      JSON.stringify(metadata || {})
    ]
  );
};

const recordRequestActivity = (queryable, req, activity) => {
  const roles = ((Array.isArray(req.user?.roles) && req.user.roles.length) ? req.user.roles : [req.user?.role])
    .filter(Boolean)
    .map(role => String(role).toUpperCase());

  return recordActivity(queryable, {
    actorId: req.user?.id,
    actorName: req.user?.name || req.user?.full_name,
    actorRole: roles.join(', ') || 'UNKNOWN',
    ...activity
  });
};

module.exports = { recordActivity, recordRequestActivity };
