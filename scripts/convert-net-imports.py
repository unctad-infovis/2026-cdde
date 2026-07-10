import json
import openpyxl

def load_file(fname, key_early, key_recent, out):
    wb = openpyxl.load_workbook(fname, data_only=True)
    ws = wb.active
    for row in ws.iter_rows(min_row=2, values_only=True):
        iso3 = str(row[1]).strip() if row[1] else None
        if not iso3:
            continue
        entry = out.setdefault(iso3, {})
        v1, v2 = row[4], row[5]
        if v1 is not None and isinstance(v1, (int, float)):
            entry[key_early] = round(float(v1), 1)
        if v2 is not None and isinstance(v2, (int, float)):
            entry[key_recent] = round(float(v2), 1)

out = {}
load_file('data/FoodNetImports.xlsx', 'food_early', 'food_recent', out)
load_file('data/EnergyNetImports.xlsx', 'energy_early', 'energy_recent', out)

out_path = 'public/assets/data/cdde_net_imports.json'
with open(out_path, 'w') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f'Written {len(out)} entries → {out_path}')
for iso3 in list(out.keys())[:3]:
    print(f'  {iso3}: {out[iso3]}')
