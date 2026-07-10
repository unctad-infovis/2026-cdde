import json
import openpyxl
from collections import defaultdict

wb = openpyxl.load_workbook('data/Top3Commodities.xlsx', data_only=True)
ws = wb.active

rows_by_country = defaultdict(list)
for row in ws.iter_rows(min_row=2, values_only=True):
    iso3 = str(row[1]).strip() if row[1] else None
    label = str(row[4]).strip() if row[4] else None
    pct = row[5]
    if not iso3 or not label or pct is None:
        continue
    rows_by_country[iso3].append({'label': label, 'pct': round(float(pct), 1)})

out = {iso3: items for iso3, items in rows_by_country.items()}

out_path = 'public/assets/data/cdde_leading_exports.json'
with open(out_path, 'w') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f'Written {len(out)} entries → {out_path}')
for iso3 in list(out.keys())[:3]:
    print(f'  {iso3}: {out[iso3]}')
