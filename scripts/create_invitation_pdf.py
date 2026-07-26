from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = ROOT / "output" / "pdf"
TEMPLATE_PATH = PUBLIC / "invitation-confirmation-template.pdf"
SAMPLE_PATH = OUTPUT / "convite-confirmacao-exemplo.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
IVORY = HexColor("#F2E4C8")
PAPER_LIGHT = HexColor("#FAF3E4")
INK = HexColor("#432A1E")
WINE = HexColor("#781F27")
GOLD = HexColor("#B78A49")
MUTED = HexColor("#755946")

FLORAL = ImageReader(PUBLIC / "menu-floral-corner-painted-v1.png")
COUPLE = ImageReader(PUBLIC / "couple-caricature-painted-v1.png")


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
    pdf.circle(90, PAGE_HEIGHT - 120, 170, fill=1, stroke=0)
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.8)
    pdf.rect(22, 22, PAGE_WIDTH - 44, PAGE_HEIGHT - 44, fill=0, stroke=1)
    pdf.setStrokeColor(Color(0.45, 0.28, 0.15, alpha=0.24))
    pdf.setLineWidth(0.45)
    pdf.rect(29, 29, PAGE_WIDTH - 58, PAGE_HEIGHT - 58, fill=0, stroke=1)
    pdf.drawImage(
        FLORAL,
        -42,
        PAGE_HEIGHT - 214,
        238,
        238,
        preserveAspectRatio=True,
        mask="auto",
    )
    draw_rotated_image(pdf, FLORAL, PAGE_WIDTH - 196, -24, 238, 238, 180)


def draw_centered(pdf, text, y, font, size, color=INK):
    pdf.setFillColor(color)
    pdf.setFont(font, size)
    pdf.drawCentredString(PAGE_WIDTH / 2, y, text)


def draw_common_header(pdf):
    draw_centered(
        pdf,
        "CONFIRMAÇÃO DE PRESENÇA",
        PAGE_HEIGHT - 74,
        "Helvetica-Bold",
        8,
        WINE,
    )
    pdf.setFillColor(INK)
    pdf.setFont("Times-Bold", 31)
    pdf.drawRightString(PAGE_WIDTH / 2 - 18, PAGE_HEIGHT - 119, "Djalma")
    pdf.setFillColor(WINE)
    pdf.setFont("Times-Italic", 27)
    pdf.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 119, "&")
    pdf.setFillColor(INK)
    pdf.setFont("Times-Bold", 31)
    pdf.drawString(PAGE_WIDTH / 2 + 18, PAGE_HEIGHT - 119, "Victoria")
    draw_centered(
        pdf,
        "convidamos você para celebrar nosso casamento",
        PAGE_HEIGHT - 148,
        "Times-Italic",
        12,
        MUTED,
    )
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.6)
    pdf.line(150, PAGE_HEIGHT - 168, PAGE_WIDTH - 150, PAGE_HEIGHT - 168)
    draw_centered(
        pdf,
        "31 DE OUTUBRO DE 2026  •  16H20",
        PAGE_HEIGHT - 190,
        "Helvetica-Bold",
        10,
        WINE,
    )


def draw_footer(pdf):
    draw_centered(pdf, "VILLA GARDEN", 76, "Helvetica-Bold", 9, WINE)
    draw_centered(
        pdf,
        "R. Dr. Rodrigo Codes Sandoval, 76 - Mondubim",
        59,
        "Times-Roman",
        9,
        MUTED,
    )
    draw_centered(pdf, "Fortaleza - CE, 60711-455", 45, "Times-Roman", 9, MUTED)


def draw_first_page_base(pdf):
    draw_paper(pdf)
    draw_common_header(pdf)
    pdf.drawImage(
        COUPLE,
        223,
        326,
        150,
        300,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )
    pdf.setFillColor(Color(0.98, 0.95, 0.88, alpha=0.88))
    pdf.roundRect(75, 112, PAGE_WIDTH - 150, 190, 5, fill=1, stroke=0)
    pdf.setStrokeColor(Color(0.47, 0.12, 0.15, alpha=0.42))
    pdf.setLineWidth(0.7)
    pdf.roundRect(75, 112, PAGE_WIDTH - 150, 190, 5, fill=0, stroke=1)
    draw_centered(
        pdf,
        "PARTICIPAÇÃO CONFIRMADA",
        276,
        "Helvetica-Bold",
        9,
        WINE,
    )
    draw_footer(pdf)


def draw_list_page_base(pdf):
    draw_paper(pdf)
    draw_common_header(pdf)
    draw_centered(
        pdf,
        "CONVIDADOS CONFIRMADOS",
        PAGE_HEIGHT - 230,
        "Helvetica-Bold",
        10,
        WINE,
    )
    pdf.setFillColor(Color(0.98, 0.95, 0.88, alpha=0.86))
    pdf.roundRect(68, 112, PAGE_WIDTH - 136, 465, 5, fill=1, stroke=0)
    pdf.setStrokeColor(Color(0.47, 0.12, 0.15, alpha=0.42))
    pdf.roundRect(68, 112, PAGE_WIDTH - 136, 465, 5, fill=0, stroke=1)
    draw_footer(pdf)


def fit_text(pdf, text, font, max_size, max_width, min_size=8):
    size = max_size
    while size > min_size and stringWidth(text, font, size) > max_width:
        size -= 0.5
    return size


def draw_personalization(pdf, family, names):
    draw_centered(pdf, family.upper(), 253, "Times-Italic", 11, MUTED)
    first_page_names = names[:5]
    start_y = 224
    for index, name in enumerate(first_page_names):
        size = fit_text(pdf, name, "Times-Bold", 15, PAGE_WIDTH - 210)
        draw_centered(pdf, name, start_y - index * 24, "Times-Bold", size, INK)

    remaining = names[5:]
    while remaining:
        pdf.showPage()
        draw_list_page_base(pdf)
        draw_centered(pdf, family.upper(), 548, "Times-Italic", 11, MUTED)
        page_names = remaining[:18]
        for index, name in enumerate(page_names):
            size = fit_text(pdf, name, "Times-Bold", 14, PAGE_WIDTH - 185)
            draw_centered(pdf, name, 516 - index * 22, "Times-Bold", size, INK)
        remaining = remaining[18:]


def build_pdf(path, personalized=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    pdf.setTitle("Djalma & Victoria - Confirmação de presença")
    draw_first_page_base(pdf)
    if personalized:
        draw_personalization(
            pdf,
            "Família do noivo - Djalma",
            [
                "Convidado Exemplo",
                "Acompanhante Um",
                "Acompanhante Dois",
                "Acompanhante Três",
                "Acompanhante Quatro",
                "Acompanhante Cinco",
                "Acompanhante Seis",
            ],
        )
    else:
        pdf.showPage()
        draw_list_page_base(pdf)
    pdf.save()


if __name__ == "__main__":
    build_pdf(TEMPLATE_PATH)
    build_pdf(SAMPLE_PATH, personalized=True)
    print(TEMPLATE_PATH)
    print(SAMPLE_PATH)
