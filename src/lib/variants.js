import { cva } from 'class-variance-authority';

/**
 * Card container variants for sections and containers
 */
export const cardVariants = cva(
  'rounded-xl shadow-sm border transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        complete: 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        subtle: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      opacity: {
        default: '',
        loading: 'opacity-70',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      opacity: 'default',
    },
  }
);

/**
 * Button variants for all button types
 */
export const buttonVariants = cva(
  'transition-all font-semibold rounded-xl outline-none focus:ring-2 focus:ring-indigo-500',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none',
        secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200',
        winner: 'border transition-colors rounded-full',
        config: 'px-3 py-2 rounded-lg text-sm border text-left transition-all',
        remove: 'hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5 transition-colors',
        modal: 'p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors',
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'w-full py-3',
      },
      active: {
        true: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300',
        false: 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300',
      },
      winner: {
        true: 'bg-green-600 text-white border-green-600',
        false: 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
      },
      disabled: {
        true: 'text-gray-300 dark:text-gray-600 dark:border-gray-700 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * Input field variants
 */
export const inputVariants = cva(
  'border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white',
  {
    variants: {
      variant: {
        default: 'p-3 text-sm',
        score: 'w-12 h-10 text-center font-mono text-lg bg-white dark:bg-gray-700',
        container: 'flex flex-wrap gap-2 p-3 min-h-[42px]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      fullWidth: false,
    },
  }
);

/**
 * Badge/Tag variants (player tags, result badges)
 */
export const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        player: 'gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm',
        win: 'h-8 flex-1 justify-center text-xs font-bold text-white bg-green-500',
        loss: 'h-8 flex-1 justify-center text-xs font-bold text-white bg-red-400',
        draw: 'h-8 flex-1 justify-center text-xs font-bold text-white bg-gray-400',
        empty: 'h-8 flex-1 bg-gray-100 dark:bg-gray-700',
      },
      rounded: {
        md: 'rounded-md',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'player',
      rounded: 'full',
    },
  }
);

/**
 * Player avatar variants
 */
export const avatarVariants = cva(
  'rounded-full flex items-center justify-center text-xs font-bold uppercase',
  {
    variants: {
      size: {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
      },
      variant: {
        default: 'ring-2 ring-white dark:ring-gray-800 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

/**
 * Stat card variants for player stats
 */
export const statCardVariants = cva(
  'p-3 rounded-xl text-center',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-50 dark:bg-indigo-900/20',
        accent: 'bg-orange-50 dark:bg-orange-900/20',
        neutral: 'bg-gray-50 dark:bg-gray-700/30',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

/**
 * Stat label variants
 */
export const statLabelVariants = cva(
  'text-xs mb-1 uppercase font-semibold',
  {
    variants: {
      variant: {
        primary: 'text-gray-500 dark:text-indigo-300',
        accent: 'text-gray-500 dark:text-orange-300',
        neutral: 'text-gray-500 dark:text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

/**
 * Stat value variants
 */
export const statValueVariants = cva(
  'font-bold',
  {
    variants: {
      size: {
        xs: 'text-sm',
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
      },
      variant: {
        primary: 'text-indigo-600 dark:text-indigo-400',
        accent: 'text-orange-500',
        neutral: 'text-gray-800 dark:text-gray-200',
        win: 'text-green-600 dark:text-green-400',
        loss: 'text-red-500 dark:text-red-400',
        conditional: '', // For conditional styling
      },
    },
    defaultVariants: {
      size: 'lg',
      variant: 'neutral',
    },
  }
);

/**
 * Team display variants
 */
export const teamDisplayVariants = cva(
  'flex flex-col items-center',
  {
    variants: {
      winner: {
        true: 'text-green-700 dark:text-green-400 font-bold',
        false: 'text-gray-700 dark:text-gray-300',
      },
    },
    defaultVariants: {
      winner: false,
    },
  }
);

/**
 * Modal/overlay variants
 */
export const modalOverlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'bg-black/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const modalContentVariants = cva(
  'bg-white dark:bg-gray-800 rounded-2xl',
  {
    variants: {
      size: {
        sm: 'max-w-sm w-full',
        md: 'max-w-md w-full',
        lg: 'max-w-lg w-full',
      },
      variant: {
        simple: 'p-6 text-center',
        complex: 'shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700',
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'simple',
    },
  }
);

/**
 * Label variants
 */
export const labelVariants = cva(
  'block font-medium mb-2',
  {
    variants: {
      variant: {
        default: 'text-sm text-gray-700 dark:text-gray-300',
        section: 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase',
        heading: 'text-xs font-bold text-gray-400 uppercase',
      },
      withIcon: {
        true: 'flex items-center',
      },
    },
    defaultVariants: {
      variant: 'default',
      withIcon: false,
    },
  }
);

/**
 * Text variants for headings and descriptions
 */
export const headingVariants = cva(
  'font-bold tracking-tight',
  {
    variants: {
      size: {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl',
      },
      variant: {
        default: 'text-gray-900 dark:text-white',
      },
    },
    defaultVariants: {
      size: 'lg',
      variant: 'default',
    },
  }
);

export const descriptionVariants = cva(
  '',
  {
    variants: {
      variant: {
        default: 'text-gray-500 dark:text-gray-400',
        muted: 'text-xs text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
