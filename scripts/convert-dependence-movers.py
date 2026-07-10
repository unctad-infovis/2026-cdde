import json
import openpyxl

ISO3_TO_ISO2 = {
    'NER': 'ne', 'GMB': 'gm', 'COG': 'cg', 'ARG': 'ar', 'TLS': 'tl',
    'CUB': 'cu', 'CPV': 'cv', 'TGO': 'tg', 'UGA': 'ug', 'BRA': 'br',
    'MDV': 'mv', 'BRN': 'bn', 'LAO': 'la', 'VEN': 've', 'OMN': 'om',
    'MNE': 'me', 'UZB': 'uz', 'RUS': 'ru', 'KWT': 'kw', 'PRY': 'py',
}

NAME_FIX = {
    "Niger (the)": "Niger",
    "Gambia (the)": "Gambia",
    "Congo (the)": "Congo",
    "Lao People's Democratic Republic (the)": "Lao PDR",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Russian Federation (the)": "Russian Fed.",
}

wb = openpyxl.load_workbook("data/Change_IN-Dependence(10leading).xlsx", data_only=True)
ws = wb["FINAL "]

increase, decline = [], []
for row in ws.iter_rows(min_row=2, values_only=True):
    iso3, name, old, new, change, category = row[1], row[2], row[3], row[4], row[5], row[6]
    if not iso3 or old is None or new is None:
        continue
    name = NAME_FIX.get(name, name)
    old_pct = round(old * 100, 1)
    new_pct = round(new * 100, 1)
    change_pp = round((new - old) * 100, 2)
    entry = {"name": name, "iso3": iso3, "iso2": ISO3_TO_ISO2.get(iso3, ''), "old_pct": old_pct, "new_pct": new_pct, "change": change_pp}
    if category == "Increase":
        increase.append(entry)
    else:
        decline.append(entry)

# Increases sorted largest first, declines sorted largest drop first
increase.sort(key=lambda r: -r["change"])
decline.sort(key=lambda r: r["change"])
out = increase + decline

out_path = "public/assets/data/cdde_dependence_movers.json"
with open(out_path, "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"Written {len(out)} rows → {out_path}")
for r in out:
    print(f"  {r['iso3']}  {r['name']:35s}  {r['old_pct']:5.1f}% → {r['new_pct']:5.1f}%  ({r['change']:+.1f}pp)")
