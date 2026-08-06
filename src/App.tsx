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
import GalleryList from './pages/gallery/GalleryList'
import GalleryDetail from './pages/gallery/GalleryDetail'
import Management from './pages/management/Management'
import KepalaSekolah from './pages/management/KepalaSekolah'
import WakilKepalaSekolah from './pages/management/WakilKepalaSekolah'
import KegiatanGuru from './pages/management/KegiatanGuru'
import TenagaKependidikan from './pages/management/TenagaKependidikan'
import StrukturManajemen from './pages/management/StrukturManajemen'
import NewsList from './pages/information/NewsList'
import NewsDetail from './pages/information/NewsDetail'
import FAQ from './pages/information/FAQ'
import Osis from './pages/osis/Osis'
import OsisExtracurriculars from './pages/osis/Extracurriculars'
import OsisExtracurricularDetail from './pages/osis/ExtracurricularDetail'
import Kesemaptaan from './pages/osis/Kesemaptaan'
import Mading from './pages/mading/Mading'
import StudentLogin from './pages/mading/StudentLogin'
import StudentArea from './pages/mading/StudentArea'
import { AdminRouteGuard, StudentRouteGuard } from './components/auth/RouteGuards'

function App() {
  return (
    <Routes>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route element={<AdminRouteGuard />}>
          <Route path="admin" element={<Admin />} />
        </Route>

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

          {/* Gallery */}
          <Route path="galeri" element={<GalleryList />} />
          <Route path="galeri/:slug" element={<GalleryDetail />} />

          {/* Management */}
          <Route path="manajemen" element={<Management />} />
          <Route path="manajemen/kepala-sekolah" element={<KepalaSekolah />} />
          <Route path="manajemen/wakil-kepala-sekolah" element={<WakilKepalaSekolah />} />
          <Route path="manajemen/kegiatan-guru" element={<KegiatanGuru />} />
          <Route path="manajemen/tenaga-kependidikan" element={<TenagaKependidikan />} />
          <Route path="manajemen/struktur-manajemen" element={<StrukturManajemen />} />

          {/* Information */}
          <Route path="informasi/berita" element={<NewsList />} />
          <Route path="informasi/berita/:slug" element={<NewsDetail />} />
          <Route path="informasi/faq" element={<FAQ />} />

          {/* OSIS */}
          <Route path="osis" element={<Osis />} />
          <Route path="osis/ekstrakurikuler" element={<OsisExtracurriculars />} />
          <Route path="osis/ekstrakurikuler/:slug" element={<OsisExtracurricularDetail />} />
          <Route path="osis/kesemaptaan" element={<Kesemaptaan />} />
          <Route path="mading" element={<Mading />} />
          <Route path="mading/login" element={<StudentLogin />} />
          <Route element={<StudentRouteGuard />}>
            <Route path="mading/area" element={<StudentArea />} />
          </Route>

          {/* Public information portal */}
          <Route path="spmb" element={<Admissions />} />
          <Route path="kontak" element={<Contact />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
    </Routes>
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
