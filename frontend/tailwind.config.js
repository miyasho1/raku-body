export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0056B3',
          hover: '#004494',
          active: '#003366',
          light: '#EBF3FC',
        },
        dads: {
          text: '#1A1A1C',
          subtext: '#475467',
          border: '#D0D5DD',
          bg: '#F8F9FA',
          panel: '#FFFFFF',
          hover: '#F2F4F7',
        }
      }
    },
  },
  plugins: [],
}
