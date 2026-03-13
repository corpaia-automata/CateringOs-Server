from django.template.loader import render_to_string
from weasyprint import HTML


def generate_pdf(template_name: str, context: dict) -> bytes:
    html_string = render_to_string(template_name, context)
    return HTML(string=html_string).write_pdf()
