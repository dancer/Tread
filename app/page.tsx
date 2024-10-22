'use client'

import TypingTest from '../components/TypingTest'
import ThemeSwitcher from '../components/ThemeSwitcher'
import { useTheme } from '../components/ThemeProvider'

export default function Home() {
  const { theme } = useTheme()

  const getThemeClasses = (themeName: string) => {
    switch (themeName) {
      case 'catppuccin':
        return 'bg-catppuccin-base text-catppuccin-text'
      case 'dracula':
        return 'bg-dracula-background text-dracula-foreground'
      case 'everforest':
        return 'bg-everforest-background text-everforest-foreground'
      case 'dark':
        return 'bg-gray-900 text-gray-100'
      case 'light':
        return 'bg-gray-100 text-gray-900'
      case 'nord':
        return 'bg-nord-background text-nord-foreground'
      case 'gruvbox':
        return 'bg-gruvbox-background text-gruvbox-foreground'
      case 'solarized':
        return 'bg-solarized-background text-solarized-foreground'
      case 'tokyo':
        return 'bg-tokyo-background text-tokyo-foreground'
      default:
        return 'bg-gray-100 text-gray-900'
    }
  }

  const themeClasses = getThemeClasses(theme)

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24 ${themeClasses}`}>
      <nav className={`fixed top-0 left-0 right-0 p-4 flex justify-between items-center ${
        theme === 'catppuccin' ? 'bg-catppuccin-mantle' : 'bg-opacity-50 backdrop-blur-md'
      }`}>
        <h1 className="text-2xl font-bold">Tread</h1>
      </nav>
      <div className="flex-grow flex items-center justify-center w-full">
        <TypingTest />
      </div>
      <div className="fixed bottom-4 right-4">
        <ThemeSwitcher />
      </div>
    </main>
  )
}