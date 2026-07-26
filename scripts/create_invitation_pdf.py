from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = ROOT / "output" / "pdf"
TEMPLATE_PATH = PUBLIC / "invitation-confirmation-template.pdf"
SAMPLE_PATH = OUTPUT / "convite-confirmacao-exemplo.pdf"

PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)
IVORY = HexColor("#F2E4C8")
INK = HexColor("#432A1E")
WINE = HexColor("#781F27")
GOLD = HexColor("#B78A49")
MUTED = HexColor("#755946")

FLORAL = ImageReader(PUBLIC / "menu-floral-corner-painted-v1.png")
COUPLE = ImageReader(PUBLIC / "couple-caricature-painted-v1.png")

SIGNATURE_FONT = "Times-Italic"
signature_path = Path("/System/Library/Fonts/Supplemental/Zapfino.ttf")
if signature_path.exists():
    try:
        pdfmetrics.registerFont(TTFont("WeddingSignature", str(signature_path)))
        SIGNATURE_FONT = "WeddingSignature"
    except Exception:
        pass


def draw_rotated_image(pdf, image, x, y, width, height, angle):
    pdf.saveState()
    pdf.translate(x + width / 2, y + height / 2)
    pdf.rotate(angle)
    pdf.drawImage(
        image,
        -width / 2,
        -height / 2,
        width,
        height,
        preserveAspectRatio=True,
        mask="auto",
    )
    pdf.restoreState()


def draw_paper(pdf):
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    pdf.setFillColor(Color(1, 1, 1, alpha=0.2))
    pdf.circle(115, PAGE_HEIGHT - 100, 190, fill=1, stroke=0)
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.8)
    pdf.rect(22, 22, PAGE_WIDTH - 44, PAGE_HEIGHT - 44, fill=0, stroke=1)
    pdf.setStrokeColor(Color(0.45, 0.28, 0.15, alpha=0.24))
    pdf.setLineWidth(0.45)
    pdf.rect(29, 29, PAGE_WIDTH - 58, PAGE_HEIGHT - 58, fill=0, stroke=1)
    pdf.drawImage(
        FLORAL,
        -34,
        PAGE_HEIGHT - 194,
        210,
        210,
        preserveAspectRatio=True,
        mask="auto",
    )
    draw_rotated_image(pdf, FLORAL, PAGE_WIDTH - 176, -16, 210, 210, 180)


def draw_centered_at(pdf, text, center_x, y, font, size, color=INK):
    pdf.setFillColor(color)
    pdf.setFont(font, size)
    width = stringWidth(text, font, size)
    pdf.drawString(center_x - width / 2, y, text)


def draw_header(pdf, center_x):
    draw_centered_at(
        pdf,
        "CARTA DE CONFIRMAÇÃO",
        center_x,
        PAGE_HEIGHT - 68,
        "Times-Italic",
        9,
        WINE,
    )
    draw_centered_at(
        pdf,
        "Djalma & Victoria",
        center_x,
        PAGE_HEIGHT - 111,
        "Times-Bold",
        30,
        INK,
    )
    draw_centered_at(
        pdf,
        "convidamos você para celebrar nosso casamento",
        center_x,
        PAGE_HEIGHT - 138,
        "Times-Italic",
        12,
        MUTED,
    )
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.6)
    pdf.line(center_x - 150, PAGE_HEIGHT - 157, center_x + 150, PAGE_HEIGHT - 157)
    draw_centered_at(
        pdf,
        "sábado, 31 de outubro de 2026, às 16h20",
        center_x,
        PAGE_HEIGHT - 179,
        "Times-Italic",
        11,
        WINE,
    )


def draw_signature(pdf, center_x):
    draw_centered_at(
        pdf,
        "Com carinho,",
        center_x,
        64,
        "Times-Italic",
        10,
        MUTED,
    )
    draw_centered_at(
        pdf,
        "Djalma & Victoria",
        center_x,
        34,
        SIGNATURE_FONT,
        18 if SIGNATURE_FONT == "WeddingSignature" else 22,
        WINE,
    )


def draw_first_page_base(pdf):
    draw_paper(pdf)
    content_center = 305
    draw_header(pdf, content_center)
    pdf.setFillColor(Color(0.98, 0.95, 0.88, alpha=0.48))
    pdf.roundRect(56, 86, 504, 300, 7, fill=1, stroke=0)
    pdf.setStrokeColor(Color(0.72, 0.54, 0.29, alpha=0.35))
    pdf.setLineWidth(0.6)
    pdf.line(590, 82, 590, 470)
    pdf.drawImage(
        COUPLE,
        620,
        92,
        170,
        340,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )
    draw_signature(pdf, content_center)


def draw_continuation_page_base(pdf):
    draw_paper(pdf)
    center_x = PAGE_WIDTH / 2
    draw_header(pdf, center_x)
    pdf.setFillColor(Color(0.98, 0.95, 0.88, alpha=0.46))
    pdf.roundRect(76, 86, PAGE_WIDTH - 152, 300, 7, fill=1, stroke=0)
    draw_signature(pdf, center_x)


def format_names(names):
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} e {names[1]}"
    return f"{', '.join(names[:-1])} e {names[-1]}"


def letter_paragraphs(family, names):
    family_reference = (
        "família do noivo, Djalma"
        if "noivo" in family.lower()
        else "família da noiva, Victoria"
    )
    guest_names = format_names(names)
    return [
        "Queridos convidados,",
        (
            f"Com muita alegria, confirmamos a presença de {guest_names} em "
            "nosso casamento. É uma honra saber que viveremos este momento ao "
            f"lado de pessoas tão especiais da {family_reference}."
        ),
        (
            "Nosso encontro será no sábado, 31 de outubro de 2026, às 16h20, "
            "no Villa Garden, localizado na R. Dr. Rodrigo Codes Sandoval, 76, "
            "Mondubim, Fortaleza - CE."
        ),
        (
            "Guardem esta carta como uma pequena lembrança do convite para "
            "celebrarmos juntos o início de nossa nova história."
        ),
    ]


def wrap_paragraph(text, font, size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def build_letter_lines(paragraphs, font, size, max_width):
    lines = []
    for index, paragraph in enumerate(paragraphs):
        lines.extend(wrap_paragraph(paragraph, font, size, max_width))
        if index < len(paragraphs) - 1:
            lines.append("")
    return lines


def draw_letter_lines(pdf, lines, center_x, start_y, font, size, line_height):
    pdf.setFillColor(INK)
    pdf.setFont(font, size)
    for index, line in enumerate(lines):
        if line:
            width = stringWidth(line, font, size)
            pdf.drawString(center_x - width / 2, start_y - index * line_height, line)


def draw_personalization(pdf, family, names):
    font = "Times-Italic"
    size = 14
    line_height = 21
    paragraphs = letter_paragraphs(family, names)
    first_page_lines = build_letter_lines(paragraphs, font, size, 450)
    draw_letter_lines(pdf, first_page_lines[:13], 305, 360, font, size, line_height)

    remaining = first_page_lines[13:]
    while remaining:
        pdf.showPage()
        draw_continuation_page_base(pdf)
        page_lines = remaining[:13]
        draw_letter_lines(
            pdf,
            page_lines,
            PAGE_WIDTH / 2,
            360,
            font,
            size,
            line_height,
        )
        remaining = remaining[13:]


def build_pdf(path, personalized=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=landscape(A4), pageCompression=1)
    pdf.setTitle("Djalma & Victoria - Carta de confirmação")
    draw_first_page_base(pdf)
    if personalized:
        draw_personalization(
            pdf,
            "Família da noiva - Victoria",
            ["Deborah", "Mauro"],
        )
    else:
        pdf.showPage()
        draw_continuation_page_base(pdf)
    pdf.save()


if __name__ == "__main__":
    build_pdf(TEMPLATE_PATH)
    build_pdf(SAMPLE_PATH, personalized=True)
    print(TEMPLATE_PATH)
    print(SAMPLE_PATH)
