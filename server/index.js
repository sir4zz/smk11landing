import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET wajib diisi pada file .env');

const db = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME || 'smkn11ts', waitForConnections: true, connectionLimit: 10 });
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

const allowedTypes = new Set(['news', 'programs', 'facilities', 'staff', 'achievements']);
const publicTypes = new Set(['programs', 'facilities', 'staff', 'news', 'achievements']);
const jsonColumns = { programs: ['competencies', 'careerProspects', 'facilities'], achievements: ['students'] };
function parseRows(table, rows) {
  const cols = jsonColumns[table] || [];
  if (!cols.length) return rows;
  return rows.map(r => ({ ...r, ...Object.fromEntries(cols.map(c => [c, typeof r[c] === 'string' ? JSON.parse(r[c]) : r[c]])) }));
}
const ppdbStatuses = ['Menunggu Verifikasi', 'Sedang Diverifikasi', 'Perlu Perbaikan Dokumen', 'Lolos Seleksi', 'Cadangan', 'Tidak Lolos', 'Sudah Daftar Ulang'];
const docTypes = ['pas_foto', 'kartu_keluarga', 'akta_kelahiran', 'rapor', 'skl', 'dokumen_pendukung'];

function genRegNumber() {
  return `PPDB-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

const adminAuth = (req, res, next) => { const token = req.headers.authorization?.replace('Bearer ', ''); try { req.user = jwt.verify(token, jwtSecret); next(); } catch { res.status(401).json({ message: 'Sesi tidak valid.' }); } };

const applicantAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Silakan masuk terlebih dahulu.' });
  try {
    const p = jwt.verify(token, jwtSecret);
    const [rows] = await db.query('SELECT id, name, email, phone FROM ppdb_users WHERE id = ?', [p.id]);
    if (!rows.length) return res.status(401).json({ message: 'Akun tidak ditemukan.' });
    req.user = rows[0]; next();
  } catch { res.status(401).json({ message: 'Sesi tidak valid.' }); }
};

/* ===== Stats & Public ===== */
app.get('/api/public/stats', async (_req, res) => {
  try {
    const [pc] = await db.query(`SELECT COUNT(*) AS c FROM programs`);
    const [ac] = await db.query(`SELECT COUNT(*) AS c FROM achievements`);
    const [sr] = await db.query('SELECT stat_key, stat_value FROM site_stats');
    const m = {}; for (const r of sr) m[r.stat_key] = r.stat_value;
    res.json({ students: m.students || '1.124+', teachers: m.teachers || '51+', programs: String(pc[0].c || 6), achievements: String(ac[0].c || 33) });
  } catch { res.json({ students: '1.124+', teachers: '51+', programs: '6', achievements: '33' }); }
});
app.get('/api/public/content/:type', async (req, res) => {
  if (!publicTypes.has(req.params.type)) return res.sendStatus(404);
  try { const [rows] = await db.query(`SELECT * FROM ${req.params.type} ORDER BY updated_at DESC`); res.json(parseRows(req.params.type, rows)); } catch { res.status(503).json({ message: 'Konten belum tersedia.' }); }
});
app.get('/api/public/content/:type/:id', async (req, res) => {
  if (!publicTypes.has(req.params.type)) return res.sendStatus(404);
  const [rows] = await db.query(`SELECT * FROM ${req.params.type} WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.sendStatus(404);
  res.json(parseRows(req.params.type, rows)[0]);
});

/* ===== Auth ===== */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({ message: 'Username atau kata sandi salah.' });
  const token = jwt.sign({ id: u.id, username: u.username, role: u.role }, jwtSecret, { expiresIn: '8h' });
  res.json({ token, user: { id: u.id, username: u.username, role: u.role } });
});
app.get('/api/health', async (_req, res) => { try { await db.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); } });

/* ===== Admin Content CRUD (per-table) ===== */
app.get('/api/content/:type', adminAuth, async (req, res) => {
  if (!allowedTypes.has(req.params.type)) return res.sendStatus(404);
  const [rows] = await db.query(`SELECT * FROM ${req.params.type} ORDER BY updated_at DESC`);
  res.json(parseRows(req.params.type, rows));
});
app.post('/api/content/:type', adminAuth, async (req, res) => {
  if (!allowedTypes.has(req.params.type)) return res.sendStatus(404);
  const id = req.body.id || randomUUID();
  const data = { ...req.body, id };
  const keys = Object.keys(data);
  const vals = keys.map(k => Array.isArray(data[k]) ? JSON.stringify(data[k]) : data[k]);
  await db.query(`INSERT INTO ${req.params.type} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, vals);
  res.status(201).json(data);
});
app.put('/api/content/:type/:id', adminAuth, async (req, res) => {
  if (!allowedTypes.has(req.params.type)) return res.sendStatus(404);
  const data = { ...req.body }; delete data.id;
  const keys = Object.keys(data);
  const vals = keys.map(k => Array.isArray(data[k]) ? JSON.stringify(data[k]) : data[k]);
  const [r] = await db.query(`UPDATE ${req.params.type} SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`, [...vals, req.params.id]);
  if (!r.affectedRows) return res.sendStatus(404);
  res.json({ id: req.params.id, ...req.body });
});
app.delete('/api/content/:type/:id', adminAuth, async (req, res) => {
  const [r] = await db.query(`DELETE FROM ${req.params.type} WHERE id=?`, [req.params.id]);
  res.status(r.affectedRows ? 204 : 404).end();
});

/* ===== Contact ===== */
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (![name, email, subject, message].every(v => v && v.trim())) return res.status(400).json({ message: 'Semua field wajib diisi.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Email tidak valid.' });
  const id = randomUUID();
  await db.query('INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?,?,?,?,?)', [id, name.trim(), email.trim(), subject.trim(), message.trim()]);
  res.status(201).json({ id, message: 'Pesan berhasil dikirim.' });
});
app.get('/api/contact', adminAuth, async (_req, res) => {
  const [rows] = await db.query('SELECT id, name, email, subject, message, is_read AS isRead, created_at AS date FROM contact_messages ORDER BY created_at DESC'); res.json(rows);
});
app.put('/api/contact/:id/read', adminAuth, async (req, res) => {
  const [r] = await db.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]); if (!r.affectedRows) return res.sendStatus(404); res.json({ ok: true });
});
app.delete('/api/contact/:id', adminAuth, async (req, res) => {
  const [r] = await db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]); res.status(r.affectedRows ? 204 : 404).end();
});

/* ======================================================== */
/* ===== NEW PPDB SYSTEM ===== */
/* ======================================================== */

/* --- Applicant Auth --- */
app.post('/api/ppdb/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (![name, email, phone, password].every(v => v && v.trim())) return res.status(400).json({ message: 'Semua field wajib diisi.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Format email tidak valid.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  const [existing] = await db.query('SELECT id FROM ppdb_users WHERE email = ?', [email]);
  if (existing.length) return res.status(409).json({ message: 'Email sudah terdaftar.' });
  const id = randomUUID();
  await db.query('INSERT INTO ppdb_users (id, name, email, phone, password_hash) VALUES (?,?,?,?,?)', [id, name.trim(), email.trim(), phone.trim(), await bcrypt.hash(password, 12)]);
  const token = jwt.sign({ id }, jwtSecret, { expiresIn: '30d' });
  res.status(201).json({ token, user: { id, name: name.trim(), email: email.trim(), phone: phone.trim() } });
});

app.post('/api/ppdb/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (![email, password].every(v => v && v.trim())) return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  const [rows] = await db.query('SELECT * FROM ppdb_users WHERE email = ?', [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({ message: 'Email atau password salah.' });
  const token = jwt.sign({ id: u.id }, jwtSecret, { expiresIn: '30d' });
  res.json({ token, user: { id: u.id, name: u.name, email: u.email, phone: u.phone } });
});

/* --- Applicant Dashboard --- */
app.get('/api/ppdb/me', applicantAuth, async (req, res) => {
  const regRows = await db.query('SELECT * FROM ppdb_registrations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
  const registration = regRows[0][0] || null;
  const [docs] = registration ? await db.query('SELECT id, type, filename, mime_type, file_size, verified, note, created_at FROM ppdb_documents WHERE application_id = ? ORDER BY created_at', [registration.id]) : [];
  const [activities] = registration ? await db.query('SELECT action, note, created_at FROM ppdb_activity_log WHERE application_id = ? ORDER BY created_at DESC LIMIT 20', [registration.id]) : [];
  res.json({ user: req.user, registration, documents: docs || [], activities: activities || [] });
});

/* --- Biodata --- */
app.put('/api/ppdb/biodata', applicantAuth, async (req, res) => {
  const { full_name, nisn, nik, gender, place_of_birth, date_of_birth, religion, address, phone, father_name, father_occupation, mother_name, mother_occupation, guardian_name, guardian_phone, parent_address, previous_school, previous_school_address, graduation_year, program } = req.body;
  const [existing] = await db.query('SELECT id, status FROM ppdb_registrations WHERE user_id = ?', [req.user.id]);
  if (existing.length && existing[0].status !== 'Menunggu Verifikasi' && existing[0].status !== 'Perlu Perbaikan Dokumen') return res.status(400).json({ message: 'Pendaftaran sudah diproses, tidak dapat diubah.' });
  if (existing.length) {
    await db.query(`UPDATE ppdb_registrations SET full_name=?, nisn=?, nik=?, gender=?, place_of_birth=?, date_of_birth=?, religion=?, address=?, phone=?, father_name=?, father_occupation=?, mother_name=?, mother_occupation=?, guardian_name=?, guardian_phone=?, parent_address=?, previous_school=?, previous_school_address=?, graduation_year=?, program=?, updated_at=NOW() WHERE user_id=?`,
      [full_name, nisn, nik, gender, place_of_birth, date_of_birth, religion, address, phone, father_name, father_occupation, mother_name, mother_occupation, guardian_name, guardian_phone, parent_address, previous_school, previous_school_address, graduation_year, program, req.user.id]);
  } else {
    const id = randomUUID();
    await db.query(`INSERT INTO ppdb_registrations (id, user_id, registration_number, full_name, nisn, nik, gender, place_of_birth, date_of_birth, religion, address, phone, father_name, father_occupation, mother_name, mother_occupation, guardian_name, guardian_phone, parent_address, previous_school, previous_school_address, graduation_year, program) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, req.user.id, genRegNumber(), full_name, nisn, nik, gender, place_of_birth, date_of_birth, religion, address, phone, father_name, father_occupation, mother_name, mother_occupation, guardian_name, guardian_phone, parent_address, previous_school, previous_school_address, graduation_year, program]);
  }
  res.json({ message: 'Biodata berhasil disimpan.' });
});

/* --- Documents --- */
app.post('/api/ppdb/documents', applicantAuth, async (req, res) => {
  const { type, filename, file_data, mime_type } = req.body;
  if (!docTypes.includes(type)) return res.status(400).json({ message: 'Tipe dokumen tidak valid.' });
  if (!file_data) return res.status(400).json({ message: 'File harus diupload.' });
  const [reg] = await db.query('SELECT id FROM ppdb_registrations WHERE user_id = ?', [req.user.id]);
  if (!reg.length) return res.status(400).json({ message: 'Lengkapi biodata terlebih dahulu.' });
  const appId = reg[0].id;
  const existing = await db.query('SELECT id FROM ppdb_documents WHERE application_id = ? AND type = ?', [appId, type]);
  if (existing[0].length) return res.status(400).json({ message: 'Dokumen jenis ini sudah diupload. Hapus terlebih dahulu untuk mengupload ulang.' });
  const id = randomUUID();
  const size = Math.round(file_data.length * 0.75);
  await db.query('INSERT INTO ppdb_documents (id, application_id, type, filename, file_data, mime_type, file_size) VALUES (?,?,?,?,?,?,?)', [id, appId, type, filename || type, file_data, mime_type || 'image/jpeg', size]);
  await db.query('UPDATE ppdb_registrations SET documents_count = documents_count + 1 WHERE id = ?', [appId]);
  res.status(201).json({ id, type, filename, mime_type, file_size: size, verified: 0, note: null });
});

app.delete('/api/ppdb/documents/:id', applicantAuth, async (req, res) => {
  const [doc] = await db.query('SELECT d.id, d.application_id FROM ppdb_documents d JOIN ppdb_registrations r ON r.id = d.application_id WHERE d.id = ? AND r.user_id = ?', [req.params.id, req.user.id]);
  if (!doc.length) return res.sendStatus(404);
  await db.query('DELETE FROM ppdb_documents WHERE id = ?', [req.params.id]);
  await db.query('UPDATE ppdb_registrations SET documents_count = GREATEST(documents_count - 1, 0) WHERE id = ?', [doc[0].application_id]);
  res.status(204).end();
});

/* --- Submit --- */
app.post('/api/ppdb/submit', applicantAuth, async (req, res) => {
  const [reg] = await db.query('SELECT id, status, full_name, program FROM ppdb_registrations WHERE user_id = ?', [req.user.id]);
  if (!reg.length) return res.status(400).json({ message: 'Lengkapi biodata terlebih dahulu.' });
  const r = reg[0];
  if (r.status !== 'Menunggu Verifikasi' && r.status !== 'Perlu Perbaikan Dokumen') return res.status(400).json({ message: `Pendaftaran sudah dalam status "${r.status}".` });
  if (!r.full_name) return res.status(400).json({ message: 'Lengkapi biodata terlebih dahulu.' });
  const [docs] = await db.query('SELECT COUNT(*) AS c FROM ppdb_documents WHERE application_id = ?', [r.id]);
  if (!docs[0].c) return res.status(400).json({ message: 'Upload minimal 1 dokumen sebelum submit.' });
  await db.query('UPDATE ppdb_registrations SET status = ?, submitted_at = NOW() WHERE id = ?', ['Menunggu Verifikasi', r.id]);
  await db.query('INSERT INTO ppdb_activity_log (id, application_id, action, note) VALUES (?,?,?,?)', [randomUUID(), r.id, 'Submit Pendaftaran', 'Pendaftaran berhasil dikirim.']);
  res.json({ message: 'Pendaftaran berhasil dikirim.', status: 'Menunggu Verifikasi' });
});

/* --- Applicant Status --- */
app.get('/api/ppdb/status', applicantAuth, async (req, res) => {
  const [reg] = await db.query('SELECT id, registration_number, status, admin_note, submitted_at, created_at, full_name, program, documents_count FROM ppdb_registrations WHERE user_id = ?', [req.user.id]);
  if (!reg.length) return res.json({ registration: null });
  const r = reg[0];
  const [docs] = await db.query('SELECT id, type, filename, verified, note FROM ppdb_documents WHERE application_id = ?', [r.id]);
  const [activities] = await db.query('SELECT action, note, created_at FROM ppdb_activity_log WHERE application_id = ? ORDER BY created_at DESC LIMIT 50', [r.id]);
  res.json({ registration: r, documents: docs, activities });
});

/* ===== PPDB Admin Endpoints ===== */

/* --- Stats --- */
app.get('/api/ppdb/admin/stats', adminAuth, async (_req, res) => {
  const [total] = await db.query('SELECT COUNT(*) AS c FROM ppdb_registrations');
  const rows = await db.query(`SELECT status, COUNT(*) AS c FROM ppdb_registrations GROUP BY status`);
  const m = { 'Menunggu Verifikasi': 0, 'Sedang Diverifikasi': 0, 'Perlu Perbaikan Dokumen': 0, 'Lolos Seleksi': 0, 'Cadangan': 0, 'Tidak Lolos': 0, 'Sudah Daftar Ulang': 0 };
  for (const r of rows[0]) m[r.status] = r.c;
  res.json({ total: total[0].c, ...m });
});

/* --- List --- */
app.get('/api/ppdb/admin/list', adminAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;
  const statusFilter = req.query.status || null;
  const programFilter = req.query.program || null;
  let where = 'WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (full_name LIKE ? OR registration_number LIKE ? OR nisn LIKE ?)'; params.push(search, search, search); }
  if (statusFilter && ppdbStatuses.includes(statusFilter)) { where += ' AND status = ?'; params.push(statusFilter); }
  if (programFilter) { where += ' AND program = ?'; params.push(programFilter); }
  const [countResult] = await db.query(`SELECT COUNT(*) AS c FROM ppdb_registrations ${where}`, params);
  const [rows] = await db.query(`SELECT id, registration_number, full_name AS name, nisn, program, status, submitted_at AS date, documents_count, (SELECT COUNT(*) FROM ppdb_documents WHERE application_id = ppdb_registrations.id AND verified = 1) AS documents_verified, created_at FROM ppdb_registrations ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [programs] = await db.query('SELECT DISTINCT program FROM ppdb_registrations ORDER BY program');
  res.json({ data: rows, total: countResult[0].c, page, limit, totalPages: Math.ceil(countResult[0].c / limit), programs: programs.map(r => r.program) });
});

/* --- Detail --- */
app.get('/api/ppdb/admin/:id', adminAuth, async (req, res) => {
  const [reg] = await db.query('SELECT r.*, u.email AS user_email, u.phone AS user_phone, u.name AS user_name FROM ppdb_registrations r JOIN ppdb_users u ON u.id = r.user_id WHERE r.id = ?', [req.params.id]);
  if (!reg.length) return res.sendStatus(404);
  const [docs] = await db.query('SELECT * FROM ppdb_documents WHERE application_id = ? ORDER BY type', [req.params.id]);
  const [activities] = await db.query('SELECT al.*, u.username AS admin_name FROM ppdb_activity_log al LEFT JOIN users u ON u.id = al.admin_id WHERE al.application_id = ? ORDER BY al.created_at DESC LIMIT 50', [req.params.id]);
  res.json({ ...reg[0], documents: docs, activities });
});

/* --- Update Status --- */
app.put('/api/ppdb/admin/:id/status', adminAuth, async (req, res) => {
  const { status, note } = req.body;
  if (!ppdbStatuses.includes(status)) return res.status(400).json({ message: 'Status tidak valid.' });
  const [reg] = await db.query('SELECT id FROM ppdb_registrations WHERE id = ?', [req.params.id]);
  if (!reg.length) return res.sendStatus(404);
  await db.query('UPDATE ppdb_registrations SET status = ?, admin_note = ? WHERE id = ?', [status, note || null, req.params.id]);
  await db.query('INSERT INTO ppdb_activity_log (id, application_id, action, note, admin_id) VALUES (?,?,?,?,?)', [randomUUID(), req.params.id, `Status → ${status}`, note || null, req.user.id]);
  res.json({ message: 'Status berhasil diperbarui.' });
});

/* --- Verify Document --- */
app.put('/api/ppdb/admin/documents/:id/verify', adminAuth, async (req, res) => {
  const { verified, note } = req.body;
  const [doc] = await db.query('SELECT d.id, d.application_id, d.type FROM ppdb_documents d WHERE d.id = ?', [req.params.id]);
  if (!doc.length) return res.sendStatus(404);
  await db.query('UPDATE ppdb_documents SET verified = ?, note = ? WHERE id = ?', [verified ? 1 : 0, note || null, req.params.id]);
  const action = verified ? 'Dokumen Diverifikasi' : 'Dokumen Ditolak';
  await db.query('INSERT INTO ppdb_activity_log (id, application_id, action, note, admin_id) VALUES (?,?,?,?,?)', [randomUUID(), doc[0].application_id, `${action}: ${doc[0].type}`, note || null, req.user.id]);
  const [counts] = await db.query('SELECT COUNT(*) AS total, SUM(verified) AS verified FROM ppdb_documents WHERE application_id = ?', [doc[0].application_id]);
  await db.query('UPDATE ppdb_registrations SET documents_verified = ? WHERE id = ?', [counts[0].verified || 0, doc[0].application_id]);
  res.json({ message: verified ? 'Dokumen diverifikasi.' : 'Dokumen ditolak.' });
});

/* --- Activity --- */
app.get('/api/ppdb/admin/:id/activity', adminAuth, async (req, res) => {
  const [rows] = await db.query('SELECT al.*, u.username AS admin_name FROM ppdb_activity_log al LEFT JOIN users u ON u.id = al.admin_id WHERE al.application_id = ? ORDER BY al.created_at DESC LIMIT 100', [req.params.id]);
  res.json(rows);
});

/* --- Export CSV --- */
app.get('/api/ppdb/export/csv', adminAuth, async (_req, res) => {
  const [rows] = await db.query(`SELECT registration_number, full_name, nisn, program, status, submitted_at, documents_count, documents_verified FROM ppdb_registrations ORDER BY created_at DESC`);
  const header = 'No.Daftar,Nama,NISN,Jurusan,Status,Tgl Daftar,Dokumen,Dokumen Terverifikasi';
  const csv = rows.map(r => `"${r.registration_number}","${r.full_name || ''}","${r.nisn || ''}","${r.program || ''}","${r.status}","${r.submitted_at || ''}",${r.documents_count || 0},${r.documents_verified || 0}`).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=ppdb-export.csv');
  res.send(`\uFEFF${header}\n${csv}`);
});

/* ======================================================== */
/* ===== Old PPDB compat (legacy /api/ppdb) ===== */
/* ======================================================== */
app.get('/api/ppdb', adminAuth, async (_req, res) => { const [rows] = await db.query('SELECT id, name, program, status, submitted_at AS date FROM ppdb_applications ORDER BY submitted_at DESC'); res.json(rows); });
app.post('/api/ppdb/apply', async (req, res) => {
  const { name, nisn, email, phone, address, program, documentUrl } = req.body;
  if (![name, nisn, email, phone, address, program].every(v => v && v.trim())) return res.status(400).json({ message: 'Data wajib diisi.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Email tidak valid.' });
  const id = randomUUID(); const date = new Date().toISOString().slice(0, 10);
  await db.query('INSERT INTO ppdb_applications (id, name, nisn, email, phone, address, program, document_url, submitted_at) VALUES (?,?,?,?,?,?,?,?,?)', [id, name.trim(), nisn.trim(), email.trim(), phone.trim(), address.trim(), program.trim(), documentUrl?.trim() || null, date]);
  res.status(201).json({ id, message: 'Pendaftaran berhasil dikirim.' });
});
app.post('/api/ppdb', adminAuth, async (req, res) => {
  const { name, program, status = 'Menunggu Verifikasi', date } = req.body; const id = randomUUID();
  await db.query('INSERT INTO ppdb_applications (id, name, program, status, submitted_at) VALUES (?,?,?,?,?)', [id, name, program, status, date]); res.status(201).json({ id, name, program, status, date });
});
app.put('/api/ppdb/:id', adminAuth, async (req, res) => {
  const { name, program, status, date } = req.body;
  const [r] = await db.query('UPDATE ppdb_applications SET name=?, program=?, status=?, submitted_at=? WHERE id=?', [name, program, status, date, req.params.id]);
  if (!r.affectedRows) return res.sendStatus(404); res.json({ id: req.params.id, ...req.body });
});
app.delete('/api/ppdb/:id', adminAuth, async (req, res) => {
  const [r] = await db.query('DELETE FROM ppdb_applications WHERE id=?', [req.params.id]); res.status(r.affectedRows ? 204 : 404).end();
});

/* ======================================================== */
/* ===== Database Schema & Seed ===== */
/* ======================================================== */

async function initializeSchema() {
  await db.query(`CREATE TABLE IF NOT EXISTS site_stats (stat_key VARCHAR(50) PRIMARY KEY, stat_value VARCHAR(50) NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS users (id CHAR(36) PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role ENUM('admin') NOT NULL DEFAULT 'admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS contact_messages (id CHAR(36) PRIMARY KEY, name VARCHAR(150) NOT NULL, email VARCHAR(150) NOT NULL, subject VARCHAR(255) NOT NULL, message TEXT NOT NULL, is_read TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS ppdb_applications (id CHAR(36) PRIMARY KEY, name VARCHAR(150) NOT NULL, nisn VARCHAR(20) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(30) NOT NULL, address TEXT NOT NULL, program VARCHAR(150) NOT NULL, document_url VARCHAR(500) NULL, status ENUM('Menunggu Verifikasi','Terverifikasi','Ditolak') DEFAULT 'Menunggu Verifikasi', submitted_at DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  /* Content type tables */
  await db.query(`CREATE TABLE IF NOT EXISTS programs (id CHAR(36) PRIMARY KEY, name VARCHAR(150), slug VARCHAR(50), shortName VARCHAR(10), shortDescription TEXT, description TEXT, competencies JSON, careerProspects JSON, facilities JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS news (id CHAR(36) PRIMARY KEY, title VARCHAR(255), slug VARCHAR(100), date DATE, excerpt TEXT, content TEXT, thumbnail VARCHAR(500), category VARCHAR(50), author VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS facilities (id CHAR(36) PRIMARY KEY, name VARCHAR(150), category VARCHAR(50), description TEXT, photo VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS staff (id CHAR(36) PRIMARY KEY, name VARCHAR(150), position VARCHAR(100), department VARCHAR(100), photo VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS achievements (id CHAR(36) PRIMARY KEY, title VARCHAR(255), event VARCHAR(255), year YEAR, level VARCHAR(50), rank VARCHAR(50), students JSON, photo VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  /* New PPDB tables */
  await db.query(`CREATE TABLE IF NOT EXISTS ppdb_users (id CHAR(36) PRIMARY KEY, name VARCHAR(150) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, phone VARCHAR(30) NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS ppdb_registrations (id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, registration_number VARCHAR(20) NOT NULL UNIQUE, full_name VARCHAR(150), nisn VARCHAR(20), nik VARCHAR(20), gender ENUM('L','P'), place_of_birth VARCHAR(100), date_of_birth DATE, religion VARCHAR(30), address TEXT, phone VARCHAR(30), father_name VARCHAR(150), father_occupation VARCHAR(100), mother_name VARCHAR(150), mother_occupation VARCHAR(100), guardian_name VARCHAR(150), guardian_phone VARCHAR(30), parent_address TEXT, previous_school VARCHAR(200), previous_school_address TEXT, graduation_year YEAR, program VARCHAR(150), status ENUM('Menunggu Verifikasi','Sedang Diverifikasi','Perlu Perbaikan Dokumen','Lolos Seleksi','Cadangan','Tidak Lolos','Sudah Daftar Ulang') DEFAULT 'Menunggu Verifikasi', admin_note TEXT, documents_count INT DEFAULT 0, documents_verified INT DEFAULT 0, submitted_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX reg_user (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS ppdb_documents (id CHAR(36) PRIMARY KEY, application_id CHAR(36) NOT NULL, type ENUM('pas_foto','kartu_keluarga','akta_kelahiran','rapor','skl','dokumen_pendukung') NOT NULL, filename VARCHAR(255), file_data LONGTEXT, mime_type VARCHAR(100), file_size INT, verified TINYINT(1) DEFAULT 0, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX doc_app (application_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS ppdb_activity_log (id CHAR(36) PRIMARY KEY, application_id CHAR(36) NOT NULL, action VARCHAR(100) NOT NULL, note TEXT, admin_id CHAR(36), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX act_app (application_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;
  const [rows] = await db.query('SELECT id FROM users WHERE username=?', [username]);
  if (!rows.length) await db.query('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', [randomUUID(), username, await bcrypt.hash(password, 12)]);
}

const initialContent = {
  programs: [
    { id: 'tkj', name: 'Teknik Jaringan Komputer dan Telekomunikasi', slug: 'tkj', shortName: 'TJKT', shortDescription: 'Mempelajari perakitan komputer, instalasi jaringan, administrasi server, dan teknologi telekomunikasi.', description: 'Program keahlian Teknik Jaringan Komputer dan Telekomunikasi (TJKT) membekali siswa dengan keterampilan dalam perakitan komputer, instalasi jaringan lokal (LAN) maupun luas (WAN), administrasi server, serta teknologi telekomunikasi.', competencies: ['Perakitan dan Perbaikan Komputer', 'Instalasi Jaringan LAN/WAN', 'Administrasi Server', 'Keamanan Jaringan dan Cyber Security', 'Teknologi Telekomunikasi dan Fiber Optik'], careerProspects: ['Network Administrator', 'System Administrator', 'Teknisi Jaringan Telekomunikasi', 'IT Support', 'Teknisi Fiber Optik'], facilities: ['Laboratorium Komputer', 'Peralatan Jaringan (Router, Switch, MikroTik)', 'Server Khusus Praktik', 'Koneksi Internet Fiber Optik'] },
    { id: 'dkv', name: 'Desain Komunikasi Visual', slug: 'dkv', shortName: 'DKV', shortDescription: 'Mempelajari desain grafis, multimedia, videografi, fotografi, dan animasi digital.', description: 'Desain Komunikasi Visual (DKV) fokus pada pengembangan kreativitas di bidang desain grafis, multimedia, videografi, fotografi, dan animasi.', competencies: ['Desain Grafis (CorelDRAW, Adobe Illustrator, Photoshop)', 'Videografi dan Editing Video', 'Fotografi Digital', 'Animasi 2D dan 3D', 'Produksi Konten Digital Kreatif'], careerProspects: ['Desainer Grafis', 'Videografer/Editor Video', 'Fotografer', 'Animator', 'Social Media Specialist'], facilities: ['Laboratorium Multimedia', 'Kamera DSLR/Mirrorless', 'Studio Fotografi', 'Green Screen Studio'] },
    { id: 'otomotif', name: 'Teknik Otomotif', slug: 'otomotif', shortName: 'TO', shortDescription: 'Fokus pada perawatan dan perbaikan kendaraan bermotor roda dua dan roda empat.', description: 'Teknik Otomotif mendidik siswa untuk memiliki keahlian dalam perawatan dan perbaikan kendaraan roda empat dan roda dua, mencakup mesin bensin dan diesel, sistem kelistrikan, sistem injeksi, serta sasis.', competencies: ['Pemeliharaan Mesin Kendaraan', 'Perbaikan Sistem Kelistrikan Kendaraan', 'Perawatan Sistem Sasis dan Pemindah Tenaga', 'Overhaul Mesin', 'Teknologi Injeksi (EFI & PGM-FI)'], careerProspects: ['Mekanik Profesional', 'Service Advisor', 'Teknisi Bengkel Resmi', 'Wirausaha Bengkel', 'Kepala Mekanik'], facilities: ['Bengkel Otomotif Standar Industri', 'Engine Stand', 'Car Lift', 'Alat Uji Emisi', 'Scanner EFI'] },
    { id: 'titl', name: 'Teknik Ketenagalistrikan', slug: 'titl', shortName: 'TITL', shortDescription: 'Mempelajari instalasi listrik, sistem tenaga, motor listrik, dan otomasi industri.', description: 'Teknik Ketenagalistrikan (TITL) membekali siswa dengan kompetensi di bidang instalasi listrik, sistem tenaga listrik, motor listrik, dan kendali otomasi industri.', competencies: ['Instalasi Listrik Penerangan dan Tenaga', 'Sistem Distribusi Tenaga Listrik', 'Motor Listrik dan Kontrol', 'PLC (Programmable Logic Controller)', 'Elektronika Daya'], careerProspects: ['Teknisi Listrik', 'Instalatir Listrik', 'Teknisi Pemeliharaan Gedung', 'Operator Pembangkit Listrik', 'Wirausaha Jasa Instalasi Listrik'], facilities: ['Laboratorium Instalasi Listrik', 'Panel Listrik Praktik', 'Motor Listrik Berbagai Jenis', 'Trainer PLC', 'Peralatan K3'] },
    { id: 'mplb', name: 'Manajemen Perkantoran dan Layanan Bisnis', slug: 'mplb', shortName: 'MPLB', shortDescription: 'Mempelajari administrasi perkantoran, manajemen bisnis, dan layanan profesional.', description: 'Manajemen Perkantoran dan Layanan Bisnis (MPLB) membekali siswa dengan kompetensi dalam mengelola administrasi perkantoran, komunikasi bisnis, pengelolaan keuangan, dan aplikasi komputer perkantoran.', competencies: ['Administrasi dan Manajemen Perkantoran', 'Komunikasi Bisnis', 'Kearsipan Digital', 'Komputer Akuntansi', 'Public Relation dan Layanan Pelanggan'], careerProspects: ['Staf Administrasi Perkantoran', 'Customer Service Representative', 'Administrasi Keuangan', 'Resepsionis', 'Administrasi Personalia (HR)'], facilities: ['Laboratorium Administrasi Perkantoran', 'Bank Mini', 'Perangkat Multimedia', 'Software Administrasi Perkantoran'] },
    { id: 'busana', name: 'Busana', slug: 'busana', shortName: 'Busana', shortDescription: 'Mempelajari desain busana, pembuatan pola, menjahit, dan produksi fashion.', description: 'Program keahlian Busana membekali siswa dengan keterampilan di bidang desain busana, pembuatan pola, menjahit, dan produksi busana, serta kewirausahaan fashion.', competencies: ['Desain Busana (Fashion Design)', 'Pembuatan Pola (Pattern Making)', 'Menjahit Busana Pria/Wanita/Anak', 'Teknik Hiasan Busana', 'Manajemen Produksi Busana'], careerProspects: ['Desainer Busana', 'Penjahit Profesional', 'Pattern Maker', 'Pemilik Butik/Konveksi', 'Quality Control Produk Garmen'], facilities: ['Ruang Praktik Menjahit', 'Mesin Jahit Industri', 'Mesin Obras dan Neci', 'Manekin (Dress Form)', 'Laboratorium Desain Busana'] }
  ],
  facilities: [
    { id: 'fac-1', name: 'Laboratorium Komputer', category: 'Akademik', description: 'Laboratorium komputer dengan PC spesifikasi tinggi dan koneksi internet fiber optik untuk menunjang praktik TJKT dan DKV.', photo: '/images/facilities/lab-komputer.jpg' },
    { id: 'fac-2', name: 'Bengkel Otomotif', category: 'Akademik', description: 'Bengkel praktik standar industri dengan peralatan servis lengkap, engine stand, car lift, dan scanner EFI untuk siswa Teknik Otomotif.', photo: '/images/facilities/bengkel.jpg' },
    { id: 'fac-3', name: 'Perpustakaan Digital', category: 'Akademik', description: 'Ruang baca nyaman dengan koleksi buku dan akses referensi digital.', photo: '/images/facilities/perpustakaan.jpg' },
    { id: 'fac-4', name: 'Lapangan Olahraga Utama', category: 'Fasilitas Umum', description: 'Lapangan serbaguna untuk olahraga dan kegiatan sekolah.', photo: '/images/facilities/lapangan.jpg' },
    { id: 'fac-5', name: 'Masjid Ulil Albab', category: 'Keagamaan', description: 'Masjid sekolah untuk ibadah dan pembinaan rohani.', photo: '/images/facilities/masjid.jpg' },
    { id: 'fac-6', name: 'Aula Serbaguna', category: 'Fasilitas Umum', description: 'Aula untuk pertemuan, seminar, pentas seni, dan kegiatan sekolah.', photo: '/images/facilities/aula.jpg' },
    { id: 'fac-7', name: 'Laboratorium Perkantoran (Bank Mini)', category: 'Akademik', description: 'Ruang praktik jurusan MPLB dengan simulasi pelayanan perkantoran dan teller bank.', photo: '/images/facilities/lab-akuntansi.jpg' },
    { id: 'fac-8', name: 'Studio Multimedia', category: 'Pendukung', description: 'Studio produksi konten digital dilengkapi perangkat rekaman untuk praktik DKV dan ekstrakurikuler jurnalistik.', photo: '/images/facilities/multimedia.jpg' }
  ],
  news: [
    { id: 'news-1', title: 'Siswa SMKN 11 Kabupaten Tangerang Raih Medali Ajang Prestasi 2025', slug: 'ajang-prestasi-2025', date: '2025-10-15', excerpt: 'Febriyani, siswa SMKN 11 Kabupaten Tangerang, berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025.', content: '<p>Prestasi membanggakan kembali diraih oleh siswa SMKN 11 Kabupaten Tangerang. Febriyani berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025.</p><p>Keberhasilan ini merupakan buah dari persiapan matang dan bimbingan intensif dari para guru pembimbing.</p>', thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', category: 'Prestasi', author: 'Tim Humas' },
    { id: 'news-2', title: 'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027 Segera Dibuka', slug: 'info-ppdb-2026', date: '2026-06-15', excerpt: 'Informasi lengkap terkait jadwal, persyaratan, dan alur pendaftaran PPDB SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027.', content: '<p>Penerimaan Peserta Didik Baru (PPDB) SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027 akan segera dibuka secara online melalui portal resmi PPDB Provinsi Banten.</p><p>SMKN 11 membuka pendaftaran untuk 6 Program Keahlian: TJKT, DKV, Teknik Otomotif, TITL, MPLB, dan Busana dengan daya tampung total 400 siswa.</p>', thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80', category: 'Informasi', author: 'Panitia PPDB' },
    { id: 'news-3', title: 'Kunjungan Industri Jurusan Teknik Otomotif ke Pabrik Perakitan Mobil', slug: 'kunjungan-industri-otomotif', date: '2026-05-10', excerpt: 'Siswa kelas XI Teknik Otomotif mengikuti kegiatan Kunjungan Industri ke pabrik perakitan mobil ternama di Cikarang.', content: '<p>Sebanyak 65 siswa kelas XI jurusan Teknik Otomotif melaksanakan Kunjungan Industri ke pabrik perakitan mobil di Cikarang. Para siswa diajak mengamati langsung proses perakitan kendaraan dari pengelasan bodi hingga uji kualitas.</p>', thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80', category: 'Kegiatan', author: 'Tim Humas' },
    { id: 'news-4', title: 'Peresmian Laboratorium Desain Komunikasi Visual Baru', slug: 'peresmian-lab-dkv', date: '2026-04-22', excerpt: 'SMKN 11 resmi membuka laboratorium multimedia baru khusus untuk praktik siswa jurusan Desain Komunikasi Visual.', content: '<p>Laboratorium DKV baru dilengkapi dengan 35 unit komputer spesifikasi tinggi, studio mini, dan perangkat kamera untuk praktik desain grafis dan produksi konten digital.</p>', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80', category: 'Fasilitas', author: 'Tim Humas' },
    { id: 'news-5', title: 'Pelaksanaan Uji Kompetensi Keahlian (UKK) Tahun 2026 Berjalan Lancar', slug: 'pelaksanaan-ukk-2026', date: '2026-03-05', excerpt: 'Seluruh siswa kelas XII dari enam program keahlian sukses mengikuti Uji Kompetensi Keahlian sebagai syarat kelulusan.', content: '<p>UKK berlangsung selama satu pekan dengan melibatkan penguji internal dan penguji eksternal dari dunia usaha dan industri.</p>', thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80', category: 'Akademik', author: 'Kurikulum' },
    { id: 'news-6', title: 'Peringatan Hari Guru Nasional di SMKN 11 Kab. Tangerang', slug: 'hari-guru-nasional', date: '2025-11-25', excerpt: 'Rangkaian acara peringatan Hari Guru Nasional dirayakan oleh seluruh guru dan siswa.', content: '<p>Peringatan Hari Guru Nasional diawali dengan upacara bendera, pemotongan tumpeng, dan penampilan pentas seni dari ekstrakurikuler sebagai bentuk penghormatan kepada para guru.</p>', thumbnail: 'https://images.unsplash.com/photo-1579389083078-4e7018379f89?auto=format&fit=crop&w=900&q=80', category: 'Kegiatan', author: 'OSIS' },
  ],
  achievements: [
    { id: 'ach-1', title: 'Medali Perak Ajang Prestasi SMK Kabupaten Tangerang', event: 'Ajang Prestasi SMK Kabupaten Tangerang', year: 2025, level: 'Kabupaten', rank: 'Medali Perak', students: ['Febriyani'], photo: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80' },
    { id: 'ach-2', title: 'Medali Perak LKS Tingkat Kabupaten', event: 'Lomba Kompetensi Siswa (LKS) Kabupaten', year: 2024, level: 'Kabupaten', rank: 'Juara 2', students: ['Melati Febriyani'], photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80' },
    { id: 'ach-3', title: 'Peringkat 14 Ajang Prestasi SMK Tingkat Kabupaten', event: 'Ajang Prestasi SMK Kabupaten Tangerang', year: 2024, level: 'Kabupaten', rank: 'Medali Perak', students: ['Tim SMKN 11 Kab. Tangerang'], photo: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80' },
    { id: 'ach-4', title: 'Partisipasi LKS Kabel Jaringan Komputer Informasi', event: 'Lomba Kompetensi Siswa (LKS) Kabupaten', year: 2025, level: 'Kabupaten', rank: 'Peserta', students: ['Febriyani'], photo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80' },
  ],
  staff: [
    { id: 'staff-1', name: 'Emma Sukmayati', position: 'Kepala Sekolah', department: 'Manajemen', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-2', name: 'Sri Mulyani, S.Pd., M.Si.', position: 'Wakil Kepala Sekolah Bid. Kurikulum', department: 'Kurikulum', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-3', name: 'Budi Santoso, S.Kom.', position: 'Wakil Kepala Sekolah Bid. Kesiswaan', department: 'Kesiswaan', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-4', name: 'Haryanto, S.T.', position: 'Wakil Kepala Sekolah Bid. Sarana Prasarana', department: 'Sarana Prasarana', photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-5', name: 'Dra. Rini Wulandari', position: 'Wakil Kepala Sekolah Bid. Humas & Hubin', department: 'Humas', photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-6', name: 'Eko Prasetyo, S.Kom.', position: 'Kepala Program Keahlian TJKT', department: 'Teknik Jaringan Komputer dan Telekomunikasi', photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-7', name: 'Anita Rahmawati, S.Kom., M.Kom.', position: 'Kepala Program Keahlian DKV', department: 'Desain Komunikasi Visual', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-8', name: 'Asep Saepudin, S.Pd.T.', position: 'Kepala Program Keahlian Teknik Otomotif', department: 'Teknik Otomotif', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-9', name: 'Deni Setiawan, S.T.', position: 'Kepala Program Keahlian TITL', department: 'Teknik Ketenagalistrikan', photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-10', name: 'Siti Aminah, S.E.', position: 'Kepala Program Keahlian MPLB', department: 'Manajemen Perkantoran dan Layanan Bisnis', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-11', name: 'Nurhayati, S.Pd.', position: 'Kepala Program Keahlian Busana', department: 'Busana', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80' },
  ],
};

async function ensureInitialContent() {
  for (const [table, items] of Object.entries(initialContent)) {
    const newIds = items.map(i => i.id);
    for (const item of items) {
      const data = { ...item };
      const keys = Object.keys(data);
      const vals = keys.map(k => Array.isArray(data[k]) ? JSON.stringify(data[k]) : data[k]);
      const updates = keys.filter(k => k !== 'id').map(k => `${k}=?`).join(',');
      const updateVals = keys.filter(k => k !== 'id').map(k => Array.isArray(data[k]) ? JSON.stringify(data[k]) : data[k]);
      await db.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE ${updates}`, [...vals, ...updateVals]);
    }
    const [existing] = await db.query(`SELECT id FROM ${table} WHERE id NOT IN (${newIds.map(() => '?').join(',')})`, newIds);
    for (const row of existing) await db.query(`DELETE FROM ${table} WHERE id=?`, [row.id]);
  }
}

async function ensurePpdbColumns() {
  const [columns] = await db.query('SHOW COLUMNS FROM ppdb_applications');
  const existing = new Set(columns.map(c => c.Field));
  const additions = [
    ['nisn', 'VARCHAR(20) NOT NULL DEFAULT \'\' AFTER name'],
    ['email', 'VARCHAR(150) NOT NULL DEFAULT \'\' AFTER nisn'],
    ['phone', 'VARCHAR(30) NOT NULL DEFAULT \'\' AFTER email'],
    ['address', 'TEXT NOT NULL AFTER phone'],
    ['document_url', 'VARCHAR(500) NULL AFTER program'],
  ];
  for (const [name, def] of additions) if (!existing.has(name)) await db.query(`ALTER TABLE ppdb_applications ADD COLUMN ${name} ${def}`);
}

async function ensureStats() {
  for (const [k, v] of Object.entries({ students: '1.124+', teachers: '51+' })) {
    await db.query('INSERT IGNORE INTO site_stats (stat_key, stat_value) VALUES (?, ?)', [k, v]);
  }
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan server.' });
});

initializeSchema().then(ensurePpdbColumns).then(ensureAdmin).then(ensureInitialContent).then(ensureStats).then(() => app.listen(port, () => console.log(`API berjalan pada http://localhost:${port}`))).catch(e => { console.error(e); process.exit(1); });
