export default defineAppConfig({
  ui: {
    colors: {
      primary: 'lime',
      secondary: 'blue',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'rose',
      neutral: 'zinc',
    },
    // Global defaults for consistent styling
    button: {
      default: {
        size: 'md'
      }
    },
    card: {
      default: {
        shadow: 'sm'
      }
    },
    input: {
      default: {
        size: 'md'
      }
    },
    badge: {
      default: {
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
    }
  },
})
