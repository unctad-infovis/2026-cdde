"""
Convert data/Commo_Dep_by_Country_Group.xlsx
  → public/assets/data/cdde_dependence_by_group.csv

Excel structure (row 1 = header, rows 2+ = data):
  Col A: Name                  — country group label
  Col B: Non-commodity-dependent  — economies ≤60% commodity export share
  Col C: 60-80                 — economies in 60–80% band
  Col D: >80                   — economies above 80%

Total is derived as the sum of the three bands.
group_short uses ~ as a line-break token for the x-axis label.
"""

import csv
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess
    print("openpyxl not found — installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl",
                           "--break-system-packages", "-q"])
    import openpyxl

# Groups that need a line break in the x-axis label
_SHORT_LABELS = {
    "Other developing": "Other~developing",
    "Developed countries": "Developed~countries",
}


def group_short(name: str) -> str:
    return _SHORT_LABELS.get(name, name)


def convert(xlsx_path: Path, csv_path: Path) -> None:
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active

    rows_written = 0
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["group", "group_short", "total", "below60", "band60_80", "above80"])

        first = True
        for row in ws.iter_rows(values_only=True):
            name, below60, band60_80, above80, *_ = list(row) + [None] * 4
            if first:          # skip header row
                first = False
                continue
            if name is None:
                continue
            name = str(name).strip().replace("\xa0", "")   # strip non-breaking spaces
            if not name:
                continue
            below60   = int(below60   or 0)
            band60_80 = int(band60_80 or 0)
            above80   = int(above80   or 0)
            total     = below60 + band60_80 + above80
            writer.writerow([name, group_short(name), total, below60, band60_80, above80])
            rows_written += 1

    print(f"Written {rows_written} rows → {csv_path}")


if __name__ == "__main__":
    root = Path(__file__).parent.parent
    convert(
        root / "data" / "Commo_Dep_by_Country_Group.xlsx",
        root / "public" / "assets" / "data" / "cdde_dependence_by_group.csv",
    )
