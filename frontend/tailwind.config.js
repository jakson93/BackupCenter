/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bc: {
          bg: '#07111F',
          bg2: '#0B1628',
          card: '#0F1B2D',
          card2: '#132238',
          hover: '#182B45',
          border: '#1F334D',
          borderActive: '#2F5F9F',
          text: '#F8FAFC',
          text2: '#CBD5E1',
          text3: '#94A3B8',
          textWeak: '#64748B',
          ok: '#22C55E',
          warn: '#F59E0B',
          bad: '#EF4444',
          info: '#3B82F6',
          purple: '#A855F7',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 20px 50px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
        input: '12px',
        badge: '8px',
        table: '12px',
      },
    },
  },
  plugins: [],
}
