# StockSense database

Target database: `Oddo_Hackthon` on PostgreSQL 18. Run the files in order:

```powershell
$env:PGPASSWORD = '<password>'
psql -X -w -U postgres -h localhost -d Oddo_Hackthon -f database/001_schema.sql
psql -X -w -U postgres -h localhost -d Oddo_Hackthon -f database/002_seed.sql
psql -X -w -U postgres -h localhost -d Oddo_Hackthon -f database/003_validate.sql
```

`001_schema.sql` defines the UUID-based schema, enums, integrity checks, indexes, and automatic `updated_at` triggers. `002_seed.sql` is transactional and uses deterministic UUIDs and unique business keys, so it can be re-run without duplicate demo records. It deliberately never deletes or truncates data.

Demo accounts: `admin@stocksense.demo`, `manager@stocksense.demo`, `warehouse@stocksense.demo`, and `operations@stocksense.demo`. All use password `StockSense@123`; only bcrypt hashes are stored.

Inventory is changed only by completed operations in application code. `inventory` stores only `on_hand` and `reserved`; free-to-use is always calculated as `on_hand - reserved`. Signed entries in `stock_ledger` are the audit source for inventory validation. Draft, waiting, ready, and canceled documents carry no ledger movement.
