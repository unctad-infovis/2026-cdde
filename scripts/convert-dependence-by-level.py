"""
Convert data/Commo_Dep_by_Country_Group(Right).xlsx
  → public/assets/data/cdde_dependence_by_level.csv

Excel structure (row 1 = header, rows 2+ = data):
  Col A: Name   — full country group name
  Col B: Value  — mean commodity export share (0–100)

The short group label and economy count are derived from a fixed mapping
since the Excel contains only the average value.
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

# Maps full Excel name → (short label used in chart, economy count)
# Bar colour is derived in the component: "Developed" → green, all others → blue.
GROUP_MAP = {
    "Small island developing states":   ("SIDS",             37),
    "Landlocked developing countries":  ("LLDCs",            32),
    "Least developed countries":        ("LDCs",             44),
    "Other developing countries":       ("Other developing", 55),
    "Developed countries":              ("Developed",        48),
}


def convert(xlsx_path: Path, csv_path: Path) -> None:
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active

    rows_written = 0
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["group", "economies", "avg_pct"])

        first = True
        for row in ws.iter_rows(values_only=True):
            name, value, *_ = list(row) + [None]
            if first:
                first = False
                continue
            if name is None or value is None:
                continue
            name = str(name).strip()
            mapping = GROUP_MAP.get(name)
            if not mapping:
                print(f"  Warning: unknown group '{name}' — skipped")
                continue
            short, economies = mapping
            writer.writerow([short, economies, float(value)])
            rows_written += 1

    print(f"Written {rows_written} rows → {csv_path}")


if __name__ == "__main__":
    root = Path(__file__).parent.parent
    convert(
        root / "data" / "Commo_Dep_by_Country_Group(Right).xlsx",
        root / "public" / "assets" / "data" / "cdde_dependence_by_level.csv",
    )
