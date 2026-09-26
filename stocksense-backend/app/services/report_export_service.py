"""CSV adapter contract for the Phase 3 report query services."""

import csv
import io
from collections.abc import Iterable, Mapping, Sequence
from typing import Protocol

from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session


class ReportExportProvider(Protocol):
    """Phase 3 adapter: expose report columns and lazily iterate the shared report query."""

    def columns(self, report_name: str) -> Sequence[str]: ...

    def iter_rows(self, db: Session, report_name: str, filters: Mapping[str, str]) -> Iterable[Mapping[str, object]]: ...


def csv_response(
    db: Session,
    report_name: str,
    filters: Mapping[str, str],
    provider: ReportExportProvider,
) -> StreamingResponse:
    columns = provider.columns(report_name)

    def generate():
        buffer = io.StringIO(newline="")
        writer = csv.writer(buffer, lineterminator="\r\n")
        writer.writerow(columns)
        yield buffer.getvalue()
        for row in provider.iter_rows(db, report_name, filters):
            buffer.seek(0)
            buffer.truncate(0)
            writer.writerow([row.get(column, "") for column in columns])
            yield buffer.getvalue()

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="stocksense_{report_name}_report.csv"'},
    )