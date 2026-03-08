'use client'

import { Fragment, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'

const Sun = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0M17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1M5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414M4 11a1 1 0 100-2H3a1 1 0 000 2h1"
      clipRule="evenodd"
    />
  </svg>
)

const Moon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
)

const Monitor = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <rect x="3" y="3" width="14" height="10" rx="2" ry="2" />
    <line x1="7" y1="17" x2="13" y2="17" />
    <line x1="10" y1="13" x2="10" y2="17" />
  </svg>
)

const Blank = () => <span className="h-5 w-5" />

const options = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
] as const

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const CurrentIcon = mounted ? (resolvedTheme === 'dark' ? Moon : Sun) : Blank

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        aria-label="切换主题"
        className="ledger-btn ledger-btn-ghost inline-flex h-10 w-10 p-0"
      >
        <CurrentIcon />
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-120"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="ledger-surface absolute right-0 z-70 mt-2 w-36 origin-top-right p-1 focus:outline-none">
          {options.map((option) => (
            <MenuItem key={option.key}>
              {({ focus }) => {
                const selected = theme === option.key
                const itemClass =
                  focus || selected
                    ? 'bg-ledger-accent-soft text-ledger-accent-strong'
                    : 'text-ledger-text-soft'

                return (
                  <button
                    type="button"
                    onClick={() => setTheme(option.key)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${itemClass}`}
                  >
                    <option.Icon />
                    <span>{option.label}</span>
                  </button>
                )
              }}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  )
}

export default ThemeSwitch
