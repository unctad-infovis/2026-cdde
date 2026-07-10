import json
import openpyxl

wb = openpyxl.load_workbook('data/CountryprofileMainFigures.xlsx', data_only=True)
ws = wb.active

out = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    iso3 = row[1]
    leading_commodity = row[4]
    commodity_dependence = row[5]
    leading_market = row[6]
    if not iso3:
        continue
    out[iso3] = {
        'leading_commodity': round(float(leading_commodity), 1) if leading_commodity is not None else None,
        'commodity_dependence': round(float(commodity_dependence), 1) if commodity_dependence is not None else None,
        'leading_market': round(float(leading_market), 1) if leading_market is not None else None,
    }

out_path = 'public/assets/data/cdde_profile_stats.json'
with open(out_path, 'w') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f'Written {len(out)} entries → {out_path}')
for iso3, v in list(out.items())[:5]:
    print(f'  {iso3}: {v}')
