// Authentic high-fidelity visual representations of e-waste lots
// Used for simulated AI vision analysis, camera fallbacks, and real data URLs

export const SAMPLE_LOT_PHOTOS = {
  smartphones: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%231a1d24"/>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="%23262a34" stroke-width="0.8"/>
    </pattern>
    <rect width="600" height="400" fill="url(%23grid)" />
    <!-- Workbench Table Surface -->
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%23242933" stroke="%233a4150" stroke-width="2"/>
    <!-- Smartphone 1 (Smashed glass) -->
    <g transform="translate(100, 70) rotate(-15)">
      <rect width="110" height="210" rx="14" fill="%230f1115" stroke="%23555e6d" stroke-width="3"/>
      <rect x="6" y="8" width="98" height="194" rx="8" fill="%231e2430"/>
      <!-- Smashed glass fracture lines -->
      <path d="M 20 20 L 55 90 L 90 40 M 55 90 L 40 160 L 85 140 M 40 160 L 15 190" stroke="%238fa0ba" stroke-width="1.5" fill="none" opacity="0.85"/>
      <circle cx="55" cy="18" r="4" fill="%23333b47"/>
    </g>
    <!-- Smartphone 2 (Exposed battery chassis) -->
    <g transform="translate(230, 90) rotate(8)">
      <rect width="115" height="220" rx="14" fill="%23161920" stroke="%23474f5d" stroke-width="3"/>
      <rect x="12" y="30" width="90" height="130" rx="4" fill="%231a1c22" stroke="%23ff4d4f" stroke-width="1"/>
      <text x="24" y="95" fill="%23ff7875" font-family="monospace" font-size="9" font-weight="bold">Li-ion 3.8V</text>
      <rect x="15" y="170" width="85" height="36" fill="%232f54eb" opacity="0.3"/>
    </g>
    <!-- Smartphone 3 (Older feature phone) -->
    <g transform="translate(370, 110) rotate(-28)">
      <rect width="85" height="170" rx="10" fill="%232b313d" stroke="%23687385" stroke-width="2"/>
      <rect x="10" y="14" width="65" height="60" rx="4" fill="%235b8c00" opacity="0.4"/>
      <!-- Keypad matrix -->
      <circle cx="26" cy="95" r="5" fill="%23434d5d"/>
      <circle cx="43" cy="95" r="5" fill="%23434d5d"/>
      <circle cx="60" cy="95" r="5" fill="%23434d5d"/>
      <circle cx="26" cy="115" r="5" fill="%23434d5d"/>
      <circle cx="43" cy="115" r="5" fill="%23434d5d"/>
      <circle cx="60" cy="115" r="5" fill="%23434d5d"/>
    </g>
    <!-- HUD AI Target Bounding Box -->
    <rect x="80" y="55" width="440" height="280" fill="none" stroke="%23d4ff28" stroke-width="2" stroke-dasharray="8 6"/>
    <rect x="80" y="55" width="160" height="22" fill="%23d4ff28"/>
    <text x="88" y="70" fill="%2312151a" font-family="monospace" font-size="11" font-weight="900">AI: TEL-MOB [94.8%]</text>
  </svg>`,

  laptops: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%23181b22"/>
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%23222731" stroke="%2339414f" stroke-width="2"/>
    <!-- Laptop Base 1 -->
    <g transform="translate(110, 80) rotate(-6)">
      <polygon points="20,160 300,160 270,40 50,40" fill="%232a2f3b" stroke="%234f596b" stroke-width="2"/>
      <polygon points="65,130 255,130 240,55 80,55" fill="%23181b22"/>
      <rect x="135" y="135" width="50" height="20" rx="2" fill="%23383f4f"/>
      <!-- Cracked Screen Lid -->
      <polygon points="50,40 270,40 250,-50 70,-50" fill="%2316181d" stroke="%23ff4d4f" stroke-width="1.5"/>
      <path d="M 80 -20 L 160 10 L 220 -40" stroke="%23ff7875" stroke-width="1.5" fill="none"/>
    </g>
    <!-- Laptop Base 2 (Stripped components) -->
    <g transform="translate(240, 160) rotate(12)">
      <rect width="240" height="150" rx="8" fill="%231c2029" stroke="%23434c5c" stroke-width="2"/>
      <rect x="25" y="20" width="90" height="70" fill="%23274916" stroke="%2352c41a" stroke-width="1"/>
      <circle cx="170" cy="55" r="30" fill="%232e3544" stroke="%235c677a" stroke-width="2"/>
    </g>
    <!-- HUD AI Target Bounding Box -->
    <rect x="90" y="45" width="420" height="295" fill="none" stroke="%23d4ff28" stroke-width="2" stroke-dasharray="8 6"/>
    <rect x="90" y="45" width="160" height="22" fill="%23d4ff28"/>
    <text x="98" y="60" fill="%2312151a" font-family="monospace" font-size="11" font-weight="900">AI: ITC-LAP [96.2%]</text>
  </svg>`,

  pcb: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%2314171d"/>
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%231e232d" stroke="%23373f4e" stroke-width="2"/>
    <!-- PCB Board 1 (FR-4 Green) -->
    <g transform="translate(90, 70) rotate(-4)">
      <rect width="250" height="200" rx="6" fill="%23135200" stroke="%23237804" stroke-width="3"/>
      <!-- Trace lines -->
      <path d="M 20 30 L 70 30 L 90 60 L 150 60 M 30 150 L 90 150 L 120 120 L 200 120" stroke="%23d4b106" stroke-width="2" fill="none"/>
      <!-- Gold Fingers Edge -->
      <rect x="0" y="190" width="250" height="10" fill="%23faad14"/>
      <!-- SMD Chips & CPU Socket -->
      <rect x="110" y="70" width="65" height="65" rx="4" fill="%230c0e12" stroke="%2373d13d" stroke-width="1.5"/>
      <rect x="30" y="40" width="30" height="40" fill="%231f242e"/>
      <circle cx="50" cy="110" r="10" fill="%23262626" stroke="%238c8c8c" stroke-width="2"/>
      <circle cx="75" cy="110" r="10" fill="%23262626" stroke="%238c8c8c" stroke-width="2"/>
    </g>
    <!-- PCB Board 2 (Blue Server Board) -->
    <g transform="translate(280, 110) rotate(14)">
      <rect width="230" height="180" rx="6" fill="%23003a8c" stroke="%23096dd9" stroke-width="2"/>
      <path d="M 20 20 L 80 20 L 110 50 M 50 120 L 140 120" stroke="%23d4b106" stroke-width="2" fill="none"/>
      <rect x="80" y="50" width="70" height="70" rx="4" fill="%23141414" stroke="%23adc6ff" stroke-width="1"/>
    </g>
    <!-- HUD AI Target Bounding Box -->
    <rect x="70" y="55" width="460" height="270" fill="none" stroke="%23d4ff28" stroke-width="2" stroke-dasharray="8 6"/>
    <rect x="70" y="55" width="165" height="22" fill="%23d4ff28"/>
    <text x="78" y="70" fill="%2312151a" font-family="monospace" font-size="11" font-weight="900">AI: HGB-PCB [98.1%]</text>
  </svg>`,

  batteries: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%231b1717"/>
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%232b2121" stroke="%23523535" stroke-width="2"/>
    <!-- Swollen Pouch Battery 1 -->
    <g transform="translate(100, 90) rotate(-8)">
      <rect width="180" height="140" rx="16" fill="%233a3434" stroke="%23cf1322" stroke-width="3"/>
      <!-- Swelling bulge highlight -->
      <ellipse cx="90" cy="70" rx="70" ry="50" fill="%23594b4b" opacity="0.6"/>
      <text x="35" y="75" fill="%23ff7875" font-family="monospace" font-size="12" font-weight="bold">WARNING: SWOLLEN</text>
      <!-- Battery Terminals -->
      <rect x="30" y="-12" width="20" height="14" fill="%23d4b106"/>
      <rect x="130" y="-12" width="20" height="14" fill="%23595959"/>
    </g>
    <!-- 18650 Cylindrical Cells -->
    <g transform="translate(320, 110) rotate(18)">
      <rect width="50" height="150" rx="8" fill="%2313c2c2" stroke="%2308979c" stroke-width="2"/>
      <rect x="15" y="-6" width="20" height="8" rx="2" fill="%23d4b106"/>
      <rect width="50" height="150" rx="8" x="65" fill="%2352c41a" stroke="%23389e0d" stroke-width="2"/>
      <rect x="80" y="-6" width="20" height="8" rx="2" fill="%23d4b106"/>
    </g>
    <!-- Hazard Warning Overlay -->
    <rect x="80" y="60" width="440" height="260" fill="none" stroke="%23ff4d4f" stroke-width="2.5" stroke-dasharray="8 6"/>
    <rect x="80" y="60" width="190" height="24" fill="%23ff4d4f"/>
    <text x="88" y="76" fill="%23ffffff" font-family="monospace" font-size="11" font-weight="900">HAZARD: BAT-LIO [97.5%]</text>
  </svg>`,

  abs_plastic: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%23181a1f"/>
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%23232730" stroke="%23393f4e" stroke-width="2"/>
    <!-- Shredded casing pieces -->
    <g transform="translate(110, 80)">
      <polygon points="30,40 140,20 180,90 80,120 10,70" fill="%232b313d" stroke="%23546078" stroke-width="2"/>
      <polygon points="120,100 240,80 270,160 160,190" fill="%231f242e" stroke="%23434c5e" stroke-width="2"/>
      <polygon points="210,30 310,40 330,110 230,100" fill="%23363e4e" stroke="%23677591" stroke-width="2"/>
      <polygon points="60,140 150,130 180,210 90,220" fill="%232b313d" stroke="%23546078" stroke-width="2"/>
      <!-- Polymer imprint symbol -->
      <text x="65" y="85" fill="%238b9bb4" font-family="sans-serif" font-size="14" font-weight="bold">#7 ABS</text>
    </g>
    <!-- HUD AI Target Bounding Box -->
    <rect x="80" y="55" width="440" height="270" fill="none" stroke="%23d4ff28" stroke-width="2" stroke-dasharray="8 6"/>
    <rect x="80" y="55" width="165" height="22" fill="%23d4ff28"/>
    <text x="88" y="70" fill="%2312151a" font-family="monospace" font-size="11" font-weight="900">AI: POL-ABS [93.4%]</text>
  </svg>`,

  cables: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%23171a1d"/>
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%23242830" stroke="%233a414f" stroke-width="2"/>
    <!-- Coiled wire bundles -->
    <g transform="translate(120, 80)">
      <path d="M 40 130 C 20 40, 180 20, 240 70 C 300 120, 220 220, 120 200 C 40 180, 50 80, 130 60 C 210 40, 260 140, 190 190" stroke="%231890ff" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 50 140 C 30 50, 190 30, 250 80 C 310 130, 230 230, 130 210" stroke="%23fa8c16" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M 60 150 C 40 60, 200 40, 260 90" stroke="%23f5222d" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Stripped copper ends -->
      <circle cx="260" cy="90" r="6" fill="%23d46b08"/>
      <circle cx="190" cy="190" r="7" fill="%23d46b08"/>
    </g>
    <rect x="80" y="55" width="440" height="270" fill="none" stroke="%23d4ff28" stroke-width="2" stroke-dasharray="8 6"/>
    <rect x="80" y="55" width="165" height="22" fill="%23d4ff28"/>
    <text x="88" y="70" fill="%2312151a" font-family="monospace" font-size="11" font-weight="900">AI: NFM-COP [95.0%]</text>
  </svg>`,

  crt: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="%2317181c"/>
    <rect x="40" y="30" width="520" height="340" rx="12" fill="%2323262d" stroke="%233a3e4a" stroke-width="2"/>
    <!-- CRT Monitor Chassis -->
    <g transform="translate(150, 70)">
      <polygon points="30,30 270,30 220,210 80,210" fill="%23181b22" stroke="%23565e70" stroke-width="3"/>
      <rect x="50" y="45" width="200" height="145" rx="12" fill="%230c0e12" stroke="%23303642" stroke-width="2"/>
      <path d="M 80 80 Q 150 60 220 80" stroke="%23434d5d" stroke-width="2" fill="none"/>
      <!-- Leaded Glass Warning -->
      <text x="75" y="125" fill="%23ff7875" font-family="monospace" font-size="12" font-weight="bold">LEADED GLASS CRT</text>
    </g>
    <rect x="80" y="50" width="440" height="280" fill="none" stroke="%23ff4d4f" stroke-width="2" stroke-dasharray="8 6"/>
    <rect x="80" y="50" width="170" height="22" fill="%23ff4d4f"/>
    <text x="88" y="66" fill="%23ffffff" font-family="monospace" font-size="11" font-weight="900">AI: DIS-CRT [96.0%]</text>
  </svg>`
};
