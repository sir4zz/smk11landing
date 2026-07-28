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
app.use(express.json({ limit: '1mb' }));

const allowedTypes = new Set(['news', 'programs', 'facilities', 'staff', 'achievements']);
const publicTypes = new Set(['programs', 'facilities', 'staff', 'news', 'achievements']);

app.get('/api/public/content/:type', async (req, res) => {
  if (!publicTypes.has(req.params.type)) return res.sendStatus(404);
  try {
    const [rows] = await db.query('SELECT id, data FROM content_records WHERE content_type = ? ORDER BY updated_at DESC', [req.params.type]);
    res.json(rows.map(row => ({ id: row.id, ...JSON.parse(row.data) })));
  } catch {
    res.status(503).json({ message: 'Konten publik belum tersedia.' });
  }
});

app.get('/api/public/content/:type/:id', async (req, res) => {
  if (!publicTypes.has(req.params.type)) return res.sendStatus(404);
  const [rows] = await db.query('SELECT id, data FROM content_records WHERE content_type = ? AND id = ?', [req.params.type, req.params.id]);
  if (!rows.length) return res.sendStatus(404);
  res.json({ id: rows[0].id, ...JSON.parse(rows[0].data) });
});
const auth = (req, res, next) => { const token = req.headers.authorization?.replace('Bearer ', ''); try { req.user = jwt.verify(token, jwtSecret); next(); } catch { res.status(401).json({ message: 'Sesi tidak valid atau telah berakhir.' }); } };

app.get('/api/health', async (_req, res) => { try { await db.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false, message: 'Database tidak terhubung.' }); } });
app.post('/api/auth/login', async (req, res) => { const { username, password } = req.body; const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]); const user = rows[0]; if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ message: 'Username atau kata sandi salah.' }); const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '8h' }); res.json({ token, user: { id: user.id, username: user.username, role: user.role } }); });

app.get('/api/content/:type', auth, async (req, res) => { if (!allowedTypes.has(req.params.type)) return res.sendStatus(404); const [rows] = await db.query('SELECT id, data FROM content_records WHERE content_type = ? ORDER BY updated_at DESC', [req.params.type]); res.json(rows.map(row => ({ id: row.id, ...JSON.parse(row.data) }))); });
app.post('/api/content/:type', auth, async (req, res) => { if (!allowedTypes.has(req.params.type)) return res.sendStatus(404); const id = req.body.id || randomUUID(); await db.query('INSERT INTO content_records (id, content_type, data) VALUES (?, ?, ?)', [id, req.params.type, JSON.stringify(req.body)]); res.status(201).json({ id, ...req.body }); });
app.put('/api/content/:type/:id', auth, async (req, res) => { if (!allowedTypes.has(req.params.type)) return res.sendStatus(404); const [result] = await db.query('UPDATE content_records SET data = ? WHERE id = ? AND content_type = ?', [JSON.stringify(req.body), req.params.id, req.params.type]); if (!result.affectedRows) return res.sendStatus(404); res.json({ id: req.params.id, ...req.body }); });
app.delete('/api/content/:type/:id', auth, async (req, res) => { const [result] = await db.query('DELETE FROM content_records WHERE id = ? AND content_type = ?', [req.params.id, req.params.type]); res.status(result.affectedRows ? 204 : 404).end(); });

app.get('/api/ppdb', auth, async (_req, res) => { const [rows] = await db.query('SELECT id, name, program, status, submitted_at AS date FROM ppdb_applications ORDER BY submitted_at DESC'); res.json(rows); });
app.post('/api/ppdb/apply', async (req, res) => { const { name, nisn, email, phone, address, program, documentUrl } = req.body; if (![name, nisn, email, phone, address, program].every(value => typeof value === 'string' && value.trim())) return res.status(400).json({ message: 'Semua data wajib diisi.' }); if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Format email tidak valid.' }); const id = randomUUID(); const date = new Date().toISOString().slice(0, 10); await db.query('INSERT INTO ppdb_applications (id, name, nisn, email, phone, address, program, document_url, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, name.trim(), nisn.trim(), email.trim(), phone.trim(), address.trim(), program.trim(), documentUrl?.trim() || null, date]); res.status(201).json({ id, message: 'Pendaftaran berhasil dikirim.' }); });
app.post('/api/ppdb', auth, async (req, res) => { const { name, program, status = 'Menunggu Verifikasi', date } = req.body; const id = randomUUID(); await db.query('INSERT INTO ppdb_applications (id, name, program, status, submitted_at) VALUES (?, ?, ?, ?, ?)', [id, name, program, status, date]); res.status(201).json({ id, name, program, status, date }); });
app.put('/api/ppdb/:id', auth, async (req, res) => { const { name, program, status, date } = req.body; const [result] = await db.query('UPDATE ppdb_applications SET name=?, program=?, status=?, submitted_at=? WHERE id=?', [name, program, status, date, req.params.id]); if (!result.affectedRows) return res.sendStatus(404); res.json({ id: req.params.id, ...req.body }); });
app.delete('/api/ppdb/:id', auth, async (req, res) => { const [result] = await db.query('DELETE FROM ppdb_applications WHERE id=?', [req.params.id]); res.status(result.affectedRows ? 204 : 404).end(); });

app.post('/api/contact', async (req, res) => { const { name, email, subject, message } = req.body; if (![name, email, subject, message].every(value => typeof value === 'string' && value.trim())) return res.status(400).json({ message: 'Semua field wajib diisi.' }); if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Format email tidak valid.' }); const id = randomUUID(); await db.query('INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)', [id, name.trim(), email.trim(), subject.trim(), message.trim()]); res.status(201).json({ id, message: 'Pesan berhasil dikirim.' }); });
app.get('/api/contact', auth, async (_req, res) => { const [rows] = await db.query('SELECT id, name, email, subject, message, is_read AS isRead, created_at AS date FROM contact_messages ORDER BY created_at DESC'); res.json(rows); });
app.put('/api/contact/:id/read', auth, async (req, res) => { const [result] = await db.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]); if (!result.affectedRows) return res.sendStatus(404); res.json({ ok: true }); });
app.delete('/api/contact/:id', auth, async (req, res) => { const [result] = await db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]); res.status(result.affectedRows ? 204 : 404).end(); });

async function initializeSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin') NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS content_records (
      id CHAR(36) PRIMARY KEY,
      content_type ENUM('news','programs','facilities','staff','achievements') NOT NULL,
      data JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX content_type_index (content_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ppdb_applications (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      nisn VARCHAR(20) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      address TEXT NOT NULL,
      program VARCHAR(150) NOT NULL,
      document_url VARCHAR(500) NULL,
      status ENUM('Menunggu Verifikasi','Terverifikasi','Ditolak') NOT NULL DEFAULT 'Menunggu Verifikasi',
      submitted_at DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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
    { id: 'tkj', name: 'Teknik Komputer dan Jaringan', slug: 'tkj', shortName: 'TKJ', shortDescription: 'Mempelajari perakitan komputer, instalasi jaringan, dan administrasi server.', description: 'Program keahlian Teknik Komputer dan Jaringan membekali siswa dengan keterampilan infrastruktur teknologi informasi.', competencies: ['Perakitan dan Perbaikan Komputer', 'Instalasi Jaringan LAN/WAN', 'Administrasi Server', 'Keamanan Jaringan'], careerProspects: ['Network Administrator', 'System Administrator', 'IT Support'], facilities: ['Laboratorium Komputer', 'Peralatan Jaringan', 'Server Praktik'] },
    { id: 'rpl', name: 'Rekayasa Perangkat Lunak', slug: 'rpl', shortName: 'RPL', shortDescription: 'Mempelajari pengembangan aplikasi web, desktop, mobile, dan basis data.', description: 'Program Rekayasa Perangkat Lunak fokus pada pengembangan perangkat lunak dari desain hingga pemeliharaan sistem.', competencies: ['Pemrograman Web', 'Pemrograman Berorientasi Objek', 'Pengembangan Aplikasi Mobile', 'Manajemen Basis Data'], careerProspects: ['Web Developer', 'Mobile App Developer', 'UI/UX Designer'], facilities: ['Laboratorium RPL', 'Komputer Spesifikasi Tinggi', 'SDK Terkini'] },
    { id: 'tkr', name: 'Teknik Kendaraan Ringan', slug: 'tkr', shortName: 'TKR', shortDescription: 'Fokus pada perawatan dan perbaikan kendaraan roda empat.', description: 'Mendidik siswa memiliki keahlian dalam perawatan dan perbaikan mesin otomotif roda empat.', competencies: ['Pemeliharaan Mesin', 'Sistem Kelistrikan', 'Sistem Sasis', 'Overhaul Mesin'], careerProspects: ['Mekanik Mobil', 'Service Advisor', 'Teknisi Dealer'], facilities: ['Bengkel Otomotif', 'Engine Stand', 'Car Lift'] },
    { id: 'tbsm', name: 'Teknik Bisnis Sepeda Motor', slug: 'tbsm', shortName: 'TBSM', shortDescription: 'Mempelajari teknik perawatan, perbaikan sepeda motor, dan manajemen bengkel.', description: 'Menyiapkan siswa menjadi ahli perawatan, perbaikan, dan modifikasi sepeda motor.', competencies: ['Pemeliharaan Mesin Motor', 'Kelistrikan Motor', 'Teknologi Injeksi', 'Manajemen Bengkel'], careerProspects: ['Mekanik Sepeda Motor', 'Kepala Mekanik', 'Wirausaha Bengkel'], facilities: ['Bengkel Motor', 'Peralatan Servis', 'Scanner Injeksi'] },
    { id: 'akl', name: 'Akuntansi dan Keuangan Lembaga', slug: 'akl', shortName: 'AKL', shortDescription: 'Mempelajari penyusunan laporan keuangan, perpajakan, dan aplikasi komputer akuntansi.', description: 'Membekali siswa dengan kompetensi pengelolaan keuangan, laporan keuangan, perpajakan, dan aplikasi akuntansi.', competencies: ['Akuntansi Jasa dan Dagang', 'Administrasi Pajak', 'Komputer Akuntansi', 'Pengelolaan Kas'], careerProspects: ['Staf Akunting', 'Teller Bank', 'Staf Administrasi Keuangan'], facilities: ['Laboratorium Akuntansi', 'Bank Mini', 'Software Akuntansi'] }
  ],
  facilities: [
    { id: 'fac-1', name: 'Laboratorium Komputer', category: 'Akademik', description: 'Laboratorium komputer dengan PC spesifikasi tinggi dan koneksi internet untuk menunjang praktik TKJ dan RPL.', photo: '/images/facilities/lab-komputer.jpg' },
    { id: 'fac-2', name: 'Bengkel Otomotif', category: 'Akademik', description: 'Bengkel praktik dengan peralatan servis lengkap untuk siswa TKR dan TBSM.', photo: '/images/facilities/bengkel.jpg' },
    { id: 'fac-3', name: 'Perpustakaan Digital', category: 'Akademik', description: 'Ruang baca nyaman dengan koleksi buku dan akses referensi digital.', photo: '/images/facilities/perpustakaan.jpg' },
    { id: 'fac-4', name: 'Lapangan Olahraga Utama', category: 'Fasilitas Umum', description: 'Lapangan serbaguna untuk olahraga dan kegiatan sekolah.', photo: '/images/facilities/lapangan.jpg' },
    { id: 'fac-5', name: 'Masjid Ulil Albab', category: 'Keagamaan', description: 'Masjid sekolah untuk ibadah dan pembinaan rohani.', photo: '/images/facilities/masjid.jpg' },
    { id: 'fac-6', name: 'Aula Serbaguna', category: 'Fasilitas Umum', description: 'Aula untuk pertemuan, seminar, pentas seni, dan kegiatan sekolah.', photo: '/images/facilities/aula.jpg' },
    { id: 'fac-7', name: 'Laboratorium Akuntansi (Bank Mini)', category: 'Akademik', description: 'Ruang praktik jurusan AKL dengan simulasi pelayanan teller bank.', photo: '/images/facilities/lab-akuntansi.jpg' },
    { id: 'fac-8', name: 'Ruang Multimedia & Podcast', category: 'Pendukung', description: 'Ruang produksi konten edukasi dan siaran sekolah.', photo: '/images/facilities/multimedia.jpg' }
  ],
  news: [
    { id: 'news-1', title: 'Siswa SMKN 11 Kabupaten Tangerang Juara 1 LKS Tingkat Provinsi', slug: 'juara-1-lks-provinsi', date: '2026-07-20', excerpt: 'Prestasi membanggakan kembali diraih oleh siswa jurusan TKJ pada ajang Lomba Kompetensi Siswa (LKS) bidang IT Network Systems Administration tingkat Provinsi Banten.', content: '<p>Kabar gembira datang dari ajang Lomba Kompetensi Siswa (LKS) tingkat Provinsi Banten tahun 2026. Siswa perwakilan SMKN 11 Kabupaten Tangerang berhasil meraih Juara 1 pada bidang IT Network Systems Administration.</p><p>Dengan kemenangan ini, siswa berhak mewakili Provinsi Banten untuk berlaga di LKS tingkat Nasional yang akan diselenggarakan bulan depan.</p>', thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', category: 'Prestasi', author: 'Tim Humas' },
    { id: 'news-2', title: 'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027 Segera Dibuka', slug: 'info-ppdb-2026', date: '2026-06-15', excerpt: 'Informasi lengkap terkait jadwal, persyaratan, dan alur pendaftaran PPDB SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027.', content: '<p>Penerimaan Peserta Didik Baru (PPDB) SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027 akan segera dibuka secara online melalui portal resmi PPDB Provinsi Banten.</p><p>SMKN 11 membuka pendaftaran untuk 5 Program Keahlian: TKJ, RPL, TKR, TBSM, dan AKL dengan daya tampung total 400 siswa.</p>', thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80', category: 'Informasi', author: 'Panitia PPDB' },
    { id: 'news-3', title: 'Kunjungan Industri Jurusan TKR ke Pabrik Perakitan Mobil', slug: 'kunjungan-industri-tkr', date: '2026-05-10', excerpt: 'Siswa kelas XI Teknik Kendaraan Ringan mengikuti kegiatan Kunjungan Industri ke pabrik perakitan mobil ternama di Cikarang.', content: '<p>Sebanyak 72 siswa kelas XI jurusan TKR melaksanakan Kunjungan Industri ke pabrik perakitan mobil di Cikarang. Para siswa diajak mengamati langsung proses perakitan kendaraan dari pengelasan bodi hingga uji kualitas.</p>', thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80', category: 'Kegiatan', author: 'Tim Humas' },
    { id: 'news-4', title: 'Peresmian Laboratorium Rekayasa Perangkat Lunak Baru', slug: 'peresmian-lab-rpl', date: '2026-04-22', excerpt: 'SMKN 11 resmi membuka lab komputer baru khusus untuk praktik siswa jurusan Rekayasa Perangkat Lunak.', content: '<p>Laboratorium RPL baru dilengkapi dengan 40 unit komputer spesifikasi tinggi dan koneksi internet serat optik dedicated untuk mendukung pembelajaran pengembangan perangkat lunak.</p>', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80', category: 'Fasilitas', author: 'Tim Humas' },
    { id: 'news-5', title: 'Pelaksanaan Uji Kompetensi Keahlian (UKK) Tahun 2026 Berjalan Lancar', slug: 'pelaksanaan-ukk-2026', date: '2026-03-05', excerpt: 'Seluruh siswa kelas XII dari lima program keahlian sukses mengikuti Uji Kompetensi Keahlian sebagai syarat kelulusan.', content: '<p>UKK berlangsung selama satu pekan dengan melibatkan penguji internal dan penguji eksternal dari dunia usaha dan industri.</p>', thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80', category: 'Akademik', author: 'Kurikulum' },
    { id: 'news-6', title: 'Peringatan Hari Guru Nasional di SMKN 11 Kab. Tangerang', slug: 'hari-guru-nasional', date: '2025-11-25', excerpt: 'Rangkaian acara peringatan Hari Guru Nasional dirayakan oleh seluruh guru dan siswa.', content: '<p>Peringatan Hari Guru Nasional diawali dengan upacara bendera, pemotongan tumpeng, dan penampilan pentas seni dari ekstrakurikuler sebagai bentuk penghormatan kepada para guru.</p>', thumbnail: 'https://images.unsplash.com/photo-1579389083078-4e7018379f89?auto=format&fit=crop&w=900&q=80', category: 'Kegiatan', author: 'OSIS' },
  ],
  achievements: [
    { id: 'ach-1', title: 'Juara 1 IT Network Systems Administration', event: 'Lomba Kompetensi Siswa (LKS)', year: 2026, level: 'Provinsi', rank: 'Juara 1', students: ['Budi Santoso (XII TKJ 1)'], photo: '/images/achievements/lks-tkj.jpg' },
    { id: 'ach-2', title: 'Juara 2 Web Technologies', event: 'Lomba Kompetensi Siswa (LKS)', year: 2025, level: 'Kabupaten', rank: 'Juara 2', students: ['Rizky Aditya (XI RPL 2)'], photo: '/images/achievements/lks-rpl.jpg' },
    { id: 'ach-3', title: 'Juara 1 Futsal Antar Pelajar', event: 'Bupati Cup Kabupaten Tangerang', year: 2025, level: 'Kabupaten', rank: 'Juara 1', students: ['Tim Futsal SMKN 11'], photo: '/images/achievements/futsal.jpg' },
    { id: 'ach-4', title: 'Juara 3 Line Follower Robot', event: 'National Robotics Competition', year: 2024, level: 'Nasional', rank: 'Juara 3', students: ['Dimas (XII TKJ 2)', 'Gilang (XII TKJ 2)'], photo: '/images/achievements/robotik.jpg' },
    { id: 'ach-5', title: 'Harapan 1 Olimpiade Akuntansi', event: 'Olimpiade Akuntansi Nasional Vokasi', year: 2024, level: 'Nasional', rank: 'Harapan 1', students: ['Nisa Salsabila (XII AKL 1)'], photo: '/images/achievements/akuntansi.jpg' },
    { id: 'ach-6', title: 'Juara 2 Paskibra Formasi Terbaik', event: 'LKBB', year: 2023, level: 'Provinsi', rank: 'Juara 2', students: ['Paskibra Satria 11'], photo: '/images/achievements/paskibra.jpg' },
    { id: 'ach-7', title: 'Juara 1 Lomba Cipta Puisi Kebangsaan', event: 'Bulan Bahasa & Sastra', year: 2023, level: 'Kabupaten', rank: 'Juara 1', students: ['Dewi Lestari (X AKL 2)'], photo: '/images/achievements/puisi.jpg' },
    { id: 'ach-8', title: 'Best Mechanic Contest', event: 'AHASS Vocational Skill Contest', year: 2023, level: 'Regional', rank: 'Peringkat 2', students: ['Fajar Hidayat (XII TBSM 1)'], photo: '/images/achievements/tbsm-contest.jpg' },
  ],
  staff: [
    { id: 'staff-1', name: 'Drs. H. Ahmad Fauzi, M.Pd.', position: 'Kepala Sekolah', department: 'Manajemen', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-2', name: 'Sri Mulyani, S.Pd., M.Si.', position: 'Wakil Kepala Sekolah Bid. Kurikulum', department: 'Kurikulum', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-3', name: 'Budi Santoso, S.Kom.', position: 'Wakil Kepala Sekolah Bid. Kesiswaan', department: 'Kesiswaan', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-4', name: 'Haryanto, S.T.', position: 'Wakil Kepala Sekolah Bid. Sarana Prasarana', department: 'Sarana Prasarana', photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-5', name: 'Dra. Rini Wulandari', position: 'Wakil Kepala Sekolah Bid. Humas & Hubin', department: 'Humas', photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-6', name: 'Eko Prasetyo, S.Kom.', position: 'Kepala Program Keahlian TKJ', department: 'Teknik Komputer dan Jaringan', photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-7', name: 'Anita Rahmawati, S.Kom., M.Kom.', position: 'Kepala Program Keahlian RPL', department: 'Rekayasa Perangkat Lunak', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-8', name: 'Asep Saepudin, S.Pd.T.', position: 'Kepala Program Keahlian TKR', department: 'Teknik Kendaraan Ringan', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-9', name: 'Deni Setiawan, S.T.', position: 'Kepala Program Keahlian TBSM', department: 'Teknik Bisnis Sepeda Motor', photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80' },
    { id: 'staff-10', name: 'Siti Aminah, S.E., M.Ak.', position: 'Kepala Program Keahlian AKL', department: 'Akuntansi dan Keuangan Lembaga', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80' },
  ],
};

async function ensureInitialContent() {
  for (const [type, items] of Object.entries(initialContent)) {
    for (const item of items) {
      const { id, ...data } = item;
      const [rows] = await db.query('SELECT id FROM content_records WHERE content_type = ? AND JSON_EXTRACT(data, \'$.id\') = ?', [type, id]);
      if (rows.length) continue;
      await db.query('INSERT INTO content_records (id, content_type, data) VALUES (?, ?, ?)', [id, type, JSON.stringify({ ...data, id })]);
    }
  }
}
async function ensurePpdbColumns() {
  const [columns] = await db.query('SHOW COLUMNS FROM ppdb_applications');
  const existing = new Set(columns.map(column => column.Field));
  const additions = [
    ['nisn', 'VARCHAR(20) NOT NULL DEFAULT \'\' AFTER name'],
    ['email', 'VARCHAR(150) NOT NULL DEFAULT \'\' AFTER nisn'],
    ['phone', 'VARCHAR(30) NOT NULL DEFAULT \'\' AFTER email'],
    ['address', 'TEXT NOT NULL AFTER phone'],
    ['document_url', 'VARCHAR(500) NULL AFTER program'],
  ];
  for (const [name, definition] of additions) if (!existing.has(name)) await db.query(`ALTER TABLE ppdb_applications ADD COLUMN ${name} ${definition}`);
}
initializeSchema().then(ensurePpdbColumns).then(ensureAdmin).then(ensureInitialContent).then(() => app.listen(port, () => console.log(`API berjalan pada http://localhost:${port}`))).catch(error => { console.error(error); process.exit(1); });
