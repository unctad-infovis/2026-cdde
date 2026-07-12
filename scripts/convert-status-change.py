import json
import openpyxl

ISO3_TO_ISO2 = {
    'COM': 'km', 'GRD': 'gd', 'GTM': 'gt', 'IDN': 'id', 'IRN': 'ir',
    'LBR': 'lr', 'MMR': 'mm', 'PLW': 'pw', 'PAN': 'pa', 'ZAF': 'za',
    'TTO': 'tt', 'TUV': 'tv', 'UKR': 'ua',
}

NAME_FIX = {
    "Comoros (the)": "Comoros",
    "Iran (Islamic Republic of)": "Iran",
}

wb = openpyxl.load_workbook("data/Status_Change.xlsx", data_only=True)
ws = wb["Sheet1"]

rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    iso3, name, old, new = row[1], row[2], row[3], row[4]
    if not iso3 or old is None or new is None:
        continue
    name = NAME_FIX.get(name, name)
    old_pct = round(old * 100, 1)
    new_pct = round(new * 100, 1)
    change = round(new_pct - old_pct, 1)
    status = "now_dependent" if old < 0.60 and new >= 0.60 else "no_longer"
    rows.append({
        "name": name,
        "iso3": iso3,
        "iso2": ISO3_TO_ISO2.get(iso3, ''),
        "old_pct": old_pct,
        "new_pct": new_pct,
        "change": change,
        "status": status,
    })

# Sort: now_dependent (gained, positive change) first by change desc,
# then no_longer (lost, negative change) by change asc
now_dep = sorted([r for r in rows if r["status"] == "now_dependent"], key=lambda r: -r["change"])
no_longer = sorted([r for r in rows if r["status"] == "no_longer"], key=lambda r: r["change"])
out = now_dep + no_longer

out_path = "public/assets/data/cdde_status_changers.json"
with open(out_path, "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"Written {len(out)} rows → {out_path}")
for r in out:
    print(f"  {r['iso3']}  {r['name']:30s}  {r['old_pct']:5.1f}% → {r['new_pct']:5.1f}%  ({r['change']:+.1f}pp)  [{r['status']}]")
