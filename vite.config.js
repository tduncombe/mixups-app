import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Map the Vercel/Integration variables to the VITE_ variables your code uses
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.DB__VITE_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.DB__VITE_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
    },
  }
})