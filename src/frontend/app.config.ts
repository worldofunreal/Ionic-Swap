export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      secondary: 'blue',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'slate',
    },
    toast: {
      slots: {
        root: 'relative group overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg p-4 flex gap-2.5'
      }
    },
    // Global defaults for consistent styling
    button: {
      defaultVariants: {
        size: 'md'
      }
    },
    card: {
      defaultVariants: {
        shadow: 'sm'
      }
    },
    input: {
      defaultVariants: {
        size: 'md'
      }
    },
    badge: {
      defaultVariants: {
        size: 'sm'
      }
    },
    // Typography scale
    typography: {
      h1: 'text-2xl font-bold tracking-tight text-zinc-900 dark:text-white',
      h2: 'text-xl font-semibold tracking-tight text-zinc-900 dark:text-white',
      h3: 'text-lg font-semibold text-zinc-900 dark:text-white',
      h4: 'text-base font-semibold text-zinc-900 dark:text-white',
      body: 'text-sm text-zinc-900 dark:text-white',
      caption: 'text-xs text-zinc-500 dark:text-zinc-400',
      mono: 'font-mono text-sm text-zinc-900 dark:text-white'
    },
    // Spacing scale
    spacing: {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }
  },
})
