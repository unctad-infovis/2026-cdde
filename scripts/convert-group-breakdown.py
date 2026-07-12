"""
Convert data/Commodity dependence(MAPS).xlsx
  → public/assets/data/cdde_group_breakdown.json
     dist/assets/data/cdde_group_breakdown.json

Columns used:
  ISO Alpha 3 (col B)
  Agricultural products (col G)
  Energy (col H)
  Mining (col I)
  Manufactures (col J)  → stored as 'other'

Values are shares of total merchandise exports (0–1 decimals).
Multiplied by 100 and rounded to 1 decimal for storage.
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
SRC  = ROOT / "data" / "Commodity dependence(MAPS).xlsx"

wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
ws = wb.active

out = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    iso3 = str(row[1]).strip() if row[1] else None
    if not iso3 or iso3 == 'None':
        continue
    agri  = row[6]
    energy = row[7]
    mining = row[8]
    other  = row[9]
    def to_f(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    agri_f   = to_f(agri)
    energy_f = to_f(energy)
    mining_f = to_f(mining)
    other_f  = to_f(other)

    if agri_f == 0 and energy_f == 0 and mining_f == 0 and other_f == 0:
        continue

    out[iso3] = {
        "agri":   round(agri_f   * 100, 1),
        "energy": round(energy_f * 100, 1),
        "mining": round(mining_f * 100, 1),
        "other":  round(other_f  * 100, 1),
    }

json_str = json.dumps(out, indent=2, ensure_ascii=False)

for dest in [
    ROOT / "public" / "assets" / "data" / "cdde_group_breakdown.json",
    ROOT / "dist"   / "assets" / "data" / "cdde_group_breakdown.json",
]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json_str, encoding="utf-8")
    print(f"Written {len(out)} entries → {dest}")
