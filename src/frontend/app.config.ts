export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      secondary: 'blue',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'rose',
      neutral: 'slate',
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
      h1: 'text-2xl font-bold tracking-tight',
      h2: 'text-xl font-semibold tracking-tight',
      h3: 'text-lg font-semibold',
      h4: 'text-base font-semibold',
      body: 'text-sm',
      caption: 'text-xs text-muted-foreground',
      mono: 'font-mono text-sm'
    },
    // Spacing scale
    spacing: {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    },
    // Toast/Notification theming
    notification: {
      defaultVariants: {
        color: 'white',
        position: 'top-right'
      }
    }
  },
})
