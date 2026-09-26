"""
Script to generate and seed 100 realistic products and corresponding inventory records for StockSense.
Creates database/004_test_data.sql and applies it idempotently.
"""

import sys
from decimal import Decimal
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.core.database import SessionLocal, engine

# Existing category IDs
CAT_RAW_MATERIALS = "10000000-0000-0000-0000-000000000001"
CAT_FINISHED_GOODS = "10000000-0000-0000-0000-000000000002"
CAT_ELECTRONICS = "10000000-0000-0000-0000-000000000003"
CAT_OFFICE_SUPPLIES = "10000000-0000-0000-0000-000000000004"
CAT_SAFETY_EQUIPMENT = "10000000-0000-0000-0000-000000000005"

# Existing location IDs
LOC_MAIN_STOCK = "30000000-0000-0000-0000-000000000001"      # Main Warehouse (WH-MAIN)
LOC_RACK_A = "30000000-0000-0000-0000-000000000002"          # Main Warehouse (WH-MAIN)
LOC_RACK_B = "30000000-0000-0000-0000-000000000003"          # Main Warehouse (WH-MAIN)
LOC_PROD_FLOOR = "30000000-0000-0000-0000-000000000005"      # Production Warehouse (WH-PROD)
LOC_PROD_FG = "30000000-0000-0000-0000-000000000006"         # Production Warehouse (WH-PROD)

USER_ADMIN = "00000000-0000-0000-0000-000000000001"

# Define the 100 products (20 in each category)
# format: (idx, name, sku_num, category_id, uom, unit_cost, reorder_level, reorder_qty, on_hand, reserved, location_id)
PRODUCTS_DATA = [
    # -------------------------------------------------------------
    # 1. Raw Materials (1-20)
    # -------------------------------------------------------------
    # Healthy (1-12)
    (1, "Stainless Steel Hex Bolt M8", "TEST-001", CAT_RAW_MATERIALS, "UNIT", 45.00, 100, 500, 450, 0, LOC_MAIN_STOCK),
    (2, "Galvanized Hex Nut M8", "TEST-002", CAT_RAW_MATERIALS, "UNIT", 18.50, 200, 1000, 850, 0, LOC_MAIN_STOCK),
    (3, "Copper Sheet 2mm", "TEST-003", CAT_RAW_MATERIALS, "KG", 680.00, 40, 150, 180, 0, LOC_MAIN_STOCK),
    (4, "Aluminum Extrusion Rod 20mm", "TEST-004", CAT_RAW_MATERIALS, "METER", 320.00, 50, 200, 220, 0, LOC_MAIN_STOCK),
    (5, "Cold Rolled Steel Plate 4mm", "TEST-005", CAT_RAW_MATERIALS, "KG", 85.00, 300, 1000, 1200, 0, LOC_MAIN_STOCK),
    (6, "Brass Hex Fitting 1/2in", "TEST-006", CAT_RAW_MATERIALS, "UNIT", 145.00, 80, 300, 350, 0, LOC_MAIN_STOCK),
    (7, "Seamless Carbon Steel Pipe 1in", "TEST-007", CAT_RAW_MATERIALS, "METER", 290.00, 60, 250, 280, 0, LOC_MAIN_STOCK),
    (8, "Titanium Alloy Rod 12mm", "TEST-008", CAT_RAW_MATERIALS, "KG", 2850.00, 15, 50, 65, 0, LOC_MAIN_STOCK),
    (9, "High-Tensile Steel Wire 10AWG", "TEST-009", CAT_RAW_MATERIALS, "KG", 115.00, 100, 400, 450, 0, LOC_MAIN_STOCK),
    (10, "Nickel Plated Shim Stock 0.2mm", "TEST-010", CAT_RAW_MATERIALS, "PACK", 420.00, 25, 100, 110, 0, LOC_MAIN_STOCK),
    (11, "Industrial Silica Sand 25kg", "TEST-011", CAT_RAW_MATERIALS, "PACK", 190.00, 50, 200, 240, 0, LOC_PROD_FLOOR),
    (12, "Desiccant Silica Gel 1kg", "TEST-012", CAT_RAW_MATERIALS, "PACK", 85.00, 40, 150, 190, 0, LOC_PROD_FLOOR),
    # Low Stock (13-16)
    (13, "Polypropylene Granules 25kg", "TEST-013", CAT_RAW_MATERIALS, "PACK", 2400.00, 20, 80, 15, 0, LOC_PROD_FLOOR),
    (14, "Nitrile Rubber O-Ring Seal", "TEST-014", CAT_RAW_MATERIALS, "PACK", 95.00, 80, 300, 45, 0, LOC_PROD_FLOOR),
    (15, "Neoprene Industrial Flange Gasket", "TEST-015", CAT_RAW_MATERIALS, "UNIT", 65.00, 60, 250, 30, 0, LOC_PROD_FLOOR),
    (16, "Cast Iron Casting Ingot 10kg", "TEST-016", CAT_RAW_MATERIALS, "UNIT", 850.00, 25, 100, 18, 0, LOC_PROD_FLOOR),
    # Out of Stock (17-18)
    (17, "Sacrificial Zinc Anode Block 5kg", "TEST-017", CAT_RAW_MATERIALS, "UNIT", 1250.00, 20, 60, 0, 0, LOC_PROD_FLOOR),
    (18, "Rolled Lead Sheet 1.5mm", "TEST-018", CAT_RAW_MATERIALS, "KG", 420.00, 30, 100, 0, 0, LOC_PROD_FLOOR),
    # Reserved (19-20)
    (19, "High-Voltage Ceramic Insulator", "TEST-019", CAT_RAW_MATERIALS, "UNIT", 580.00, 35, 120, 140, 40, LOC_PROD_FLOOR),
    (20, "Lanthanated Tungsten Electrode 2.4mm", "TEST-020", CAT_RAW_MATERIALS, "PACK", 1650.00, 15, 50, 70, 25, LOC_PROD_FLOOR),

    # -------------------------------------------------------------
    # 2. Finished Goods (21-40)
    # -------------------------------------------------------------
    # Healthy (21-32)
    (21, "Ergonomic Mesh Task Chair", "TEST-021", CAT_FINISHED_GOODS, "UNIT", 4800.00, 15, 50, 65, 0, LOC_RACK_A),
    (22, "Executive Mahogany Office Desk", "TEST-022", CAT_FINISHED_GOODS, "UNIT", 14500.00, 5, 20, 22, 0, LOC_RACK_A),
    (23, "Steel 4-Drawer Filing Cabinet", "TEST-023", CAT_FINISHED_GOODS, "UNIT", 7200.00, 10, 30, 42, 0, LOC_RACK_A),
    (24, "Heavy Duty Steel Storage Shelf", "TEST-024", CAT_FINISHED_GOODS, "UNIT", 5400.00, 12, 40, 55, 0, LOC_RACK_A),
    (25, "Magnetic Dry Erase Whiteboard 4x3ft", "TEST-025", CAT_FINISHED_GOODS, "UNIT", 1850.00, 20, 60, 85, 0, LOC_RACK_A),
    (26, "Mobile Pedestal 3-Drawer Unit", "TEST-026", CAT_FINISHED_GOODS, "UNIT", 3600.00, 15, 45, 60, 0, LOC_RACK_A),
    (27, "Modular Conference Table 8-Seater", "TEST-027", CAT_FINISHED_GOODS, "UNIT", 22500.00, 4, 10, 14, 0, LOC_RACK_A),
    (28, "Acoustic Office Partition Screen", "TEST-028", CAT_FINISHED_GOODS, "UNIT", 2950.00, 15, 50, 68, 0, LOC_RACK_A),
    (29, "Steel Workshop Workbench 6ft", "TEST-029", CAT_FINISHED_GOODS, "UNIT", 11200.00, 8, 25, 32, 0, LOC_RACK_A),
    (30, "Heavy Duty Tool Storage Trolley", "TEST-030", CAT_FINISHED_GOODS, "UNIT", 8900.00, 10, 30, 40, 0, LOC_RACK_A),
    (31, "Aluminum Folding Step Ladder 6-Step", "TEST-031", CAT_FINISHED_GOODS, "UNIT", 2450.00, 15, 40, 58, 0, LOC_PROD_FG),
    (32, "Industrial Platform Hand Truck 300kg", "TEST-032", CAT_FINISHED_GOODS, "UNIT", 4600.00, 10, 30, 38, 0, LOC_PROD_FG),
    # Low Stock (33-36)
    (33, "Hydraulic Hand Pallet Jack 2500kg", "TEST-033", CAT_FINISHED_GOODS, "UNIT", 18500.00, 4, 10, 3, 0, LOC_PROD_FG),
    (34, "Double Door Steel Security Locker", "TEST-034", CAT_FINISHED_GOODS, "UNIT", 9800.00, 8, 25, 6, 0, LOC_PROD_FG),
    (35, "Industrial Drum Spill Containment Pallet", "TEST-035", CAT_FINISHED_GOODS, "UNIT", 6500.00, 10, 30, 7, 0, LOC_PROD_FG),
    (36, "Warehouse Barcode Scanner Stand", "TEST-036", CAT_FINISHED_GOODS, "UNIT", 1250.00, 25, 80, 16, 0, LOC_PROD_FG),
    # Out of Stock (37-38)
    (37, "Industrial Heavy Duty Floor Scale 1000kg", "TEST-037", CAT_FINISHED_GOODS, "UNIT", 16500.00, 5, 15, 0, 0, LOC_PROD_FG),
    (38, "Stainless Steel Work Table with Sink", "TEST-038", CAT_FINISHED_GOODS, "UNIT", 19500.00, 4, 12, 0, 0, LOC_PROD_FG),
    # Reserved (39-40)
    (39, "Electric Height Adjustable Standing Desk", "TEST-039", CAT_FINISHED_GOODS, "UNIT", 24000.00, 6, 20, 28, 10, LOC_PROD_FG),
    (40, "Modular Industrial Guard Rail 3m", "TEST-040", CAT_FINISHED_GOODS, "UNIT", 3800.00, 12, 40, 45, 15, LOC_PROD_FG),

    # -------------------------------------------------------------
    # 3. Electronics (41-60)
    # -------------------------------------------------------------
    # Healthy (41-52)
    (41, "Mechanical USB Gaming Keyboard", "TEST-041", CAT_ELECTRONICS, "UNIT", 2200.00, 25, 80, 110, 0, LOC_MAIN_STOCK),
    (42, "Wireless Ergonomic Optical Mouse", "TEST-042", CAT_ELECTRONICS, "UNIT", 850.00, 30, 100, 145, 0, LOC_MAIN_STOCK),
    (43, "Ultra High Speed HDMI 2.1 Cable 3m", "TEST-043", CAT_ELECTRONICS, "UNIT", 380.00, 50, 200, 260, 0, LOC_MAIN_STOCK),
    (44, "24-Port Gigabit Managed Network Switch", "TEST-044", CAT_ELECTRONICS, "UNIT", 8500.00, 8, 25, 35, 0, LOC_MAIN_STOCK),
    (45, "Cat6 Shielded Ethernet Cable 305m", "TEST-045", CAT_ELECTRONICS, "PACK", 4200.00, 10, 30, 44, 0, LOC_MAIN_STOCK),
    (46, "1TB NVMe PCIe 4.0 SSD Internal", "TEST-046", CAT_ELECTRONICS, "UNIT", 5800.00, 15, 50, 72, 0, LOC_MAIN_STOCK),
    (47, "16GB DDR4 3200MHz RAM Module", "TEST-047", CAT_ELECTRONICS, "UNIT", 2900.00, 20, 60, 95, 0, LOC_MAIN_STOCK),
    (48, "Universal 65W USB-C GaN Power Adapter", "TEST-048", CAT_ELECTRONICS, "UNIT", 1450.00, 30, 100, 130, 0, LOC_MAIN_STOCK),
    (49, "Full HD 1080p Business Webcam", "TEST-049", CAT_ELECTRONICS, "UNIT", 2100.00, 20, 70, 88, 0, LOC_MAIN_STOCK),
    (50, "Noise Cancelling USB Call Center Headset", "TEST-050", CAT_ELECTRONICS, "UNIT", 1800.00, 25, 80, 105, 0, LOC_MAIN_STOCK),
    (51, "27-inch IPS 4K UHD Professional Monitor", "TEST-051", CAT_ELECTRONICS, "UNIT", 21500.00, 6, 20, 28, 0, LOC_RACK_B),
    (52, "Wireless Dual-Band Wi-Fi 6 Router", "TEST-052", CAT_ELECTRONICS, "UNIT", 3600.00, 12, 40, 54, 0, LOC_RACK_B),
    # Low Stock (53-56)
    (53, "1000VA Line-Interactive UPS Backup", "TEST-053", CAT_ELECTRONICS, "UNIT", 6200.00, 10, 30, 7, 0, LOC_RACK_B),
    (54, "8-Outlet Surge Protector Power Strip", "TEST-054", CAT_ELECTRONICS, "UNIT", 750.00, 35, 120, 22, 0, LOC_RACK_B),
    (55, "USB 3.0 to Dual HDMI Display Adapter", "TEST-055", CAT_ELECTRONICS, "UNIT", 1650.00, 20, 60, 14, 0, LOC_RACK_B),
    (56, "2D QR Code Handheld Wireless Scanner", "TEST-056", CAT_ELECTRONICS, "UNIT", 3200.00, 15, 45, 9, 0, LOC_RACK_B),
    # Out of Stock (57-58)
    (57, "Direct Thermal Barcode Label Printer", "TEST-057", CAT_ELECTRONICS, "UNIT", 11500.00, 8, 25, 0, 0, LOC_RACK_B),
    (58, "2TB External Rugged USB-C Hard Drive", "TEST-058", CAT_ELECTRONICS, "UNIT", 6800.00, 12, 40, 0, 0, LOC_RACK_B),
    # Reserved (59-60)
    (59, "32GB DDR5 5600MHz High-End RAM", "TEST-059", CAT_ELECTRONICS, "UNIT", 7400.00, 10, 30, 45, 15, LOC_RACK_B),
    (60, "48-Port PoE+ Gigabit Enterprise Switch", "TEST-060", CAT_ELECTRONICS, "UNIT", 24500.00, 4, 12, 16, 5, LOC_RACK_B),

    # -------------------------------------------------------------
    # 4. Office Supplies (61-80)
    # -------------------------------------------------------------
    # Healthy (61-72)
    (61, "Multipurpose Copier Paper A4 75GSM 5 Reams", "TEST-061", CAT_OFFICE_SUPPLIES, "PACK", 1350.00, 30, 100, 160, 0, LOC_RACK_A),
    (62, "Permanent Marker Pens Assorted 12-Pack", "TEST-062", CAT_OFFICE_SUPPLIES, "PACK", 180.00, 50, 200, 240, 0, LOC_RACK_A),
    (63, "Hardcover Ruled Executive Notebook A5", "TEST-063", CAT_OFFICE_SUPPLIES, "UNIT", 140.00, 60, 250, 310, 0, LOC_RACK_A),
    (64, "Heavy Duty Desktop Stapler 50-Sheet", "TEST-064", CAT_OFFICE_SUPPLIES, "UNIT", 320.00, 25, 80, 115, 0, LOC_RACK_A),
    (65, "Polypropylene Document File Folder 10-Pack", "TEST-065", CAT_OFFICE_SUPPLIES, "PACK", 220.00, 40, 150, 195, 0, LOC_RACK_A),
    (66, "Multi-Compartment Mesh Desk Organizer", "TEST-066", CAT_OFFICE_SUPPLIES, "UNIT", 280.00, 30, 100, 140, 0, LOC_RACK_A),
    (67, "Retractable Ballpoint Pens Blue 50-Pack", "TEST-067", CAT_OFFICE_SUPPLIES, "PACK", 350.00, 35, 120, 175, 0, LOC_RACK_A),
    (68, "Fluorescent Highlighter Pens 5-Pack", "TEST-068", CAT_OFFICE_SUPPLIES, "PACK", 120.00, 45, 150, 210, 0, LOC_RACK_A),
    (69, "Heavy Duty 2-Hole Paper Punch 40-Sheet", "TEST-069", CAT_OFFICE_SUPPLIES, "UNIT", 450.00, 20, 70, 92, 0, LOC_RACK_A),
    (70, "Transparent Self-Adhesive Packing Tape 65m", "TEST-070", CAT_OFFICE_SUPPLIES, "PACK", 195.00, 60, 250, 320, 0, LOC_RACK_A),
    (71, "Self-Adhesive Sticky Notes 3x3in 12-Pack", "TEST-071", CAT_OFFICE_SUPPLIES, "PACK", 160.00, 40, 150, 185, 0, LOC_RACK_B),
    (72, "Stainless Steel Office Scissors 8in", "TEST-072", CAT_OFFICE_SUPPLIES, "UNIT", 95.00, 30, 100, 135, 0, LOC_RACK_B),
    # Low Stock (73-76)
    (73, "High Yield Black Toner Cartridge CF226A", "TEST-073", CAT_OFFICE_SUPPLIES, "UNIT", 2650.00, 12, 40, 9, 0, LOC_RACK_B),
    (74, "Thermal Paper Receipt Rolls 80mm 50-Pack", "TEST-074", CAT_OFFICE_SUPPLIES, "PACK", 850.00, 25, 80, 18, 0, LOC_RACK_B),
    (75, "Desktop Thermal Label Rolls 4x6in 4-Rolls", "TEST-075", CAT_OFFICE_SUPPLIES, "PACK", 1150.00, 20, 60, 14, 0, LOC_RACK_B),
    (76, "Heavy Duty Carton Sealing Tape Gun", "TEST-076", CAT_OFFICE_SUPPLIES, "UNIT", 280.00, 30, 90, 20, 0, LOC_RACK_B),
    # Out of Stock (77-78)
    (77, "Cross-Cut Security Paper Shredder 15L", "TEST-077", CAT_OFFICE_SUPPLIES, "UNIT", 4900.00, 8, 25, 0, 0, LOC_RACK_B),
    (78, "Thermal Laminator Machine A3 Heavy Duty", "TEST-078", CAT_OFFICE_SUPPLIES, "UNIT", 3400.00, 10, 30, 0, 0, LOC_RACK_B),
    # Reserved (79-80)
    (79, "High Yield Color Toner Set CMYK", "TEST-079", CAT_OFFICE_SUPPLIES, "PACK", 8800.00, 6, 18, 24, 8, LOC_RACK_B),
    (80, "Heavy Duty Lever Arch Files 10-Pack", "TEST-080", CAT_OFFICE_SUPPLIES, "PACK", 720.00, 30, 100, 120, 35, LOC_RACK_B),

    # -------------------------------------------------------------
    # 5. Safety Equipment (81-100)
    # -------------------------------------------------------------
    # Healthy (81-92)
    (81, "Steel Toe Cap Safety Work Boots Size 9", "TEST-081", CAT_SAFETY_EQUIPMENT, "PAIR", 1850.00, 20, 60, 95, 0, LOC_MAIN_STOCK),
    (82, "High Visibility Reflective Safety Vest XL", "TEST-082", CAT_SAFETY_EQUIPMENT, "UNIT", 145.00, 60, 200, 280, 0, LOC_MAIN_STOCK),
    (83, "Polycarbonate Clear Protective Face Shield", "TEST-083", CAT_SAFETY_EQUIPMENT, "UNIT", 290.00, 35, 120, 160, 0, LOC_MAIN_STOCK),
    (84, "Anti-Fog Chemical Splash Safety Goggles", "TEST-084", CAT_SAFETY_EQUIPMENT, "UNIT", 185.00, 50, 180, 230, 0, LOC_MAIN_STOCK),
    (85, "Noise Reduction Industrial Ear Muffs 28dB", "TEST-085", CAT_SAFETY_EQUIPMENT, "UNIT", 480.00, 30, 100, 145, 0, LOC_MAIN_STOCK),
    (86, "Cut Resistant Kevlar Safety Gloves Level 5", "TEST-086", CAT_SAFETY_EQUIPMENT, "PAIR", 220.00, 50, 200, 250, 0, LOC_MAIN_STOCK),
    (87, "Heavy Duty Industrial Safety Helmet Yellow", "TEST-087", CAT_SAFETY_EQUIPMENT, "UNIT", 420.00, 40, 150, 190, 0, LOC_MAIN_STOCK),
    (88, "Full Body Fall Arrest Safety Harness", "TEST-088", CAT_SAFETY_EQUIPMENT, "UNIT", 2450.00, 15, 50, 72, 0, LOC_MAIN_STOCK),
    (89, "N95 Particulate Respirator Masks 20-Pack", "TEST-089", CAT_SAFETY_EQUIPMENT, "PACK", 380.00, 40, 150, 185, 0, LOC_MAIN_STOCK),
    (90, "Chemical Resistant Nitrile Gauntlet Gloves", "TEST-090", CAT_SAFETY_EQUIPMENT, "PAIR", 160.00, 45, 160, 210, 0, LOC_MAIN_STOCK),
    (91, "ABC Dry Powder Fire Extinguisher 6kg", "TEST-091", CAT_SAFETY_EQUIPMENT, "UNIT", 1650.00, 15, 45, 64, 0, LOC_PROD_FLOOR),
    (92, "Wall-Mounted First Aid Kit 50-Person", "TEST-092", CAT_SAFETY_EQUIPMENT, "UNIT", 1200.00, 20, 60, 88, 0, LOC_PROD_FLOOR),
    # Low Stock (93-96)
    (93, "Emergency Eye Wash Station Solution 500ml", "TEST-093", CAT_SAFETY_EQUIPMENT, "PACK", 650.00, 25, 80, 18, 0, LOC_PROD_FLOOR),
    (94, "Industrial Anti-Slip Floor Safety Tape 50mm", "TEST-094", CAT_SAFETY_EQUIPMENT, "PACK", 290.00, 30, 100, 21, 0, LOC_PROD_FLOOR),
    (95, "Dual Cartridge Chemical Half-Mask Respirator", "TEST-095", CAT_SAFETY_EQUIPMENT, "UNIT", 1450.00, 18, 55, 12, 0, LOC_PROD_FLOOR),
    (96, "Welding Safety Leather Apron Heavy Duty", "TEST-096", CAT_SAFETY_EQUIPMENT, "UNIT", 780.00, 20, 60, 15, 0, LOC_PROD_FLOOR),
    # Out of Stock (97-98)
    (97, "Heat Resistant Kevlar Welding Gloves", "TEST-097", CAT_SAFETY_EQUIPMENT, "PAIR", 450.00, 30, 90, 0, 0, LOC_PROD_FLOOR),
    (98, "Arc Flash Protective Face Shield Complete", "TEST-098", CAT_SAFETY_EQUIPMENT, "UNIT", 3800.00, 8, 24, 0, 0, LOC_PROD_FLOOR),
    # Reserved (99-100)
    (99, "Self-Retracting Lifeline Cable 10m", "TEST-099", CAT_SAFETY_EQUIPMENT, "UNIT", 7200.00, 6, 20, 30, 10, LOC_PROD_FLOOR),
    (100, "Multi-Gas Industrial Detector 4-Gas", "TEST-100", CAT_SAFETY_EQUIPMENT, "UNIT", 16500.00, 4, 12, 18, 6, LOC_PROD_FLOOR),
]

def make_uuid(prefix_digit: str, idx: int) -> str:
    """Generate deterministic UUID format."""
    return f"{prefix_digit}1000000-0000-0000-0000-{idx:012d}"

def generate_sql() -> str:
    lines = [
        "-- StockSense Idempotent Extended Test Dataset (100 Realistic Products & Inventory)",
        "-- Deterministic SKUs: TEST-001 through TEST-100",
        "BEGIN;",
        ""
    ]

    # 1. Products
    product_values = []
    for idx, name, sku, cat_id, uom, unit_cost, reorder_level, reorder_qty, on_hand, reserved, loc_id in PRODUCTS_DATA:
        p_id = make_uuid("4", idx)
        barcode = f"8902{idx:08d}"
        escaped_name = name.replace("'", "''")
        product_values.append(
            f"('{p_id}','{escaped_name}','{sku}','{cat_id}','{uom}',{unit_cost:.2f},{reorder_level},{reorder_qty},'{barcode}',true)"
        )

    lines.append("INSERT INTO products (id,name,sku,category_id,unit_of_measure,unit_cost,reorder_level,reorder_quantity,barcode,is_active) VALUES")
    lines.append(",\n".join(product_values) + " ON CONFLICT (sku) DO NOTHING;")
    lines.append("")

    # 2. Inventory
    inventory_values = []
    for idx, name, sku, cat_id, uom, unit_cost, reorder_level, reorder_qty, on_hand, reserved, loc_id in PRODUCTS_DATA:
        inv_id = make_uuid("9", idx)
        p_id = make_uuid("4", idx)
        inventory_values.append(
            f"('{inv_id}','{p_id}','{loc_id}',{on_hand},{reserved})"
        )

    lines.append("INSERT INTO inventory (id,product_id,location_id,on_hand,reserved) VALUES")
    lines.append(",\n".join(inventory_values) + " ON CONFLICT (product_id,location_id) DO NOTHING;")
    lines.append("")

    # 3. Stock Ledger (for records with initial on_hand > 0)
    ledger_values = []
    for idx, name, sku, cat_id, uom, unit_cost, reorder_level, reorder_qty, on_hand, reserved, loc_id in PRODUCTS_DATA:
        if on_hand > 0:
            ledger_id = make_uuid("a", idx)
            p_id = make_uuid("4", idx)
            ledger_values.append(
                f"('{ledger_id}','{p_id}','{loc_id}','INITIAL_STOCK',{on_hand},'initial_inventory','{USER_ADMIN}')"
            )

    lines.append("INSERT INTO stock_ledger (id,product_id,destination_location_id,movement_type,quantity,reference_type,created_by) VALUES")
    lines.append(",\n".join(ledger_values) + " ON CONFLICT (id) DO NOTHING;")
    lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)

def seed_database():
    sql_content = generate_sql()
    out_path = Path(__file__).resolve().parent / "004_test_data.sql"
    out_path.write_text(sql_content, encoding="utf-8")
    print(f"Generated SQL seed file at: {out_path}")

    # Execute against database
    with engine.begin() as conn:
        conn.execute(text(sql_content))
    print("Database successfully seeded with 100 test products and inventory records!")

if __name__ == "__main__":
    seed_database()
