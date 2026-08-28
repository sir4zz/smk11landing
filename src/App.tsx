import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { AdminRouteGuard, StudentRouteGuard } from './components/auth/RouteGuards'
import { SkeletonPage } from './components/ui/Skeleton'

const Home = lazy(() => import('./pages/Home'))
const History = lazy(() => import('./pages/profile/History'))
const VisionMission = lazy(() => import('./pages/profile/VisionMission'))
const OrganizationStructure = lazy(() => import('./pages/profile/OrganizationStructure'))
const StudyPrograms = lazy(() => import('./pages/academics/StudyPrograms'))
const StudyProgramDetail = lazy(() => import('./pages/academics/StudyProgramDetail'))
const Facilities = lazy(() => import('./pages/academics/Facilities'))
const FacilityDetail = lazy(() => import('./pages/academics/FacilityDetail'))
const Admissions = lazy(() => import('./pages/Admissions'))
const Contact = lazy(() => import('./pages/Contact'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminLogin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminLogin })))
const Achievements = lazy(() => import('./pages/student/Achievements'))
const Extracurriculars = lazy(() => import('./pages/student/Extracurriculars'))
const Gallery = lazy(() => import('./pages/student/Gallery'))
const GalleryList = lazy(() => import('./pages/gallery/GalleryList'))
const GalleryDetail = lazy(() => import('./pages/gallery/GalleryDetail'))
const Management = lazy(() => import('./pages/management/Management'))
const KepalaSekolah = lazy(() => import('./pages/management/KepalaSekolah'))
const WakilKepalaSekolah = lazy(() => import('./pages/management/WakilKepalaSekolah'))
const KegiatanGuru = lazy(() => import('./pages/management/KegiatanGuru'))
const KegiatanGuruDetail = lazy(() => import('./pages/management/KegiatanGuruDetail'))
const TenagaKependidikan = lazy(() => import('./pages/management/TenagaKependidikan'))
const NewsList = lazy(() => import('./pages/information/NewsList'))
const NewsDetail = lazy(() => import('./pages/information/NewsDetail'))
const FAQ = lazy(() => import('./pages/information/FAQ'))
const Osis = lazy(() => import('./pages/osis/Osis'))
const OsisStruktur = lazy(() => import('./pages/osis/OsisStruktur'))
const OsisKegiatan = lazy(() => import('./pages/osis/OsisKegiatan'))
const OsisExtracurriculars = lazy(() => import('./pages/osis/Extracurriculars'))
const OsisExtracurricularDetail = lazy(() => import('./pages/osis/ExtracurricularDetail'))
const Mading = lazy(() => import('./pages/mading/Mading'))
const MadingDetail = lazy(() => import('./pages/mading/MadingDetail'))
const StudentLogin = lazy(() => import('./pages/mading/StudentLogin'))
const StudentArea = lazy(() => import('./pages/mading/StudentArea'))
const BkkList = lazy(() => import('./pages/bkk/BkkList'))
const BkkDetail = lazy(() => import('./pages/bkk/BkkDetail'))
const BkkHome = lazy(() => import('./pages/bkk/BkkHome'))
const BkkContact = lazy(() => import('./pages/bkk/BkkContact'))
const BkkKelulusan = lazy(() => import('./pages/bkk/BkkKelulusan'))
const MustChangePassword = lazy(() => import('./pages/admin/MustChangePassword'))
const ProfileDirectory = lazy(() => import('./pages/profiles/ProfileDirectory'))
const ProfilePage = lazy(() => import('./pages/profiles/ProfilePage'))
const SopList = lazy(() => import('./pages/sop/SopList'))
const SopViewer = lazy(() => import('./pages/sop/SopViewer'))

function RouteFallback() {
  return <SkeletonPage />
}

function suspend(node: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>
}

function App() {
  return (
    <Routes>
        <Route path="admin/login" element={suspend(<AdminLogin />)} />
        <Route element={<AdminRouteGuard />}>
          <Route path="admin/*" element={suspend(<Admin />)} />
          <Route path="admin/ubah-password" element={suspend(<MustChangePassword />)} />
        </Route>

        <Route path="/" element={<Layout />}>
          <Route index element={suspend(<Home />)} />

          {/* Profile */}
          <Route path="profil/sejarah" element={suspend(<History />)} />
          <Route path="profil/visi-misi" element={suspend(<VisionMission />)} />
          <Route path="profil/struktur-organisasi" element={suspend(<OrganizationStructure />)} />
          <Route path="sop" element={suspend(<SopList />)} />
          <Route path="sop/:slug/view" element={suspend(<SopViewer />)} />
          <Route path="profil/direktori" element={suspend(<ProfileDirectory />)} />
          <Route path="profil/:role/:id" element={suspend(<ProfilePage />)} />

          {/* Academics */}
          <Route path="akademik/program-keahlian" element={suspend(<StudyPrograms />)} />
          <Route path="akademik/program/:slug" element={suspend(<StudyProgramDetail />)} />
          <Route path="akademik/fasilitas" element={suspend(<Facilities />)} />
          <Route path="akademik/fasilitas/:slug" element={suspend(<FacilityDetail />)} />

          {/* Student Affairs */}
          <Route path="kesiswaan/prestasi" element={suspend(<Achievements />)} />
          <Route path="kesiswaan/ekstrakurikuler" element={suspend(<Extracurriculars />)} />
          <Route path="kesiswaan/galeri" element={suspend(<Gallery />)} />

          {/* Gallery */}
          <Route path="galeri" element={suspend(<GalleryList />)} />
          <Route path="galeri/:slug" element={suspend(<GalleryDetail />)} />

          {/* Management */}
          <Route path="manajemen" element={suspend(<Management />)} />
          <Route path="manajemen/kepala-sekolah" element={suspend(<KepalaSekolah />)} />
          <Route path="manajemen/wakil-kepala-sekolah" element={suspend(<WakilKepalaSekolah />)} />
          <Route path="manajemen/kegiatan-guru" element={suspend(<KegiatanGuru />)} />
          <Route path="manajemen/kegiatan-guru/:id" element={suspend(<KegiatanGuruDetail />)} />
          <Route path="manajemen/tenaga-kependidikan" element={suspend(<TenagaKependidikan />)} />

          {/* Information */}
          <Route path="informasi/berita" element={suspend(<NewsList />)} />
          <Route path="informasi/berita/:slug" element={suspend(<NewsDetail />)} />
          <Route path="informasi/faq" element={suspend(<FAQ />)} />

          {/* OSIS */}
          <Route path="osis" element={suspend(<Osis />)} />
          <Route path="osis/struktur" element={suspend(<OsisStruktur />)} />
          <Route path="osis/kegiatan" element={suspend(<OsisKegiatan />)} />
          <Route path="osis/ekstrakurikuler" element={suspend(<OsisExtracurriculars />)} />
          <Route path="osis/ekstrakurikuler/:slug" element={suspend(<OsisExtracurricularDetail />)} />
          <Route path="mading" element={suspend(<Mading />)} />
          <Route path="mading/login" element={suspend(<StudentLogin />)} />
          <Route element={<StudentRouteGuard />}>
            <Route path="mading/area" element={suspend(<StudentArea />)} />
            <Route path="siswa/data-diri" element={<Navigate to="/mading/area?tab=profile" replace />} />
          </Route>
          <Route path="mading/:id" element={suspend(<MadingDetail />)} />

          {/* BKK (Bursa Kerja Khusus) */}
          <Route path="bkk" element={suspend(<BkkHome />)} />
          <Route path="bkk/lowongan" element={suspend(<BkkList />)} />
          <Route path="bkk/lowongan/:slug" element={suspend(<BkkDetail />)} />
          <Route path="bkk/kelulusan" element={suspend(<BkkKelulusan />)} />
          <Route path="bkk/kontak" element={suspend(<BkkContact />)} />
          <Route path="bkk/:slug" element={<BkkDetailRedirect />} />

          {/* Public information portal */}
          <Route path="spmb" element={suspend(<Admissions />)} />
          <Route path="kontak" element={suspend(<Contact />)} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
    </Routes>
  )
}

function BkkDetailRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/bkk/lowongan/${slug}`} replace />
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
