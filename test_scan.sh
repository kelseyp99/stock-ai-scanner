#!/bin/zsh
cd /Users/tinman/Projects/stock-ai-scanner/backend
pkill -f uvicorn 2>/dev/null
sleep 2
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/uv.log 2>&1 &
UVPID=$!
echo "uvicorn PID: $UVPID"
sleep 12
echo "=== /scan ==="
curl -s http://127.0.0.1:8000/scan -m 90 -o /tmp/scan.json && echo "OK" || echo "FAILED"
echo "=== /scan/grouped ==="
curl -s http://127.0.0.1:8000/scan/grouped -m 90 -o /tmp/scan_grouped.json && echo "OK" || echo "FAILED"
echo "=== summary ==="
python3 << 'EOF'
import json
d = json.load(open('/tmp/scan.json'))
print(f"{len(d)} results from /scan")
for r in d:
    print(f"  {r['ticker']:6} score={r['score']:2}  {r.get('volatility_label','?'):8}  div={r.get('dividend_yield_percent',0):.2f}%  {r.get('categories',[])[0:2]}")
print()
g = json.load(open('/tmp/scan_grouped.json'))
print("Summary:", g.get('summary'))
print("Categories:")
for cat, items in g.get('by_category', {}).items():
    if items:
        tickers = [i['ticker'] for i in items]
        print(f"  {cat}: {tickers}")
EOF
