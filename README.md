SMKN 11 Kabupaten Tangerang — Official Website
Build the official website for SMKN 11 Kabupaten Tangerang as a multi-page React SPA with a clean, professional, and formal design using a strict 3-color palette (Navy Blue, Warm Cream, Gold).

User Review Required
IMPORTANT

Tech Stack Confirmation: The PRD specifies React + TypeScript + Vite + Tailwind CSS. We will use Tailwind CSS v4 (latest) unless you prefer v3.

IMPORTANT

Content Language: The PRD is in English, but this is an Indonesian school website. All UI text, navigation labels, and page content will be written in Bahasa Indonesia. Please confirm if you prefer English instead.

IMPORTANT

Sprint Scope: This plan covers Sprint 1 (Home, Profile, Study Programs, Admissions/PPDB, Contact, and core layout/color setup). Sprint 2 & 3 features will be planned subsequently. Please confirm if you want all sprints built at once.

Open Questions
NOTE

School Logo: Do you have the official SMKN 11 logo file? If not, we will use a text-based logo placeholder.
School Photos: Do you have any actual school photos (campus, facilities, activities)? If not, we will generate placeholder images using AI.
Study Programs: What are the actual study programs (jurusan) offered at SMKN 11? Common SMK programs include TKJ (Computer Networking), RPL (Software Engineering), TBSM (Motorcycle Engineering), etc. Please provide the list so we can populate accurate content.
Routing Strategy: We will use react-router-dom for client-side routing. Confirm this is acceptable.
Google Maps Embed: Do you have the school's Google Maps embed URL or coordinates?
Deployment Target: Any specific hosting platform in mind (Vercel, Netlify, etc.)?
Proposed Changes
1. Project Scaffolding & Configuration
[NEW] Project initialization via Vite
npx -y create-vite@latest ./ --template react-ts
Install dependencies: react-router-dom, lucide-react (icons)
Install Tailwind CSS v4 with @tailwindcss/vite
[NEW] 
tailwind.css
Configure the strict 3-color design system:

Navy Blue (#1B2A4A): Primary / structural color — navbar, footer, headings, body text
Warm Cream (#FAF6F0): Background / canvas color — page backgrounds, card bases
Gold (#C8A951): Accent / highlight — CTAs, active nav states, badges
Custom font: Plus Jakarta Sans from Google Fonts
Custom utilities for consistent spacing, shadows, and border radius
[NEW] 
vite.config.ts
Configure Vite with React plugin and Tailwind CSS Vite plugin.

2. Core Layout Components
[NEW] 
src/components/layout/Navbar.tsx
Fixed top navigation bar with Navy Blue background
Logo + school name on the left
Navigation links: Beranda, Profil (dropdown), Akademik (dropdown), Kesiswaan (dropdown), Informasi (dropdown), PPDB (Gold CTA button), Kontak
Search icon trigger
Mobile: Hamburger menu with slide-out drawer
Active state indicator using Gold underline/highlight
[NEW] 
src/components/layout/Footer.tsx
Navy Blue background with cream text
4-column grid: About, Quick Links, Contact Info, Social Media
Copyright bar at bottom
[NEW] 
src/components/layout/Layout.tsx
Wraps Navbar + <Outlet /> + Footer
Scroll-to-top on route change
3. Shared / Reusable Components
[NEW] 
src/components/ui/Button.tsx
Variants: primary (Gold bg), secondary (Navy outline), ghost
Sizes: sm, md, lg
[NEW] 
src/components/ui/Card.tsx
Uniform card with subtle shadow on cream bg
Props: image, title, description, badge, link
Used for News, Study Programs, Achievements
[NEW] 
src/components/ui/SectionHeading.tsx
Consistent section title with Gold accent line
Props: title, subtitle, alignment
[NEW] 
src/components/ui/PageHero.tsx
Page-level hero banner with Navy Blue overlay on background image
Breadcrumb navigation
Page title in white/cream
[NEW] 
src/components/ui/SearchModal.tsx
Full-screen overlay search with live dropdown results
Keyboard accessible (Escape to close)
[NEW] 
src/components/ui/Accordion.tsx
Minimalist accordion for FAQ section
Navy Blue text, Gold indicator for open state
[NEW] 
src/components/ui/Stepper.tsx
Linear step indicator for PPDB process
Steps connected by lines, active step in Gold
[NEW] 
src/components/ui/Gallery.tsx
Grid of thumbnails with Lightbox modal
Navigation arrows, close button
4. Page Components (Sprint 1)
[NEW] 
src/pages/Home.tsx
Hero Section: Full-width slider with school photo, Navy Blue overlay, headline text, 2 CTA buttons ("Jelajahi Program Studi", "Info Penerimaan")
About Summary: Brief profile with principal's photo placeholder, short welcome text
Study Programs Grid: 3-column card grid highlighting key programs with icons
Statistics Bar: 4 counters (Students, Teachers, Programs, Achievements) in a Navy Blue strip
Latest News: 3 latest news cards in a symmetrical grid
CTA Banner: Gold-accented banner for PPDB call to action
[NEW] 
src/pages/profile/History.tsx
PageHero with "Sejarah Sekolah" title
Timeline-style content layout
Historical milestones of SMKN 11
[NEW] 
src/pages/profile/VisionMission.tsx
PageHero with "Visi & Misi" title
Vision statement in a prominent card
Mission points in a numbered list
[NEW] 
src/pages/profile/OrganizationStructure.tsx
PageHero with "Struktur Organisasi" title
Principal card at top, then department heads in a grid
Uniform cards with photo placeholder, name, title
[NEW] 
src/pages/academics/StudyPrograms.tsx
PageHero with "Program Keahlian" title
Grid of program cards (icon, name, short description)
Each card links to program detail page
CTA: "Daftar Sekarang (PPDB)"
[NEW] 
src/pages/academics/StudyProgramDetail.tsx
Dynamic route: /akademik/program/:slug
Tab navigation: Overview, Competencies, Career Prospects, Facilities
Sidebar with program info summary
CTA: "Daftar Sekarang"
[NEW] 
src/pages/academics/Facilities.tsx
PageHero with "Fasilitas" title
Grid of facility cards with photos
Categories: Laboratories, Workshops, Sports, Library
[NEW] 
src/pages/Admissions.tsx
PageHero with "Penerimaan Peserta Didik Baru (PPDB)" title
Stepper UI showing registration flow (6 steps)
Requirements section with checklist
Important dates timeline
CTA: "Daftar Online Sekarang"
[NEW] 
src/pages/Contact.tsx
PageHero with "Hubungi Kami" title
2-column layout: Contact form (left) + Info & Map (right)
Form fields: Name, Email, Subject, Message
Google Maps embed placeholder
Address, phone, email, social links
5. Data Layer
[NEW] 
src/data/programs.ts
Static data for study programs (name, slug, icon, description, competencies, career prospects).

[NEW] 
src/data/news.ts
Static data for news articles (title, date, excerpt, thumbnail, content).

[NEW] 
src/data/staff.ts
Static data for organizational structure (name, title, photo).

[NEW] 
src/data/navigation.ts
Navigation tree structure for Navbar dropdowns.

6. Routing
[NEW] 
src/App.tsx
React Router configuration with all routes:

Route	Component
/	Home
/profil/sejarah	History
/profil/visi-misi	VisionMission
/profil/struktur-organisasi	OrganizationStructure
/akademik/program-keahlian	StudyPrograms
/akademik/program/:slug	StudyProgramDetail
/akademik/fasilitas	Facilities
/kesiswaan/prestasi	Achievements (Sprint 2)
/kesiswaan/ekstrakurikuler	Extracurriculars (Sprint 2)
/kesiswaan/galeri	Gallery (Sprint 2)
/informasi/berita	News (Sprint 2)
/informasi/berita/:slug	NewsDetail (Sprint 2)
/informasi/faq	FAQ (Sprint 2)
/ppdb	Admissions
/kontak	Contact
Verification Plan
Automated Tests
npm run build — ensure zero TypeScript errors and successful production build
npx tsc --noEmit — type checking
Visual review of all pages at Desktop (1440px), Tablet (768px), and Mobile (375px) viewports
Manual Verification
Navigate all routes and verify correct rendering
Test mobile hamburger menu toggle
Verify dropdown navigation menus
Check color adherence: Navy Blue structural, Warm Cream backgrounds, Gold accents only on CTAs
Verify responsive breakpoints
Test search modal open/close