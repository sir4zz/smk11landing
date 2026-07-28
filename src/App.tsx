import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import History from './pages/profile/History'
import VisionMission from './pages/profile/VisionMission'
import OrganizationStructure from './pages/profile/OrganizationStructure'
import StudyPrograms from './pages/academics/StudyPrograms'
import StudyProgramDetail from './pages/academics/StudyProgramDetail'
import Facilities from './pages/academics/Facilities'
import Admissions from './pages/Admissions'
import Contact from './pages/Contact'
import Admin, { AdminLogin } from './pages/Admin'
import Achievements from './pages/student/Achievements'
import Extracurriculars from './pages/student/Extracurriculars'
import Gallery from './pages/student/Gallery'
import NewsList from './pages/information/NewsList'
import NewsDetail from './pages/information/NewsDetail'
import FAQ from './pages/information/FAQ'
import { PpdbAuthProvider, ProtectedRoute } from './pages/ppdb/PPDBAuth'
import Register from './pages/ppdb/Register'
import Login from './pages/ppdb/Login'
import Dashboard from './pages/ppdb/Dashboard'

function App() {
  return (
    <PpdbAuthProvider>
      <Routes>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<Admin />} />

        {/* PPDB standalone (no layout) */}
        <Route path="ppdb/daftar" element={<Register />} />
        <Route path="ppdb/masuk" element={<Login />} />
        <Route path="ppdb/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          {/* Profile */}
          <Route path="profil/sejarah" element={<History />} />
          <Route path="profil/visi-misi" element={<VisionMission />} />
          <Route path="profil/struktur-organisasi" element={<OrganizationStructure />} />

          {/* Academics */}
          <Route path="akademik/program-keahlian" element={<StudyPrograms />} />
          <Route path="akademik/program/:slug" element={<StudyProgramDetail />} />
          <Route path="akademik/fasilitas" element={<Facilities />} />

          {/* Student Affairs */}
          <Route path="kesiswaan/prestasi" element={<Achievements />} />
          <Route path="kesiswaan/ekstrakurikuler" element={<Extracurriculars />} />
          <Route path="kesiswaan/galeri" element={<Gallery />} />

          {/* Information */}
          <Route path="informasi/berita" element={<NewsList />} />
          <Route path="informasi/berita/:slug" element={<NewsDetail />} />
          <Route path="informasi/faq" element={<FAQ />} />

          {/* Public Services */}
          <Route path="ppdb" element={<Admissions />} />
          <Route path="kontak" element={<Contact />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PpdbAuthProvider>
  )
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-[#1B2A4A] mb-4">404</h1>
      <p className="text-xl text-[#1B2A4A]/70 mb-8">
        Halaman yang Anda cari tidak ditemukan.
      </p>
      <a
        href="/"
        className="inline-flex items-center px-6 py-3 bg-[#C8A951] text-[#1B2A4A] font-semibold rounded-lg hover:bg-[#B69740] transition-colors"
      >
        Kembali ke Beranda
      </a>
    </div>
  )
}

export default App
