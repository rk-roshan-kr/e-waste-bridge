-- ============================================================================
-- E-Waste Bridge (SIH 2026 PS-2) - Relational Database Schema (ANSI SQL / SQLite)
-- Compliant with E-Waste (Management) Rules 2022 & CPCB Schedule-I Specifications
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. MATERIAL TAXONOMY TABLE
-- Stores regulated e-waste categories, hazard classifications, and benchmark metrics
CREATE TABLE IF NOT EXISTS materials (
    material_id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    sub_category VARCHAR(64) NOT NULL,
    cpcb_code VARCHAR(32) NOT NULL,
    name_en VARCHAR(128) NOT NULL,
    name_hi VARCHAR(128) NOT NULL,
    name_mr VARCHAR(128) NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    base_benchmark_rate DECIMAL(10, 2) NOT NULL,
    min_market_rate DECIMAL(10, 2) NOT NULL,
    max_market_rate DECIMAL(10, 2) NOT NULL,
    hazard_level VARCHAR(16) CHECK (hazard_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    hazard_flags TEXT, -- JSON array of specific hazard strings
    safety_warning_en TEXT,
    safety_warning_hi TEXT,
    safety_warning_mr TEXT,
    critical_raw_materials TEXT, -- e.g. ["Neodymium", "Lithium", "Cobalt", "Gold", "Copper"]
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRICE BENCHMARKS TABLE
-- Regional floor prices, volatility metrics, and prevailing buying rates
CREATE TABLE IF NOT EXISTS price_benchmarks (
    benchmark_id VARCHAR(64) PRIMARY KEY,
    material_id VARCHAR(64) NOT NULL,
    region_code VARCHAR(32) NOT NULL, -- e.g. 'MH-MMR', 'MH-PUN', 'DL-NCR'
    region_name VARCHAR(128) NOT NULL,
    prevailing_buying_rate DECIMAL(10, 2) NOT NULL,
    min_rate DECIMAL(10, 2) NOT NULL,
    max_rate DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    price_trend VARCHAR(16) CHECK (price_trend IN ('UP_STRONG', 'UP_MODERATE', 'STABLE', 'DOWN_MODERATE', 'DOWN_STRONG')),
    trend_percentage DECIMAL(5, 2) DEFAULT 0.0,
    freshness_score DECIMAL(3, 2) DEFAULT 0.95,
    sample_transaction_count INT DEFAULT 0,
    source_index VARCHAR(128) NOT NULL,
    effective_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    valid_until DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE
);

-- 3. PRICE HISTORY TIME-SERIES TABLE
-- Powers 7-day, 30-day, and 90-day price trend analysis and volatility forecasting
CREATE TABLE IF NOT EXISTS price_history (
    history_id VARCHAR(64) PRIMARY KEY,
    material_id VARCHAR(64) NOT NULL,
    recorded_date DATE NOT NULL,
    average_rate DECIMAL(10, 2) NOT NULL,
    high_rate DECIMAL(10, 2) NOT NULL,
    low_rate DECIMAL(10, 2) NOT NULL,
    volume_traded_kg DECIMAL(12, 2) DEFAULT 0.0,
    active_recycler_bids INT DEFAULT 0,
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE
);

-- 4. AUTHORIZED RECYCLERS TABLE
-- CPCB/SPCB authorized recyclers, processing capacities, and logistics capability
CREATE TABLE IF NOT EXISTS recyclers (
    recycler_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    badge VARCHAR(64) NOT NULL,
    cpcb_registration_no VARCHAR(64) UNIQUE NOT NULL,
    registration_valid_till DATE NOT NULL,
    status VARCHAR(32) CHECK (status IN ('VERIFIED_ACTIVE', 'AUDIT_PENDING', 'SUSPENDED')),
    facility_location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    contact_phone VARCHAR(32),
    contact_email VARCHAR(128),
    rating DECIMAL(2, 1) DEFAULT 4.5,
    intake_capacity_kg_day INT NOT NULL,
    current_intake_kg INT DEFAULT 0,
    pickup_capability BOOLEAN DEFAULT 1,
    pickup_vehicle_type VARCHAR(64),
    pickup_radius_km INT DEFAULT 25,
    accepted_materials TEXT NOT NULL, -- JSON array of material_ids
    settlement_modes TEXT NOT NULL, -- JSON array ['CASH_IMMEDIATE', 'UPI_INSTANT']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. COLLECTOR PROFILES TABLE (Minimalist KYC-Free Profile)
-- Non-invasive profile preserving waste-picker privacy while enabling credit history
CREATE TABLE IF NOT EXISTS collectors (
    collector_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(64) DEFAULT 'Informal Scrap Collector',
    operating_location VARCHAR(128) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    preferred_language VARCHAR(8) DEFAULT 'mr', -- 'mr', 'hi', 'en'
    compliance_tier VARCHAR(64) DEFAULT 'Tier 2 Active (Field Aggregator)',
    total_lots_completed INT DEFAULT 0,
    monthly_weight_kg DECIMAL(10, 2) DEFAULT 0.0,
    monthly_earnings_inr DECIMAL(12, 2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. LOTS (TRANSACTIONS) TABLE
-- Digital lots created by collectors, matched with recyclers, and tracked to final settlement
CREATE TABLE IF NOT EXISTS lots (
    lot_id VARCHAR(64) PRIMARY KEY,
    collector_id VARCHAR(64) NOT NULL,
    material_id VARCHAR(64) NOT NULL,
    sub_category VARCHAR(64) NOT NULL,
    cpcb_category_code VARCHAR(32) NOT NULL,
    material_name VARCHAR(128) NOT NULL,
    material_description TEXT,
    condition VARCHAR(32) CHECK (condition IN ('INTACT', 'PARTIAL_DISMANTLED', 'SCRAP', 'HAZARDOUS_RISK')),
    source_type VARCHAR(32) CHECK (source_type IN ('HOUSEHOLD', 'COMMERCIAL_OFFICE', 'INFORMAL_AGGREGATOR', 'INSTITUTIONAL')),
    photo_reference TEXT,
    reported_weight_kg DECIMAL(10, 2) NOT NULL,
    actual_intake_weight_kg DECIMAL(10, 2),
    weight_variance_kg DECIMAL(10, 2),
    estimated_value DECIMAL(10, 2) NOT NULL,
    quoted_price_per_kg DECIMAL(10, 2) NOT NULL,
    final_net_payout DECIMAL(10, 2),
    selected_recycler_id VARCHAR(64),
    selected_recycler_name VARCHAR(128),
    status VARCHAR(32) CHECK (status IN ('DRAFT', 'OFFER_PENDING', 'ACCEPTED', 'IN_TRANSIT', 'WEIGHBRIDGE_VERIFIED', 'SETTLED', 'CLOSED')),
    payment_status VARCHAR(32) CHECK (payment_status IN ('PENDING', 'HELD_IN_ESCROW', 'CASH_SETTLED', 'UPI_TRANSFERRED')),
    payment_mode VARCHAR(32) DEFAULT 'CASH_IMMEDIATE',
    collection_location VARCHAR(128) NOT NULL,
    handover_location VARCHAR(128),
    handover_lat DECIMAL(10, 6), -- Statutory CPCB Physical Verification GPS Latitude
    handover_lng DECIMAL(10, 6), -- Statutory CPCB Physical Verification GPS Longitude
    handover_accuracy_m DECIMAL(6, 2), -- Hardware GNSS circular error probable (CEP) radius in meters
    gps_timestamp TIMESTAMP, -- Tamper-evident hardware timestamp of physical custody handover
    gps_fix_type VARCHAR(32) DEFAULT 'HARDWARE_GNSS_L1_L5', -- 'HARDWARE_GNSS_L1_L5', 'NETWORK_ASSISTED_GPS', 'CELL_TOWER_TRILATERAL'
    handover_reference_no VARCHAR(64),
    form6_manifest_url TEXT,
    qr_code_payload TEXT,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collector_id) REFERENCES collectors(collector_id),
    FOREIGN KEY (material_id) REFERENCES materials(material_id),
    FOREIGN KEY (selected_recycler_id) REFERENCES recyclers(recycler_id)
);

-- 7. TRACEABILITY EVENT LOG (Immutable Audit Stream)
-- Append-only event ledger tracking CPCB supply chain custody from pickup to smelter
CREATE TABLE IF NOT EXISTS traceability_events (
    event_id VARCHAR(64) PRIMARY KEY,
    lot_id VARCHAR(64) NOT NULL,
    step VARCHAR(64) NOT NULL, -- e.g. 'CREATED', 'MATCHED', 'PICKUP_DISPATCHED', 'INTAKE_VERIFIED', 'SETTLED'
    agent_name VARCHAR(128) NOT NULL,
    agent_role VARCHAR(64) NOT NULL,
    location VARCHAR(128),
    latitude DECIMAL(10, 6), -- Event GPS Latitude
    longitude DECIMAL(10, 6), -- Event GPS Longitude
    gps_accuracy_m DECIMAL(6, 2), -- Accuracy radius in meters
    gps_fix_type VARCHAR(32) DEFAULT 'HARDWARE_GNSS_L1_L5',
    digital_signature VARCHAR(128),
    event_note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lot_id) REFERENCES lots(lot_id) ON DELETE CASCADE
);

-- 8. STANDING BUYER DEMAND QUOTAS
-- Procurement tenders and reverse-bids from authorized recyclers
CREATE TABLE IF NOT EXISTS buyer_demands (
    demand_id VARCHAR(64) PRIMARY KEY,
    recycler_id VARCHAR(64) NOT NULL,
    material_id VARCHAR(64) NOT NULL,
    required_quantity_kg INT NOT NULL,
    fulfilled_quantity_kg INT DEFAULT 0,
    offered_rate_per_kg DECIMAL(10, 2) NOT NULL,
    pickup_radius_km INT DEFAULT 20,
    status VARCHAR(32) DEFAULT 'OPEN',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recycler_id) REFERENCES recyclers(recycler_id),
    FOREIGN KEY (material_id) REFERENCES materials(material_id)
);

-- 9. ANOMALY AUDIT LOGS
-- Outliers identified by AI/ML rules (GPS distance, weight variance, abnormal price bids)
CREATE TABLE IF NOT EXISTS anomaly_logs (
    anomaly_id VARCHAR(64) PRIMARY KEY,
    lot_id VARCHAR(64) NOT NULL,
    rule_code VARCHAR(32) NOT NULL, -- e.g. 'WEIGHT_DEVIATION_HIGH', 'PRICE_BELOW_BENCHMARK'
    severity VARCHAR(16) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    flagged_value VARCHAR(64),
    expected_range VARCHAR(64),
    resolution_status VARCHAR(32) DEFAULT 'PENDING_INSPECTION',
    resolved_by VARCHAR(128),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lot_id) REFERENCES lots(lot_id) ON DELETE CASCADE
);

-- INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_lots_collector ON lots(collector_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_material ON lots(material_id);
CREATE INDEX IF NOT EXISTS idx_traceability_lot ON traceability_events(lot_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_material_region ON price_benchmarks(material_id, region_code);
CREATE INDEX IF NOT EXISTS idx_history_material_date ON price_history(material_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_demands_recycler ON buyer_demands(recycler_id);
