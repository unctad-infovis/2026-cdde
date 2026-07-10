import json
import openpyxl

wb = openpyxl.load_workbook('data/Macro_context_data.xlsx', data_only=True)
ws = wb.active

out = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    iso3 = str(row[1]).strip() if row[1] else None
    if not iso3:
        continue
    gdp = row[4]
    gdp_pc = row[5]
    entry = {}
    if gdp is not None and isinstance(gdp, (int, float)):
        entry['gdp'] = round(float(gdp), 1)
    if gdp_pc is not None and isinstance(gdp_pc, (int, float)):
        entry['gdp_per_capita'] = round(float(gdp_pc))
    if entry:
        out[iso3] = entry

out_path = 'public/assets/data/cdde_macro_context.json'
with open(out_path, 'w') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f'Written {len(out)} entries → {out_path}')
for iso3 in list(out.keys())[:3]:
    print(f'  {iso3}: {out[iso3]}')
