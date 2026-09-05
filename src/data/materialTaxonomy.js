// PDR Dataset 1: Material Dataset (Taxonomy & Hazardous Attributes)
// Reference: E-Waste Management Rules 2022 & CPCB Schedule I

export const MATERIAL_TAXONOMY = [
  {
    id: "smartphones",
    category: "Telecom & Consumer",
    name: "Mobile Phones & Smartphones",
    shortCode: "TEL-MOB",
    unit: "kg",
    baseBenchmarkRatePerKg: 380,
    rateRange: { min: 340, max: 420 },
    icon: "Smartphone",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Lithium-Ion Battery", "Cobalt/Lithium Fire Risk"],
    safetyWarning: "Ensure lithium-ion battery is intact. Do not puncture, expose to flame, or crush.",
    visualCues: ["Glass front screen", "Rear camera module", "USB-C/Lightning connector"],
    sampleImages: [
      { id: "mob-1", label: "Broken Android Smartphones (Lot 5kg)", weightEst: 5.0, estUnits: 25 },
      { id: "mob-2", label: "Feature Phones Mixed (Lot 3kg)", weightEst: 3.0, estUnits: 30 }
    ]
  },
  {
    id: "laptops",
    category: "IT & Computing",
    name: "Laptops & Notebooks",
    shortCode: "ITC-LAP",
    unit: "kg",
    baseBenchmarkRatePerKg: 210,
    rateRange: { min: 190, max: 240 },
    icon: "Laptop",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Built-in Battery", "Mercury/CCFL in older LCDs"],
    safetyWarning: "Keep hinges and casing closed. Do not attempt unvented cell extraction.",
    visualCues: ["Foldable chassis", "Keyboard trackpad", "Display lid", "Motherboard casing"],
    sampleImages: [
      { id: "lap-1", label: "Mixed Core-i Series Laptops (Lot 12.4kg)", weightEst: 12.4, estUnits: 6 },
      { id: "lap-2", label: "Stripped Laptop Chassis (Lot 8.5kg)", weightEst: 8.5, estUnits: 5 }
    ]
  },
  {
    id: "pcb",
    category: "High-Grade Boards",
    name: "Mixed PCBs & Motherboards",
    shortCode: "HGB-PCB",
    unit: "kg",
    baseBenchmarkRatePerKg: 350,
    rateRange: { min: 310, max: 420 },
    icon: "Cpu",
    hazardLevel: "HIGH",
    hazardFlags: ["Lead Solder", "Brominated Flame Retardants (BFR)", "Acid Leaching Risk"],
    safetyWarning: "STRICT WARNING: Do not attempt open-pan burning or acid bath extraction. Route directly to authorized CPCB refiners.",
    visualCues: ["Green/Blue FR-4 substrate", "SMD chips", "Gold fingers", "Capacitors"],
    sampleImages: [
      { id: "pcb-1", label: "High-Grade Server PCBs (Lot 15kg)", weightEst: 15.0, estUnits: 45 },
      { id: "pcb-2", label: "Telecom Switching Boards (Lot 22kg)", weightEst: 22.0, estUnits: 30 }
    ]
  },
  {
    id: "batteries",
    category: "Energy Storage",
    name: "Li-Ion & Lead Acid Batteries",
    shortCode: "BAT-LIO",
    unit: "kg",
    baseBenchmarkRatePerKg: 95,
    rateRange: { min: 80, max: 110 },
    icon: "BatteryCharging",
    hazardLevel: "CRITICAL",
    hazardFlags: ["Thermal Runaway Hazard", "Electrolyte Spillage", "Toxic Fumes"],
    safetyWarning: "CRITICAL SAFETY: Store in non-conductive, fire-retardant dry container. Never puncture or short terminals.",
    visualCues: ["Pouch cell", "Cylindrical 18650 cells", "Prismatic packs", "Caution labels"],
    sampleImages: [
      { id: "bat-1", label: "Swollen & Loose Li-Ion Pouches (Lot 6kg)", weightEst: 6.0, estUnits: 60 },
      { id: "bat-2", label: "E-Bike Battery Packs (Lot 14kg)", weightEst: 14.0, estUnits: 4 }
    ]
  },
  {
    id: "cables",
    category: "Ferrous & Non-Ferrous",
    name: "Copper Wires & Wiring Harnesses",
    shortCode: "NFM-COP",
    unit: "kg",
    baseBenchmarkRatePerKg: 180,
    rateRange: { min: 165, max: 205 },
    icon: "Cable",
    hazardLevel: "LOW",
    hazardFlags: ["Dioxin Emission on Open Burning"],
    safetyWarning: "DO NOT BURN insulation wire in open air (violates CPCB Clean Air norms). Mechanically strip or route to shredders.",
    visualCues: ["PVC insulated bundles", "Braided copper sheathing", "Molded plugs"],
    sampleImages: [
      { id: "cbl-1", label: "PVC Insulated Copper Wire Spool (Lot 18kg)", weightEst: 18.0, estUnits: 1 },
      { id: "cbl-2", label: "Power & Telecom Patch Cords (Lot 9.5kg)", weightEst: 9.5, estUnits: 40 }
    ]
  },
  {
    id: "crt",
    category: "Displays & Monitors",
    name: "CRT Tubes & Display Monitors",
    shortCode: "DIS-CRT",
    unit: "kg",
    baseBenchmarkRatePerKg: 45,
    rateRange: { min: 35, max: 55 },
    icon: "Tv",
    hazardLevel: "HIGH",
    hazardFlags: ["Leaded Funnel Glass (approx 2kg lead per tube)", "Vacuum Implosion Risk"],
    safetyWarning: "HANDLE WITH GLOVES: Avoid striking neck of tube. High risk of leaded dust inhalation upon breakage.",
    visualCues: ["Heavy glass funnel", "Electron gun neck", "Phosphor shadow mask"],
    sampleImages: [
      { id: "crt-1", label: "Heavy 17-inch CRT Monitors (Lot 28kg)", weightEst: 28.0, estUnits: 2 },
      { id: "crt-2", label: "Mixed CRT chassis without plastic (Lot 40kg)", weightEst: 40.0, estUnits: 3 }
    ]
  },
  {
    id: "abs_plastic",
    category: "Mixed Plastics & Polymers",
    name: "Mixed Plastics & ABS Casings",
    shortCode: "POL-MIX",
    unit: "kg",
    baseBenchmarkRatePerKg: 30,
    rateRange: { min: 26, max: 34 },
    icon: "Layers",
    hazardLevel: "LOW",
    hazardFlags: ["Microplastic Dust Risk", "Flame Retardants (BFR in older chassis)"],
    safetyWarning: "Keep dry and separated from PVC plastics. Avoid open burning.",
    visualCues: ["Matte black/grey textured shell", "Flame retardant markings", "Snap-fit clips"],
    sampleImages: [
      { id: "abs-1", label: "Sorted ABS Monitor & CPU Casings (Lot 18kg)", weightEst: 18.0, estUnits: 12 },
      { id: "abs-2", label: "Mixed Electronics Plastic Flakes (Lot 25kg)", weightEst: 25.0, estUnits: 1 }
    ]
  },
  {
    id: "feature_phones",
    category: "Telecom & Consumer",
    name: "Keypad & Feature Phones",
    shortCode: "TEL-FEA",
    unit: "kg",
    baseBenchmarkRatePerKg: 260,
    rateRange: { min: 230, max: 290 },
    icon: "Smartphone",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Removable Li-Ion Battery"],
    safetyWarning: "Remove swollen batteries before bulk bagging.",
    visualCues: ["Tactile numeric keypad", "Small color/monochrome screen", "Plastic back cover"],
    sampleImages: [
      { id: "fea-1", label: "Mixed 2G/3G Keypad Mobiles (Lot 4kg)", weightEst: 4.0, estUnits: 45 }
    ]
  },
  {
    id: "tablets",
    category: "Telecom & Consumer",
    name: "Tablets & E-Readers",
    shortCode: "TEL-TAB",
    unit: "kg",
    baseBenchmarkRatePerKg: 310,
    rateRange: { min: 280, max: 340 },
    icon: "Tablet",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Large Surface Li-Po Battery"],
    safetyWarning: "Do not bend or twist tablet chassis.",
    visualCues: ["7-12 inch glass screen", "Slim aluminum or plastic enclosure"],
    sampleImages: [
      { id: "tab-1", label: "Damaged Screen Android Tablets (Lot 6kg)", weightEst: 6.0, estUnits: 15 }
    ]
  },
  {
    id: "desktops",
    category: "IT & Computing",
    name: "Desktop PCs & CPU Towers",
    shortCode: "ITC-DESK",
    unit: "kg",
    baseBenchmarkRatePerKg: 160,
    rateRange: { min: 140, max: 180 },
    icon: "Cpu",
    hazardLevel: "MEDIUM",
    hazardFlags: ["SMPS Capacitor Residual Charge", "Sharp Sheet Metal"],
    safetyWarning: "Wear safety gloves to prevent lacerations from sheet metal edges.",
    visualCues: ["ATX metal chassis", "Front optical drive slots", "Rear I/O shield"],
    sampleImages: [
      { id: "dsk-1", label: "Mixed Tower Desktop Units (Lot 25kg)", weightEst: 25.0, estUnits: 3 }
    ]
  },
  {
    id: "cpus",
    category: "High-Grade Boards",
    name: "Microprocessors & IC Chips",
    shortCode: "HGB-CPU",
    unit: "kg",
    baseBenchmarkRatePerKg: 1250,
    rateRange: { min: 1100, max: 1450 },
    icon: "Cpu",
    hazardLevel: "HIGH",
    hazardFlags: ["Precious Metals (Gold/Palladium)", "Acid Refinement Hazard"],
    safetyWarning: "STRICT WARNING: Do not attempt acid immersion leaching. Route to certified smelters.",
    visualCues: ["Ceramic or green substrate package", "Gold pins or contact pads", "Metal heat spreader"],
    sampleImages: [
      { id: "cpu-1", label: "Mixed Intel/AMD Processors (Lot 2kg)", weightEst: 2.0, estUnits: 50 }
    ]
  },
  {
    id: "ram",
    category: "High-Grade Boards",
    name: "RAM Memory Sticks (Gold Fingers)",
    shortCode: "HGB-RAM",
    unit: "kg",
    baseBenchmarkRatePerKg: 850,
    rateRange: { min: 780, max: 940 },
    icon: "Cpu",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Gold plating", "Lead solder traces"],
    safetyWarning: "Keep dry in antistatic bins.",
    visualCues: ["Slender green/blue PCB stick", "Gold edge connector fingers", "BGA/TSOP chips"],
    sampleImages: [
      { id: "ram-1", label: "Mixed DDR3/DDR4 RAM Sticks (Lot 3kg)", weightEst: 3.0, estUnits: 150 }
    ]
  },
  {
    id: "storage",
    category: "IT & Computing",
    name: "Hard Disk Drives (HDD) & SSDs",
    shortCode: "ITC-STOR",
    unit: "kg",
    baseBenchmarkRatePerKg: 140,
    rateRange: { min: 125, max: 160 },
    icon: "HardDrive",
    hazardLevel: "LOW",
    hazardFlags: ["Neodymium Magnets", "Aluminum Castings"],
    safetyWarning: "Do not attempt open disassembly near sensitive electronics.",
    visualCues: ["Cast aluminum casing", "SATA/IDE interface pins", "Spindle motor hub"],
    sampleImages: [
      { id: "sto-1", label: "Mixed 3.5-inch Desktop HDDs (Lot 15kg)", weightEst: 15.0, estUnits: 30 }
    ]
  },
  {
    id: "lead_acid",
    category: "Energy Storage",
    name: "Inverter & Auto Lead-Acid Batteries",
    shortCode: "BAT-LEAD",
    unit: "kg",
    baseBenchmarkRatePerKg: 78,
    rateRange: { min: 70, max: 86 },
    icon: "BatteryCharging",
    hazardLevel: "CRITICAL",
    hazardFlags: ["Sulfuric Acid Spill", "Heavy Lead Toxicity"],
    safetyWarning: "CRITICAL HAZARD: Must remain upright. Keep neutralizer (baking soda) ready for acid leaks.",
    visualCues: ["Heavy rectangular plastic container", "Top lead terminal posts", "Vent caps"],
    sampleImages: [
      { id: "sla-1", label: "Tubular Inverter Batteries (Lot 45kg)", weightEst: 45.0, estUnits: 1 }
    ]
  },
  {
    id: "ups_smps",
    category: "Power Electronics",
    name: "UPS Inverters & SMPS Units",
    shortCode: "PWR-UPS",
    unit: "kg",
    baseBenchmarkRatePerKg: 65,
    rateRange: { min: 55, max: 75 },
    icon: "Zap",
    hazardLevel: "MEDIUM",
    hazardFlags: ["High Voltage Capacitors", "Copper Wound Transformer"],
    safetyWarning: "Discharge main capacitors before handling internal boards.",
    visualCues: ["Perforated metal box", "Heavy internal copper transformer", "Power socket receptacles"],
    sampleImages: [
      { id: "ups-1", label: "Home UPS Units without Battery (Lot 18kg)", weightEst: 18.0, estUnits: 2 }
    ]
  },
  {
    id: "chargers",
    category: "Accessories",
    name: "Power Adapters & Phone Chargers",
    shortCode: "ACC-CHG",
    unit: "kg",
    baseBenchmarkRatePerKg: 90,
    rateRange: { min: 80, max: 105 },
    icon: "Plug",
    hazardLevel: "LOW",
    hazardFlags: ["Copper windings", "Ferrite cores"],
    safetyWarning: "Inspect for exposed conductors.",
    visualCues: ["Wall plug with molded cord", "Black brick housing", "DC barrel or USB output"],
    sampleImages: [
      { id: "chg-1", label: "Mixed Phone & Laptop Adapters (Lot 8kg)", weightEst: 8.0, estUnits: 40 }
    ]
  },
  {
    id: "lcd_led",
    category: "Displays & Monitors",
    name: "LED & LCD Flat Monitors / TVs",
    shortCode: "DIS-FLAT",
    unit: "kg",
    baseBenchmarkRatePerKg: 85,
    rateRange: { min: 70, max: 100 },
    icon: "Tv",
    hazardLevel: "MEDIUM",
    hazardFlags: ["CCFL Mercury Backlight in older screens", "Indium Tin Oxide Glass"],
    safetyWarning: "Avoid panel cracking to prevent mercury vapor release from CCFL tubes.",
    visualCues: ["Slim flat screen", "HDMI/VGA ports", "Stand mount bracket"],
    sampleImages: [
      { id: "lcd-1", label: "Broken Screen LED Monitors (Lot 16kg)", weightEst: 16.0, estUnits: 4 }
    ]
  },
  {
    id: "printers",
    category: "Office Equipment",
    name: "Printers, Scanners & Copiers",
    shortCode: "OFF-PRN",
    unit: "kg",
    baseBenchmarkRatePerKg: 55,
    rateRange: { min: 45, max: 65 },
    icon: "Printer",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Toner Particulate Inhalation Hazard", "Stepper Motors"],
    safetyWarning: "Keep toner cartridges sealed to prevent black particulate inhalation.",
    visualCues: ["Paper feed tray", "Glass flatbed scanner lid", "Roller mechanism"],
    sampleImages: [
      { id: "prn-1", label: "Mixed Laser & Inkjet Printers (Lot 22kg)", weightEst: 22.0, estUnits: 3 }
    ]
  },
  {
    id: "air_conditioner",
    category: "White Goods",
    name: "AC Units & Copper Compressors",
    shortCode: "WHT-AC",
    unit: "kg",
    baseBenchmarkRatePerKg: 120,
    rateRange: { min: 105, max: 135 },
    icon: "Wind",
    hazardLevel: "HIGH",
    hazardFlags: ["Refrigerant Gas (R22/R32/R410A) Release", "Heavy Copper Compressor"],
    safetyWarning: "DO NOT CUT copper lines without certified refrigerant recovery.",
    visualCues: ["Aluminum fin heat exchanger", "Heavy sealed compressor dome", "Fan blades"],
    sampleImages: [
      { id: "ac-1", label: "Split AC Outdoor Compressors (Lot 32kg)", weightEst: 32.0, estUnits: 1 }
    ]
  },
  {
    id: "refrigerator",
    category: "White Goods",
    name: "Refrigerators & Compressors",
    shortCode: "WHT-FRG",
    unit: "kg",
    baseBenchmarkRatePerKg: 75,
    rateRange: { min: 65, max: 85 },
    icon: "Box",
    hazardLevel: "HIGH",
    hazardFlags: ["CFC/HFC Refrigerants", "Polyurethane Foam"],
    safetyWarning: "Recover compressor oils and refrigerants in closed systems.",
    visualCues: ["Insulated metal cabinet", "Black compressor pot at rear", "Condenser coil grid"],
    sampleImages: [
      { id: "frg-1", label: "Single Door Fridge Body (Lot 42kg)", weightEst: 42.0, estUnits: 1 }
    ]
  },
  {
    id: "washing_machine",
    category: "White Goods",
    name: "Washing Machines & Motors",
    shortCode: "WHT-WASH",
    unit: "kg",
    baseBenchmarkRatePerKg: 60,
    rateRange: { min: 50, max: 70 },
    icon: "RotateCw",
    hazardLevel: "LOW",
    hazardFlags: ["Heavy Induction Motors", "Steel Drum"],
    safetyWarning: "Disconnect capacitors before dismantling motor assembly.",
    visualCues: ["Top or front loading drum", "Heavy electric motor", "Outer enameled shell"],
    sampleImages: [
      { id: "wsh-1", label: "Top-Load Washing Machine (Lot 28kg)", weightEst: 28.0, estUnits: 1 }
    ]
  },
  {
    id: "microwave",
    category: "Small Appliances",
    name: "Microwave Ovens & Magnetrons",
    shortCode: "WHT-MIC",
    unit: "kg",
    baseBenchmarkRatePerKg: 50,
    rateRange: { min: 42, max: 60 },
    icon: "Radio",
    hazardLevel: "HIGH",
    hazardFlags: ["Beryllium Oxide Ceramic in Magnetron", "High Voltage Capacitor"],
    safetyWarning: "NEVER CRUSH or file the pink ceramic insulator on magnetron tube (Beryllium toxicity).",
    visualCues: ["Shielded glass door", "Heavy step-up transformer", "Magnetron assembly"],
    sampleImages: [
      { id: "mic-1", label: "Countertop Microwave Ovens (Lot 14kg)", weightEst: 14.0, estUnits: 1 }
    ]
  },
  {
    id: "networking",
    category: "Telecom & Consumer",
    name: "Routers, Modems & Setup Boxes",
    shortCode: "NET-RTR",
    unit: "kg",
    baseBenchmarkRatePerKg: 95,
    rateRange: { min: 80, max: 110 },
    icon: "Wifi",
    hazardLevel: "LOW",
    hazardFlags: ["Internal PCB", "Power Adapter"],
    safetyWarning: "Standard e-waste protocol.",
    visualCues: ["Plastic housing with antennas", "RJ45 LAN ports", "LED indicator array"],
    sampleImages: [
      { id: "net-1", label: "Mixed Wi-Fi Routers & Set-Top Boxes (Lot 10kg)", weightEst: 10.0, estUnits: 18 }
    ]
  },
  {
    id: "solar_panels",
    category: "Renewables",
    name: "Solar PV Panels & Inverters",
    shortCode: "REN-SOL",
    unit: "kg",
    baseBenchmarkRatePerKg: 40,
    rateRange: { min: 32, max: 48 },
    icon: "Sun",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Tempered Glass", "Lead/Cadmium Contact Pastes", "EVA Encapsulant"],
    safetyWarning: "Handle broken glass with cut-resistant gloves.",
    visualCues: ["Aluminum perimeter frame", "Blue/Black silicon wafer grid", "Rear junction box"],
    sampleImages: [
      { id: "sol-1", label: "Damaged Monocrystalline Solar Panel (Lot 20kg)", weightEst: 20.0, estUnits: 1 }
    ]
  },
  {
    id: "motors_magnets",
    category: "Motors & Rare Earths",
    name: "Motors & Magnet Assemblies",
    shortCode: "EEM-MOT",
    unit: "kg",
    baseBenchmarkRatePerKg: 120,
    rateRange: { min: 105, max: 140 },
    icon: "RotateCw",
    hazardLevel: "MEDIUM",
    hazardFlags: ["Strong Magnetic Pinch Hazard", "Rare Earth Elements (Neodymium NdFeB)"],
    safetyWarning: "Keep away from pacemakers and magnetic media. Pinch hazard from neodymium magnets.",
    visualCues: ["Cylindrical motor stator", "Copper windings", "Shiny nickel-plated neodymium magnets"],
    sampleImages: [
      { id: "mot-1", label: "Server Stators & HDD Voice Coils (Lot 25kg)", weightEst: 25.0, estUnits: 40 }
    ]
  },
  {
    id: "lcd_panels",
    category: "Displays & Monitors",
    name: "LCD & LED Display Panels",
    shortCode: "DIS-LCD",
    cpcbCode: "ITEW12",
    unit: "kg",
    baseBenchmarkRatePerKg: 65,
    rateRange: { min: 55, max: 78 },
    icon: "Monitor",
    hazardLevel: "HIGH",
    hazardFlags: ["Mercury Vapor (in CCFL Backlights)", "Indium Tin Oxide (ITO)", "Liquid Crystal Fluorinated Compounds"],
    safetyWarning: "DO NOT CRUSH OR BEND DISPLAY GLASS. Ruptured CCFL cold cathode lamps release toxic elemental mercury vapor. Keep panels flat and wear cut-resistant safety gloves.",
    criticalRawMaterials: ["Indium (In)", "Tin (Sn)", "Gallium (Ga)", "Optical Glass"],
    visualCues: ["Thin flat glass sandwich", "Ribbon cable / LVDS connector", "Polarizer optical film", "Edge-lit backlight frame"],
    sampleImages: [
      { id: "lcd-1", label: "Broken Flat Panel TV & Monitor LCDs (Lot 18kg)", weightEst: 18.0, estUnits: 6 },
      { id: "lcd-2", label: "Scrap Laptop Screen Assemblies (Lot 8kg)", weightEst: 8.0, estUnits: 16 }
    ]
  },
  {
    id: "unknown",
    category: "Unclassified Lot",
    name: "Mixed Unsorted Electronics",
    shortCode: "UNC-MIX",
    unit: "kg",
    baseBenchmarkRatePerKg: 110,
    rateRange: { min: 85, max: 135 },
    icon: "HelpCircle",
    hazardLevel: "VARIABLE",
    hazardFlags: ["Unknown chemical composition", "Assisted manual check required"],
    safetyWarning: "PDR Protocol: Unknown category allowed. Escalate to assisted recycler inspection without forced AI classification.",
    visualCues: ["Mixed components", "Tangled parts", "Unidentifiable casing"],
    sampleImages: [
      { id: "unk-1", label: "Mixed Shed E-Scrap Sack (Lot 35kg)", weightEst: 35.0, estUnits: 1 }
    ]
  }
];
