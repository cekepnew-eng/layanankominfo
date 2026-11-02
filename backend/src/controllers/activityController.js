const db = require('../config/database');

const VALID_ROLES = new Set(['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER', 'MASYARAKAT']);
const MAX_PAGE_SIZE = 100;

const getUserRoles = user => ((Array.isArray(user?.roles) && user.roles.length) ? user.roles : [user?.role])
  .filter(Boolean)
  .map(role => String(role).toUpperCase());

exports.getActivityLogs = async (req, res) => {
  const roles = getUserRoles(req.user);
  const isAdmin = roles.includes('ADMIN');
  const isHelpdesk = roles.includes('HELPDESK');
  const isEmployee = roles.includes('PEGAWAI');
  const isOpd = roles.includes('USER');
  const isCommunity = roles.includes('MASYARAKAT');

  if (!isAdmin && !isHelpdesk && !isEmployee && !isOpd && !isCommunity) {
    return res.status(403).json({ success: false, message: 'Akses Log Activity tidak diizinkan.' });
  }

  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedPageSize = Number.parseInt(req.query.pageSize, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 100000)
    : 1;
  const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0
    ? Math.min(requestedPageSize, MAX_PAGE_SIZE)
    : 25;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 200) : '';
  const activityType = typeof req.query.type === 'string' ? req.query.type.trim().slice(0, 80) : '';
  const from = typeof req.query.from === 'string' ? req.query.from : '';
  const to = typeof req.query.to === 'string' ? req.query.to : '';
  const actor = isAdmin && typeof req.query.actor === 'string'
    ? req.query.actor.trim().slice(0, 200)
    : '';
  const actorRole = isAdmin && typeof req.query.role === 'string'
    ? req.query.role.trim().toUpperCase()
    : '';

  const isDate = value => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsedDate = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
  };
  if (!isDate(from) || !isDate(to) || (from && to && from > to)) {
    return res.status(400).json({ success: false, message: 'Rentang tanggal tidak valid.' });
  }
  if (actorRole && !VALID_ROLES.has(actorRole)) {
    return res.status(400).json({ success: false, message: 'Role filter tidak valid.' });
  }

  const conditions = [];
  const params = [];
  const addParam = value => {
    params.push(value);
    return `$${params.length}`;
  };

  if (isHelpdesk && !isAdmin) {
    conditions.push(`activity_source = 'ticket' AND ticket_id IS NOT NULL`);
  } else if (isEmployee && !isAdmin && !isHelpdesk) {
    const userId = addParam(req.user.id);
    conditions.push(`activity_source = 'ticket' AND ticket_id IN (
      SELECT assignment.ticket_id
      FROM ticket_assignments assignment
      LEFT JOIN team_members member ON member.team_id = assignment.team_id
      WHERE assignment.assigned_to_user_id = ${userId} OR member.user_id = ${userId}
      UNION
      SELECT task.ticket_id FROM subtasks task WHERE task.assigned_to = ${userId}
      UNION
      SELECT history.ticket_id FROM ticket_histories history WHERE history.changed_by_user_id = ${userId}
    )`);
  } else if (isOpd && !isAdmin && !isHelpdesk && !isEmployee) {
    const userId = addParam(req.user.id);
    conditions.push(`activity_source = 'ticket' AND ticket_id IN (
      SELECT ticket.id FROM tickets ticket WHERE ticket.user_id = ${userId}
    )`);
  } else if (isCommunity && !isAdmin && !isHelpdesk && !isEmployee && !isOpd) {
    const userId = addParam(req.user.id);
    conditions.push(`activity_source = 'ticket' AND ticket_id IN (
      SELECT ticket.id FROM tickets ticket WHERE ticket.user_id = ${userId}
    )`);
  }

  if (search) {
    const value = addParam(`%${search}%`);
    conditions.push(`(
      actor_name ILIKE ${value}
      OR description ILIKE ${value}
      OR activity_type ILIKE ${value}
      OR COALESCE(ticket_number, '') ILIKE ${value}
    )`);
  }
  if (activityType) conditions.push(`activity_type = ${addParam(activityType)}`);
  if (from) conditions.push(`created_at >= ${addParam(from)}::date`);
  if (to) conditions.push(`created_at < (${addParam(to)}::date + INTERVAL '1 day')`);
  if (actor) conditions.push(`actor_name ILIKE ${addParam(`%${actor}%`)}`);
  if (actorRole) conditions.push(`actor_role ILIKE ${addParam(`%${actorRole}%`)}`);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitParam = addParam(pageSize);
  const offsetParam = addParam((page - 1) * pageSize);

  try {
    const result = await db.query(
      `WITH activity_rows AS (
        SELECT
          'ticket-history:' || history.id::text AS id,
          history.changed_by_user_id AS actor_id,
          COALESCE(actor.full_name, 'Akun dihapus') AS actor_name,
          COALESCE(NULLIF(actor_roles.names, ''), 'UNKNOWN') AS actor_role,
          CASE
            WHEN history.old_status_id IS NULL THEN 'ticket_created'
            WHEN history.log_description ILIKE '%ditugaskan%' OR history.log_description ILIKE '%penugasan%'
              THEN 'ticket_assignment'
            WHEN history.log_description ILIKE '%progres%' OR history.log_description ILIKE '%subtask%'
              THEN 'ticket_progress_updated'
            WHEN history.old_status_id IS DISTINCT FROM history.new_status_id THEN 'ticket_status_changed'
            ELSE 'ticket_updated'
          END AS activity_type,
          history.log_description AS description,
          history.ticket_id,
          ticket.ticket_number,
          jsonb_build_object(
            'oldStatusId', history.old_status_id,
            'newStatusId', history.new_status_id
          ) AS metadata,
          history.created_at,
          'ticket'::text AS activity_source
        FROM ticket_histories history
        LEFT JOIN users actor ON actor.id = history.changed_by_user_id
        LEFT JOIN tickets ticket ON ticket.id = history.ticket_id
        LEFT JOIN LATERAL (
          SELECT string_agg(DISTINCT role.name, ', ') AS names
          FROM user_roles user_role
          JOIN roles role ON role.id = user_role.role_id
          WHERE user_role.user_id = history.changed_by_user_id
        ) actor_roles ON true

        UNION ALL

        SELECT
          'system:' || log.id::text AS id,
          log.user_id AS actor_id,
          log.actor_name,
          log.actor_role,
          log.activity_type,
          log.description,
          log.ticket_id,
          ticket.ticket_number,
          log.metadata,
          log.created_at,
          CASE WHEN log.ticket_id IS NULL THEN 'system' ELSE 'ticket' END AS activity_source
        FROM activity_logs log
        LEFT JOIN tickets ticket ON ticket.id = log.ticket_id
      )
      SELECT activity_rows.*, COUNT(*) OVER()::int AS total_count
      FROM activity_rows
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    const total = result.rows.length ? result.rows[0].total_count : 0;
    res.json({
      success: true,
      data: result.rows.map(({ total_count, ...activity }) => activity),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('getActivityLogs error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat Log Activity.' });
  }
};
