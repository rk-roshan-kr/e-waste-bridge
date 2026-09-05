/**
 * domainDictionary.js - Layered E-Waste Domain Lexicon & Scrap Slang Repository
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export const DomainDictionary = Object.freeze({
  // Slang & Colloquialisms mapped to canonical entities
  slangMappings: [
    {
      patterns: [/\blaptop ka maal\b/i, /\blaptop board\b/i, /\bpurana laptop\b/i, /\blaptop\b/i],
      canonicalEntity: 'LAPTOP',
      cpcbCode: 'ITEW2',
      defaultRatePerKg: 310,
      hazardous: false
    },
    {
      patterns: [/\bbattery wala\b/i, /\blithium cell\b/i, /\blithium ion\b/i, /\bli-ion\b/i, /\bbattery\b/i],
      canonicalEntity: 'BATTERY',
      cpcbCode: 'SCHEDULE-I/BATT',
      defaultRatePerKg: 180,
      hazardous: true
    },
    {
      patterns: [/\bmother board\b/i, /\bmotherboard\b/i, /\bcircuit board\b/i, /\bpcb\b/i, /\bplate\b/i],
      canonicalEntity: 'PCB',
      cpcbCode: 'ITEW2/PCB',
      defaultRatePerKg: 420,
      hazardous: false
    },
    {
      patterns: [/\bpurana phone\b/i, /\bmobile maal\b/i, /\bsmartphone\b/i, /\bmobile\b/i],
      canonicalEntity: 'MOBILE_PHONE',
      cpcbCode: 'ITEW15',
      defaultRatePerKg: 450,
      hazardous: false
    },
    {
      patterns: [/\bplastic maal\b/i, /\bchhoti body\b/i, /\babs\b/i, /\bplastic casing\b/i],
      canonicalEntity: 'ABS_PLASTIC',
      cpcbCode: 'PLAST-ENG',
      defaultRatePerKg: 42,
      hazardous: false
    },
    {
      patterns: [/\bcopper wire\b/i, /\btaar\b/i, /\bcable\b/i, /\btambe ka taar\b/i],
      canonicalEntity: 'COPPER_CABLE',
      cpcbCode: 'CABLE-CU',
      defaultRatePerKg: 520,
      hazardous: false
    },
    {
      patterns: [/\bsmps\b/i, /\bsupply box\b/i, /\bpower supply\b/i],
      canonicalEntity: 'SMPS',
      cpcbCode: 'ITEW2/SMPS',
      defaultRatePerKg: 65,
      hazardous: false
    },
    {
      patterns: [/\bmotor\b/i, /\bchumbak\b/i, /\bmagnet\b/i, /\bneodymium\b/i, /\bmotor scrap\b/i],
      canonicalEntity: 'MOTORS_MAGNETS',
      cpcbCode: 'EEM1',
      defaultRatePerKg: 120,
      hazardous: false
    },
    {
      patterns: [/\blcd\b/i, /\bled screen\b/i, /\bdisplay panel\b/i, /\bflat screen\b/i, /\blcd panel\b/i, /\btv screen\b/i],
      canonicalEntity: 'LCD_PANELS',
      cpcbCode: 'ITEW12',
      defaultRatePerKg: 65,
      hazardous: true
    },
    {
      patterns: [/\bcrt\b/i, /\bpicture tube\b/i, /\bbhari tv\b/i, /\bmonitor tube\b/i, /\bglass monitor\b/i],
      canonicalEntity: 'CRT_MONITORS',
      cpcbCode: 'ITEW11',
      defaultRatePerKg: 45,
      hazardous: true
    }
  ],

  // Number words in Hindi & Marathi for numeric resolution
  vernacularNumbers: {
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'dus': 10,
    'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15, 'solah': 16, 'satrah': 17, 'athaarah': 18,
    'unnees': 19, 'bees': 20, 'pachees': 25, 'tees': 30, 'chaalees': 40, 'pachaas': 50, 'sau': 100
  }
});
