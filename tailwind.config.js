const palette = require('./src/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: palette,
      spacing: {
        // The design leans on an 18/22px rhythm that the default scale skips.
        4.5: '18px',
        5.5: '22px',
        6.5: '26px',
      },
      borderRadius: {
        xs: '7px',
        sm: '9px',
        md: '12px',
        lg: '14px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '26px',
        pill: '30px',
      },
      fontSize: {
        // Mirrors the design's type ramp; line heights keep multi-line
        // titles legible at the larger accessibility font scales.
        '2xs': ['11px', '14px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['15px', '21px'],
        lg: ['16px', '20px'],
        xl: ['17px', '22px'],
        '2xl': ['18px', '24px'],
        '3xl': ['20px', '25px'],
        '4xl': ['21px', '25px'],
        '5xl': ['22px', '27px'],
        '6xl': ['24px', '29px'],
        '7xl': ['26px', '31px'],
      },
    },
  },
  plugins: [],
};
