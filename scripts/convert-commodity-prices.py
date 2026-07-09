import json
import openpyxl
from datetime import datetime

wb = openpyxl.load_workbook("data/Commodity_price_Indices.xlsx", data_only=True)
ws = wb["Data"]

rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    date, total, energy, agri, mining, precious = row[:6]
    if date is None or not isinstance(date, datetime):
        continue
    rows.append({
        "date": date.strftime("%Y-%m"),
        "total":    round(float(total),    1) if total    is not None else None,
        "energy":   round(float(energy),   1) if energy   is not None else None,
        "agri":     round(float(agri),     1) if agri     is not None else None,
        "mining":   round(float(mining),   1) if mining   is not None else None,
        "precious": round(float(precious), 1) if precious is not None else None,
    })

out_path = "public/assets/data/cdde_commodity_prices.json"
with open(out_path, "w") as f:
    json.dump(rows, f, indent=2)
print(f"Written {len(rows)} rows → {out_path}")
print(f"Range: {rows[0]['date']} → {rows[-1]['date']}")
print(f"Precious metals max: {max(r['precious'] for r in rows if r['precious'] is not None)}")
