'use client'

import Link from 'next/link'
import { MdHistory, MdHome, MdPhotoCamera } from 'react-icons/md'

const items = [
  { href: '/', label: 'Home', Icon: MdHome, matches: pathname => pathname === '/' },
  { href: '/photo/upload', label: 'Capture', Icon: MdPhotoCamera, matches: pathname => pathname === '/photo/upload' },
  { href: '/photo/history', label: 'History', Icon: MdHistory, matches: pathname => pathname === '/photo/history' }
]

export default function ContributorNavigation({ pathname }) {
  return (
    <nav className="contributor-mobile-nav" aria-label="Contributor navigation">
      {items.map(({ href, label, Icon, matches }) => {
        const active = matches(pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`contributor-mobile-nav__item${active ? ' contributor-mobile-nav__item--active' : ''}`}
          >
            <Icon size={22} aria-hidden />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
