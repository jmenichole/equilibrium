# Equilibrium math

Python simulation and book generation for the Stake Engine build.

## Tests

```bash
cd math && python3 -m pytest
```

## Generate library

From repo root, after `cd math && python3 -m pytest` leaves you in `math/`:

```bash
python3 generate.py --count 100000 --out library
```

This writes Engine-shaped files under `library/`. `publish_files/` is what ACP imports.

Lookup CSV is **headerless** official rows: `<id>,<weight>,<payoutMultiplier>` (example `1,1,104`). Engine parses line 1 as integers and rejects `id,probabilityWeight,payoutMultiplier`.

If you already generated a library with the old header, you do **not** need to re-simulate books. Either:

1. Pull the fixed `generate.py` / `publish.py` and re-run generate, **or**
2. Faster on Windows — strip line 1 of the existing LUT if remaining rows are already `id,weight,payout` integers:

```powershell
$p = "C:\Users\jmeni\equilibrium\math\library\publish_files\lookUpTable_base_0.csv"
$utf8 = New-Object System.Text.UTF8Encoding $false
$lines = [System.IO.File]::ReadAllLines($p)
if ($lines[0] -eq "id,probabilityWeight,payoutMultiplier") {
  [System.IO.File]::WriteAllLines($p, $lines[1..($lines.Length-1)], $utf8)
}
```

Then install `zstandard` and compress the existing books file if `index.json` still points at uncompressed `books_base.jsonl`:

```powershell
cd C:\Users\jmeni\equilibrium\math
py -m pip install zstandard
py -c "import json, pathlib, zstandard; p=pathlib.Path(r'C:\Users\jmeni\equilibrium\math\library\publish_files'); raw=(p/'books_base.jsonl').read_bytes(); (p/'books_base.jsonl.zst').write_bytes(zstandard.ZstdCompressor().compress(raw)); idx=json.loads((p/'index.json').read_text()); idx['modes'][0]['events']='books_base.jsonl.zst'; (p/'index.json').write_text(json.dumps(idx))"
```

## Stake Engine / ACP (human)

Do **not** upload math source. Re-import only `math/library/publish_files/` (the three Engine files: `index.json`, `lookUpTable_base_0.csv`, `books_base.jsonl.zst`). Frontend `dist/` (3 files) stays if you already uploaded it.

Upload to [engine.stake.com](https://engine.stake.com) is manual. After generate + build, the folders on **your machine** (repo root) are:

- Math: `math/library/publish_files/`
- Frontend: `frontend/dist/`

```bash
cd frontend && npm run build
```

(from repo root). See [docs/MANUAL-TASKS.md](../docs/MANUAL-TASKS.md).
