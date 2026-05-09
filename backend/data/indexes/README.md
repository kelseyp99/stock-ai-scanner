# Index CSV Files

Place Russell index constituent CSV files here.

## Required format

Each file should be a CSV with at least a `ticker` column.
Optional columns: `company_name`, `sector`.

## Expected filenames

| Universe      | Filename              |
|---------------|-----------------------|
| Russell 1000  | russell1000.csv       |
| Russell 2000  | russell2000.csv       |
| Russell 3000  | russell3000.csv       |

## Why manual?

Russell index constituents are not freely available via a public API without
a data license. Download the list from:
- FTSE Russell: https://www.ftserussell.com/products/indices/russell-us
- Or from your broker data feed / paid data provider.

## Example CSV

```csv
ticker,company_name,sector
AAPL,Apple Inc,Technology
MSFT,Microsoft Corporation,Technology
```
