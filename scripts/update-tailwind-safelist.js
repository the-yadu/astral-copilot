#!/usr/bin/env node

/**
 * Tailwind Class Analyzer
 * This script scans for dynamically generated Tailwind classes and updates the safelist
 */

const fs = require('fs');
const path = require('path');

// Define patterns for Tailwind classes that might be generated dynamically
const DYNAMIC_CLASS_PATTERNS = [
  // Text colors
  /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
  
  // Background colors
  /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
  
  // Border colors
  /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
  
  // Hover states
  /hover:(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
  
  // Focus states
  /focus:(ring|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
  
  // Spacing
  /(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
  
  // Width/Height
  /(w|h)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)/,
  
  // Fractions
  /(w|h)-(1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12)/,
  
  // Typography
  /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
  /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/,
  /leading-(3|4|5|6|7|8|9|10|none|tight|snug|normal|relaxed|loose)/,
  
  // Layout
  /(flex|grid|block|inline|inline-block|inline-flex|table|table-cell|hidden)/,
  /grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12|none)/,
  /(items|justify|content|self)-(start|end|center|between|around|evenly|stretch|baseline|auto)/,
  
  // Borders and Rounded
  /rounded-(none|sm|md|lg|xl|2xl|3xl|full)/,
  /(border|border-t|border-r|border-b|border-l|border-x|border-y)/,
  
  // Shadows and Effects
  /shadow-(sm|md|lg|xl|2xl|inner|none)/,
  /(opacity|scale|rotate|skew|translate)-(0|5|10|12|25|50|75|90|95|100|105|110|125|150)/,
  
  // Responsive prefixes
  /(sm|md|lg|xl|2xl):/,
  
  // State prefixes
  /(hover|focus|active|disabled|group-hover|group-focus):/,
];

// Comprehensive safelist based on your AI prompt requirements
const COMPREHENSIVE_SAFELIST = [
  // Text Colors - High contrast for readability
  'text-slate-900', 'text-gray-900', 'text-gray-800', 'text-gray-700', 'text-gray-600', 'text-white',
  
  // Semantic text colors
  'text-blue-600', 'text-blue-700', 'text-green-600', 'text-green-700',
  'text-red-600', 'text-red-700', 'text-amber-600', 'text-amber-700',
  'text-indigo-600', 'text-indigo-700', 'text-purple-600', 'text-purple-700',
  
  // Background Colors - Light backgrounds for text readability
  'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-slate-50', 'bg-slate-100',
  
  // Semantic background colors
  'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600',
  'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600',
  'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600',
  'bg-amber-50', 'bg-amber-100', 'bg-amber-500', 'bg-amber-600',
  'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-500', 'bg-indigo-600',
  'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600',
  
  // Hover States
  'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:bg-blue-50', 'hover:bg-blue-100',
  'hover:bg-green-50', 'hover:bg-green-100', 'hover:bg-red-50', 'hover:bg-red-100',
  'hover:bg-amber-50', 'hover:bg-amber-100', 'hover:bg-indigo-50', 'hover:bg-indigo-100',
  'hover:text-blue-700', 'hover:text-green-700', 'hover:text-red-700',
  
  // Focus States
  'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-green-500',
  'focus:ring-red-500', 'focus:ring-amber-500', 'focus:ring-indigo-500', 'focus:ring-offset-2',
  
  // Typography - Full range for educational content
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
  'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold',
  'leading-3', 'leading-4', 'leading-5', 'leading-6', 'leading-7', 'leading-8', 'leading-9', 'leading-10',
  'leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
  
  // Spacing - Comprehensive padding and margin
  'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12', 'p-16', 'p-20',
  'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'px-12', 'px-16',
  'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8', 'py-12', 'py-16',
  'm-0', 'm-1', 'm-2', 'm-4', 'm-6', 'm-8', 'm-10', 'm-12', 'm-16', 'm-20',
  'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-6', 'mb-8', 'mb-10', 'mb-12', 'mb-16',
  'mt-1', 'mt-2', 'mt-4', 'mt-6', 'mt-8', 'mt-10', 'mt-12', 'mt-16',
  'mx-auto', 'mx-1', 'mx-2', 'mx-4', 'mx-6', 'mx-8',
  'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-6', 'space-y-8', 'space-y-12',
  'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8', 'gap-12',
  
  // Layout and Flexbox
  'flex', 'inline-flex', 'grid', 'inline-grid', 'block', 'inline-block', 'inline', 'hidden',
  'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
  'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
  'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly',
  'content-start', 'content-end', 'content-center', 'content-between', 'content-around', 'content-evenly',
  'self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline',
  
  // Grid Layout
  'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6', 'grid-cols-12',
  'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-6', 'col-span-full',
  'row-span-1', 'row-span-2', 'row-span-3', 'row-span-full',
  
  // Width and Height
  'w-auto', 'w-full', 'w-screen', 'w-min', 'w-max', 'w-fit',
  'w-0', 'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-40', 'w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96',
  'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-2/4', 'w-3/4', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-1/6', 'w-5/6',
  'h-auto', 'h-full', 'h-screen', 'h-min', 'h-max', 'h-fit',
  'h-0', 'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-40', 'h-48', 'h-56', 'h-64',
  'min-h-0', 'min-h-full', 'min-h-screen', 'min-h-min', 'min-h-max', 'min-h-fit',
  'max-w-none', 'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-full', 'max-w-screen-sm', 'max-w-screen-md', 'max-w-screen-lg', 'max-w-screen-xl', 'max-w-screen-2xl',
  
  // Borders and Rounded
  'border', 'border-0', 'border-2', 'border-4', 'border-8',
  'border-t', 'border-r', 'border-b', 'border-l',
  'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-slate-200', 'border-slate-300',
  'border-blue-200', 'border-blue-300', 'border-green-200', 'border-green-300',
  'border-red-200', 'border-red-300', 'border-amber-200', 'border-amber-300',
  'rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
  'rounded-t-none', 'rounded-t-sm', 'rounded-t', 'rounded-t-md', 'rounded-t-lg', 'rounded-t-xl',
  
  // Shadows and Effects
  'shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner',
  'drop-shadow-sm', 'drop-shadow', 'drop-shadow-md', 'drop-shadow-lg', 'drop-shadow-xl', 'drop-shadow-2xl',
  
  // Opacity and Transforms
  'opacity-0', 'opacity-5', 'opacity-10', 'opacity-20', 'opacity-25', 'opacity-30', 'opacity-40', 'opacity-50', 'opacity-60', 'opacity-70', 'opacity-75', 'opacity-80', 'opacity-90', 'opacity-95', 'opacity-100',
  'scale-0', 'scale-50', 'scale-75', 'scale-90', 'scale-95', 'scale-100', 'scale-105', 'scale-110', 'scale-125', 'scale-150',
  'rotate-0', 'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6', 'rotate-12', 'rotate-45', 'rotate-90', 'rotate-180',
  '-rotate-1', '-rotate-2', '-rotate-3', '-rotate-6', '-rotate-12', '-rotate-45', '-rotate-90', '-rotate-180',
  
  // Transitions and Animations
  'transition', 'transition-none', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-shadow', 'transition-transform',
  'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300', 'duration-500', 'duration-700', 'duration-1000',
  'ease-linear', 'ease-in', 'ease-out', 'ease-in-out',
  
  // Interactive States
  'cursor-auto', 'cursor-default', 'cursor-pointer', 'cursor-wait', 'cursor-text', 'cursor-move', 'cursor-help', 'cursor-not-allowed',
  'select-none', 'select-text', 'select-all', 'select-auto',
  'pointer-events-none', 'pointer-events-auto',
  
  // Disabled states
  'disabled:opacity-25', 'disabled:opacity-50', 'disabled:opacity-75',
  'disabled:cursor-not-allowed', 'disabled:pointer-events-none',
  
  // Position and Z-Index
  'static', 'fixed', 'absolute', 'relative', 'sticky',
  'inset-0', 'inset-x-0', 'inset-y-0', 'top-0', 'right-0', 'bottom-0', 'left-0',
  'top-auto', 'right-auto', 'bottom-auto', 'left-auto',
  'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50', 'z-auto',
  
  // Overflow
  'overflow-auto', 'overflow-hidden', 'overflow-clip', 'overflow-visible', 'overflow-scroll',
  'overflow-x-auto', 'overflow-x-hidden', 'overflow-x-clip', 'overflow-x-visible', 'overflow-x-scroll',
  'overflow-y-auto', 'overflow-y-hidden', 'overflow-y-clip', 'overflow-y-visible', 'overflow-y-scroll',
  
  // Responsive Classes - Common breakpoints
  'sm:text-sm', 'sm:text-base', 'sm:text-lg', 'sm:text-xl',
  'sm:p-2', 'sm:p-4', 'sm:p-6', 'sm:p-8',
  'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3',
  'md:text-base', 'md:text-lg', 'md:text-xl', 'md:text-2xl',
  'md:p-4', 'md:p-6', 'md:p-8', 'md:p-12',
  'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
  'lg:text-lg', 'lg:text-xl', 'lg:text-2xl', 'lg:text-3xl',
  'lg:p-6', 'lg:p-8', 'lg:p-12', 'lg:p-16',
  'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-6',
  'xl:text-xl', 'xl:text-2xl', 'xl:text-3xl', 'xl:text-4xl',
  'xl:grid-cols-4', 'xl:grid-cols-6', 'xl:grid-cols-12',
  
  // Gradients
  'bg-gradient-to-t', 'bg-gradient-to-tr', 'bg-gradient-to-r', 'bg-gradient-to-br', 'bg-gradient-to-b', 'bg-gradient-to-bl', 'bg-gradient-to-l', 'bg-gradient-to-tl',
  'from-transparent', 'from-current', 'from-black', 'from-white',
  'from-gray-50', 'from-gray-100', 'from-blue-50', 'from-blue-100', 'from-green-50', 'from-green-100',
  'to-transparent', 'to-current', 'to-black', 'to-white',
  'to-gray-50', 'to-gray-100', 'to-blue-50', 'to-blue-100', 'to-green-50', 'to-green-100',
  'via-transparent', 'via-current', 'via-black', 'via-white',
];

// Function to update Tailwind config
function updateTailwindConfig() {
  const configPath = path.join(__dirname, '..', 'tailwind.config.js');
  
  if (!fs.existsSync(configPath)) {
    console.error('Tailwind config not found at:', configPath);
    return;
  }

  // Generate the new config content
  const configContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include dynamic content paths
    './src/app/lessons/**/*.{js,ts,jsx,tsx}',
    './supabase/storage/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    },
  },
  plugins: [
    // Add any plugins here
  ],
  safelist: [
    // Comprehensive safelist for AI-generated classes
    ${COMPREHENSIVE_SAFELIST.map(cls => `'${cls}'`).join(',\n    ')},
    
    // Regex patterns for dynamic classes
    {
      pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    {
      pattern: /^hover:(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    {
      pattern: /^focus:(ring|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    {
      pattern: /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
    },
    {
      pattern: /^(w|h)-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)$/,
    },
    {
      pattern: /^(sm|md|lg|xl|2xl):(text|p|m|w|h|grid-cols|col-span)-(xs|sm|base|lg|xl|2xl|3xl|4xl|0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|1|2|3|4|6|12)$/,
    },
  ],
};`;

  try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✅ Tailwind config updated successfully!');
    console.log('📦 Added comprehensive safelist with', COMPREHENSIVE_SAFELIST.length, 'classes');
    console.log('🔄 Added regex patterns for dynamic class generation');
  } catch (error) {
    console.error('❌ Error updating Tailwind config:', error.message);
  }
}

// Main execution
if (require.main === module) {
  console.log('🎨 Updating Tailwind CSS configuration for dynamic class generation...');
  updateTailwindConfig();
  console.log('✨ Configuration update complete! Restart your dev server to see changes.');
}

module.exports = {
  COMPREHENSIVE_SAFELIST,
  DYNAMIC_CLASS_PATTERNS,
  updateTailwindConfig
};