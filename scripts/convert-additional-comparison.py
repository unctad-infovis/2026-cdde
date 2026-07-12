"""
Convert data/Additional_Data_For_Comparison.xlsx
  → public/assets/data/cdde_ranking_indicators.json
  → dist/assets/data/cdde_ranking_indicators.json

Sheets:
  'Commo Xs 2022-2024'    → commodity_exports (millions USD, 2022-2024 avg)
  'Food imports 2022-24'  → food_imports      (millions USD, 2022-2024 avg)
  'Energy imports 2022-24'→ energy_imports    (millions USD, 2022-2024 avg)

ISO3 is in column B (index 1), value in column E (index 4).
"""

import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl",
                           "--break-system-packages", "-q"])
    import openpyxl

ROOT = Path(__file__).parent.parent
SRC  = ROOT / "data" / "Additional_Data_For_Comparison.xlsx"

wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)

SHEET_MAP = {
    'Commo Xs 2022-2024':     'commodity_exports',
    'Food imports 2022-24':   'food_imports',
    'Energy imports 2022-24': 'energy_imports',
}

out = {}

for sheet_name, field in SHEET_MAP.items():
    ws = wb[sheet_name]
    for row in ws.iter_rows(min_row=2, values_only=True):
        iso3 = str(row[1]).strip() if row[1] else None
        val  = row[4]
        if not iso3 or iso3 == 'None' or val is None:
            continue
        try:
            val = round(float(val), 3)
        except (TypeError, ValueError):
            continue
        if iso3 not in out:
            out[iso3] = {}
        out[iso3][field] = val

json_str = json.dumps(out, indent=2, ensure_ascii=False)

for dest in [
    ROOT / "public" / "assets" / "data" / "cdde_ranking_indicators.json",
    ROOT / "dist"   / "assets" / "data" / "cdde_ranking_indicators.json",
]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json_str, encoding="utf-8")
    print(f"Written {len(out)} entries → {dest}")

# Spot check
for iso3 in ['NGA', 'CHN', 'AUS']:
    print(f"  {iso3}: {out.get(iso3)}")
