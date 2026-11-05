import json, sys, re
from collections import Counter

path = sys.argv[1]
out_path = sys.argv[2]
txt = open(path, encoding="utf-8").read()

def unescape(s):
    return (s.replace("\\'", "'").replace('\\"', '"')
             .replace("\\/", "/").replace("\\\\", "\\")
             .replace("\\n", " ").replace("\\t", " ").strip())

def grp_str(window, key):
    m = re.search(r'"' + key + r'":"((?:[^"\\]|\\.)*)"', window)
    return unescape(m.group(1)) if m else ""

def grp_int(window, key):
    m = re.search(r'"' + key + r'":(-?\d+)', window)
    return int(m.group(1)) if m else 0

def grp_bool(window, key):
    m = re.search(r'"' + key + r'":(true|false)', window)
    return m and m.group(1) == "true"

KEY = '{"song_id":"'
out = []
seen = set()
skipped = 0
i = 0
while True:
    j = txt.find(KEY, i)
    if j < 0:
        break
    i = j + 1
    sid_m = re.match(r'\{"song_id":"([^"]+)"', txt[j:j+120])
    if not sid_m:
        continue
    sid = sid_m.group(1)
    if sid in seen:
        continue
    # fields all appear before the (huge) "heat" array
    h = txt.find('"heat":', j)
    end_w = h if 0 <= h - j < 6000 else j + 2000
    w = txt[j:end_w]

    yt_block = re.search(r'"youtube_ids":\[([^\]]*)\]', w)
    yts = re.findall(r'[A-Za-z0-9_-]{11}', yt_block.group(1)) if yt_block else []
    if not yts:
        skipped += 1
        seen.add(sid)
        continue

    dur = grp_int(w, "duration_sec")
    start = grp_int(w, "entry_sec")
    ex = grp_int(w, "exit_sec")
    end = dur if (grp_bool(w, "play_full") or ex <= start) else ex
    if end <= start:
        end = start + 90

    tags_block = re.search(r'"tags":\[([^\]]*)\]', w)
    tags = re.findall(r'"([^"]+)"', tags_block.group(1)) if tags_block else []

    seen.add(sid)
    out.append({
        "id": sid,
        "title": grp_str(w, "title"),
        "artists": grp_str(w, "artist"),
        "year": grp_int(w, "year"),
        "yt": yts[0],
        "start": start,
        "end": end,
        "lang": grp_str(w, "language"),
        "subtype": grp_str(w, "subtype"),
        "tags": tags,
        "energy": grp_int(w, "energy"),
    })

json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

print("unique song_ids seen:", len(seen))
print("written songs:", len(out), "| skipped (no yt):", skipped)
print("languages:", dict(Counter(s["lang"] for s in out)))
print("subtypes:", dict(Counter(s["subtype"] for s in out)))
missing_year = sum(1 for s in out if not s["year"])
print("missing year:", missing_year)
print("samples:")
for s in out[:3]:
    print("  ", json.dumps(s, ensure_ascii=False)[:200])
