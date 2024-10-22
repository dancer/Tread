'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const themes = [
  'catppuccin',
  'dracula',
  'everforest',
  'dark',
  'light',
  'nord',
  'gruvbox',
  'solarized',
  'tokyo'
] as const

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = (newTheme: typeof themes[number]) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  const getThemeColors = (themeName: string) => {
    switch (themeName) {
      case 'catppuccin':
        return { bg: 'bg-catppuccin-base', text: 'text-catppuccin-text' }
      case 'dracula':
        return { bg: 'bg-dracula-background', text: 'text-dracula-foreground' }
      case 'everforest':
        return { bg: 'bg-everforest-background', text: 'text-everforest-foreground' }
      case 'dark':
        return { bg: 'bg-gray-900', text: 'text-gray-100' }
      case 'light':
        return { bg: 'bg-gray-100', text: 'text-gray-900' }
      case 'nord':
        return { bg: 'bg-nord-background', text: 'text-nord-foreground' }
      case 'gruvbox':
        return { bg: 'bg-gruvbox-background', text: 'text-gruvbox-foreground' }
      case 'solarized':
        return { bg: 'bg-solarized-background', text: 'text-solarized-foreground' }
      case 'tokyo':
        return { bg: 'bg-tokyo-background', text: 'text-tokyo-foreground' }
      default:
        return { bg: 'bg-gray-900', text: 'text-gray-100' }
    }
  }

  const { bg: currentBg, text: currentText } = getThemeColors(theme)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full ${currentBg} ${currentText} hover:opacity-80 transition-colors duration-200`}
        aria-label="Toggle theme"
      >
        <Palette size={20} />
      </button>
      {isOpen && (
        <div className={`absolute bottom-full right-0 mb-2 w-48 ${currentBg} rounded-lg shadow-lg p-2`}>
          <div className="flex flex-col space-y-1">
            {themes.map((t) => {
              const { bg, text } = getThemeColors(t)
              return (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`flex items-center justify-between p-2 rounded-md ${
                    theme === t ? 'opacity-100' : 'opacity-60'
                  } hover:opacity-100 transition-opacity duration-200 ${bg} ${text}`}
                >
                  <span className="capitalize">{t}</span>
                  <div className={`w-6 h-6 rounded-full ${bg}`} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}