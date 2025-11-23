export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slideDown': 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ripple': 'ripple 1.2s ease-out',
      },
      keyframes: {
        slideDown: {
          '0%': {
            transform: 'translate(-50%, -100%) scale(0.8)',
            opacity: '0'
          },
          '100%': {
            transform: 'translate(-50%, 0) scale(1)',
            opacity: '1'
          },
        },
        ripple: {
          '0%': {
            transform: 'scale(0)',
            opacity: '0.8',
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
