import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, Contact } from 'lucide-react'

const links = [
  { label: 'Beranda BKK', href: '/bkk', icon: Home },
  { label: 'Lowongan Kerja', href: '/bkk/lowongan', icon: Briefcase },
  { label: 'Kontak BKK', href: '/bkk/kontak', icon: Contact },
]

const BkkSubNav: React.FC = () => {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/bkk') return location.pathname === '/bkk'
    return location.pathname.startsWith(href)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#1B2A4A]/10 bg-white p-2 shadow-sm">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#1B2A4A] text-[#FAF6F0]'
                  : 'text-[#23314D] hover:bg-[#FAF6F0] hover:text-[#1B2A4A]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BkkSubNav
