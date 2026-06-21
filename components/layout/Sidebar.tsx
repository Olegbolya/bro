'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import styles from './Sidebar.module.css'

const navLinks = [
  { href: '/',         label: 'Главная',  icon: '⬡' },
  { href: '/news',     label: 'Новости',  icon: '◈' },
  { href: '/contacts', label: 'Контакты', icon: '◉' },
]

const socialLinks = [
  {
    href: 'https://vk.com/bro_kzn', label: 'ВК',
    svg: <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-.992-1.49-.992s-.385.006-.385.616v1.573c0 .366-.119.53-1.098.53-1.617 0-3.412-.981-4.677-2.809C6.158 11.98 5.5 9.74 5.5 8.59c0-.54.097-.785.532-.785h1.744c.396 0 .548.18.7.604.77 2.227 2.065 4.176 2.596 4.176.2 0 .29-.093.29-.602V9.887c-.065-1.08-.632-1.17-.632-1.554 0-.228.186-.457.483-.457h2.744c.33 0 .45.177.45.556v2.988c0 .33.15.447.242.447.2 0 .368-.117.735-.484 1.14-1.275 1.952-3.237 1.952-3.237.107-.23.3-.443.696-.443h1.744c.525 0 .64.27.525.6-.218.99-2.334 3.998-2.334 3.998-.185.3-.25.437 0 .773.184.252.789.773 1.19 1.24.74.854 1.306 1.57 1.459 2.065.135.49-.128.74-.62.74z" />,
  },
  {
    href: 'https://t.me/robot_figh', label: 'ТГ',
    svg: <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />,
  },
  {
    href: 'https://www.tiktok.com/@bro_kzn', label: 'ТикТок',
    svg: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.01a8.16 8.16 0 004.77 1.52V7.1a4.85 4.85 0 01-1-.41z" />,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileLogo}>БРО</Link>
        <button className={styles.burger} onClick={() => setOpen(o => !o)} aria-label="Меню">
          <span /><span /><span />
        </button>
      </div>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink} onClick={() => setOpen(false)}>БРО</Link>
          <span className={styles.logoSub}>Бои Роботов Онлайн</span>
          <div className={styles.statusBar}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>Arena Online</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href="https://static.robo-arena.ru/queue.html"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.playBtn}
        >
          Играть
          <span className={styles.playArrow}>▶</span>
        </a>

        <div className={styles.social}>
          {socialLinks.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className={styles.socialLink}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">{s.svg}</svg>
            </a>
          ))}
        </div>
      </aside>
    </>
  )
}
