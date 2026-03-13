import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment


def create_workbook() -> openpyxl.Workbook:
    return openpyxl.Workbook()


def workbook_to_bytes(wb: openpyxl.Workbook) -> bytes:
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
