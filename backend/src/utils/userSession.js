const incrementUserSessionVersion = async (db, userId) => {
  const result = await db.query(
    `UPDATE users
     SET session_version = session_version + 1
     WHERE id = $1
     RETURNING session_version`,
    [userId]
  );
  if (!result.rows[0]) {
    throw new Error('Pengguna sesi tidak ditemukan.');
  }
  return Number(result.rows[0].session_version);
};

module.exports = { incrementUserSessionVersion };
