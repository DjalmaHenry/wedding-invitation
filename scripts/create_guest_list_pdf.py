from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = ROOT / "output" / "pdf"
TEMPLATE_PATH = PUBLIC / "guest-list-template.pdf"
PROVIDER_TEMPLATE_PATH = PUBLIC / "provider-list-template.pdf"
SAMPLE_PATH = OUTPUT / "lista-convidados-exemplo.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
IVORY = HexColor("#F2E4C8")
PANEL = HexColor("#F8EFD9")
INK = HexColor("#432A1E")
OLIVE = HexColor("#5F6D3F")
GOLD = HexColor("#B78A49")
MUTED = HexColor("#755946")
TERRACOTTA = HexColor("#85523C")
FLORAL = ImageReader(PUBLIC / "menu-floral-corner-painted-olive-v1.png")

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


def draw_centered(pdf, text, y, font, size, color=INK):
    pdf.setFillColor(color)
    pdf.setFont(font, size)
    width = stringWidth(text, font, size)
    pdf.drawString((PAGE_WIDTH - width) / 2, y, text)


def draw_template_page(pdf, provider_page=False):
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    pdf.setFillColor(Color(1, 1, 1, alpha=0.2))
    pdf.circle(92, PAGE_HEIGHT - 90, 160, fill=1, stroke=0)

    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.8)
    pdf.rect(21, 21, PAGE_WIDTH - 42, PAGE_HEIGHT - 42, fill=0, stroke=1)
    pdf.setStrokeColor(Color(0.45, 0.28, 0.15, alpha=0.24))
    pdf.setLineWidth(0.45)
    pdf.rect(28, 28, PAGE_WIDTH - 56, PAGE_HEIGHT - 56, fill=0, stroke=1)

    pdf.drawImage(
        FLORAL,
        -25,
        PAGE_HEIGHT - 160,
        170,
        170,
        preserveAspectRatio=True,
        mask="auto",
    )
    draw_rotated_image(pdf, FLORAL, PAGE_WIDTH - 142, -7, 170, 170, 180)

    draw_centered(
        pdf,
        "EQUIPE DO CASAMENTO" if provider_page else "LISTA DE CONVIDADOS",
        PAGE_HEIGHT - 88,
        "Times-Italic",
        14,
        TERRACOTTA if provider_page else OLIVE,
    )
    draw_centered(
        pdf,
        "Prestadores confirmados" if provider_page else "Djalma & Victoria",
        PAGE_HEIGHT - 132,
        "Times-Italic" if provider_page else SIGNATURE_FONT,
        25 if provider_page else (20 if SIGNATURE_FONT == "WeddingSignature" else 25),
        INK,
    )
    draw_centered(
        pdf,
        "31 de outubro de 2026  •  Villa Garden",
        PAGE_HEIGHT - 162,
        "Times-Italic",
        10,
        MUTED,
    )
    pdf.setStrokeColor(TERRACOTTA if provider_page else GOLD)
    pdf.setLineWidth(0.6)
    pdf.line(125, PAGE_HEIGHT - 180, PAGE_WIDTH - 125, PAGE_HEIGHT - 180)

    pdf.setFillColor(Color(0.98, 0.95, 0.88, alpha=0.56))
    pdf.roundRect(48, 102, PAGE_WIDTH - 96, 530, 8, fill=1, stroke=0)
    draw_centered(
        pdf,
        "Villa Garden  •  Fortaleza - CE",
        50,
        "Times-Italic",
        9,
        MUTED,
    )


def draw_sample_page(pdf, guests, page_number, total_pages):
    draw_template_page(pdf)
    draw_centered(
        pdf,
        f"{len(guests)} nomes nesta página  •  ordem alfabética",
        636,
        "Times-Italic",
        9,
        MUTED,
    )
    start_y = 603
    line_height = 23
    for index, (name, category) in enumerate(guests):
        y = start_y - index * line_height
        number = (page_number - 1) * 21 + index + 1
        pdf.setFillColor(MUTED)
        pdf.setFont("Times-Italic", 8)
        pdf.drawRightString(82, y, f"{number:02d}")
        pdf.setFillColor(INK)
        pdf.setFont("Times-Italic", 12.5)
        pdf.drawString(96, y, name)
        pdf.setFillColor(OLIVE)
        pdf.setFont("Times-Bold", 8)
        pdf.drawRightString(510, y, category.upper())
        pdf.setStrokeColor(Color(0.45, 0.28, 0.15, alpha=0.16))
        pdf.setLineWidth(0.35)
        pdf.line(72, y - 8, 522, y - 8)

    draw_centered(
        pdf,
        f"Página {page_number} de {total_pages}",
        78,
        "Times-Italic",
        8,
        MUTED,
    )


def build_template():
    TEMPLATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(TEMPLATE_PATH), pagesize=A4, pageCompression=1)
    pdf.setTitle("Djalma & Victoria - Modelo da lista de convidados")
    draw_template_page(pdf)
    pdf.showPage()
    draw_template_page(pdf)
    pdf.save()

    provider_pdf = canvas.Canvas(
        str(PROVIDER_TEMPLATE_PATH), pagesize=A4, pageCompression=1
    )
    provider_pdf.setTitle("Djalma & Victoria - Modelo da lista de prestadores")
    draw_template_page(provider_pdf, provider_page=True)
    provider_pdf.showPage()
    draw_template_page(provider_pdf, provider_page=True)
    provider_pdf.save()


def build_sample():
    sample_guests = [
        ("Adriana Bezerra", "Noiva"),
        ("Alexandre Lima", "Noivo"),
        ("Amanda Freitas", "Noiva"),
        ("Ana Clara Sousa", "Noiva"),
        ("André Moreira", "Noivo"),
        ("Beatriz Alves", "Noiva"),
        ("Bruno Martins", "Noivo"),
        ("Camila Oliveira", "Noiva"),
        ("Carlos Eduardo", "Noivo"),
        ("Carolina Mendes", "Noiva"),
        ("Daniel Rocha", "Noivo"),
        ("Débora Almeida", "Noiva"),
        ("Eduardo Nunes", "Noivo"),
        ("Fernanda Castro", "Noiva"),
        ("Gabriel Barbosa", "Noivo"),
        ("Helena Ribeiro", "Noiva"),
        ("Isabela Costa", "Noiva"),
        ("João Pedro Lima", "Noivo"),
        ("Júlia Fernandes", "Noiva"),
        ("Lucas Araújo", "Noivo"),
        ("Mariana Gomes", "Noiva"),
        ("Mateus Carvalho", "Noivo"),
        ("Natália Vieira", "Noiva"),
        ("Paulo Henrique", "Noivo"),
        ("Rafaela Cardoso", "Noiva"),
        ("Renato Monteiro", "Noivo"),
        ("Sabrina Lopes", "Noiva"),
        ("Samuel Teixeira", "Noivo"),
        ("Tatiane Moraes", "Noiva"),
        ("Thiago Batista", "Noivo"),
        ("Vanessa Correia", "Noiva"),
        ("Vinícius Andrade", "Noivo"),
    ]
    chunks = [
        sample_guests[index : index + 21]
        for index in range(0, len(sample_guests), 21)
    ]

    SAMPLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(SAMPLE_PATH), pagesize=A4, pageCompression=1)
    pdf.setTitle("Djalma & Victoria - Lista de convidados")
    for page_index, guests in enumerate(chunks, start=1):
        if page_index > 1:
            pdf.showPage()
        draw_sample_page(pdf, guests, page_index, len(chunks))
    pdf.save()


if __name__ == "__main__":
    build_template()
    build_sample()
    print(TEMPLATE_PATH)
    print(PROVIDER_TEMPLATE_PATH)
    print(SAMPLE_PATH)
