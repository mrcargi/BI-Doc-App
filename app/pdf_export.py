"""
pdf_export.py — Genera un PDF ejecutivo profesional para reportes PBI Docs
Diseñado para presentar a directivos con branding NADRO.
"""
import io
import os
from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, CondPageBreak,
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas as pdfcanvas

from pypdf import PdfReader, PdfWriter


# ── Brand Colors ─────────────────────────────────────────────
BRAND_900  = HexColor('#14532d')
BRAND_800  = HexColor('#166534')
BRAND_700  = HexColor('#15803d')
BRAND_600  = HexColor('#16a34a')
BRAND_500  = HexColor('#22c55e')
BRAND_100  = HexColor('#dcfce7')
BRAND_50   = HexColor('#f0fdf4')

INK_900    = HexColor('#1c1917')
INK_700    = HexColor('#44403c')
INK_500    = HexColor('#78716c')
INK_400    = HexColor('#a8a29e')
INK_300    = HexColor('#d6d3d1')

SURF_50    = HexColor('#fafaf9')
SURF_100   = HexColor('#f5f5f4')
SURF_200   = HexColor('#e7e5e4')

BLUE       = HexColor('#2563eb')
BLUE_LT    = HexColor('#eff6ff')
VIOLET     = HexColor('#7c3aed')
VIOLET_LT  = HexColor('#f5f3ff')
AMBER      = HexColor('#d97706')
AMBER_LT   = HexColor('#fffbeb')
RED        = HexColor('#dc2626')

TYPE_COLORS = {
    'import': (BRAND_600, BRAND_50),
    'calc':   (BLUE, BLUE_LT),
    'empty':  (VIOLET, VIOLET_LT),
    'param':  (AMBER, AMBER_LT),
}
TYPE_LABELS = {
    'import': 'Import', 'calc': 'Calculada', 'empty': 'Vacía', 'param': 'Parámetro',
}

ESTADO_COLORS = {
    'activo': BRAND_600,
    'desarrollo': AMBER,
    'deprecado': RED,
}


# ── Styles ───────────────────────────────────────────────────
def build_styles():
    s = getSampleStyleSheet()

    s.add(ParagraphStyle('CoverTitle', fontName='Helvetica-Bold', fontSize=28,
                         textColor=white, leading=34, alignment=TA_LEFT))
    s.add(ParagraphStyle('CoverSub', fontName='Helvetica', fontSize=12,
                         textColor=HexColor('#a7f3d0'), leading=16, alignment=TA_LEFT))
    s.add(ParagraphStyle('CoverMeta', fontName='Helvetica', fontSize=10,
                         textColor=HexColor('#86efac'), leading=14, alignment=TA_LEFT))

    s.add(ParagraphStyle('SecNum', fontName='Helvetica-Bold', fontSize=9,
                         textColor=white, alignment=TA_CENTER, leading=12))
    s.add(ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=15,
                         textColor=INK_900, spaceBefore=20, spaceAfter=10, leading=19))
    s.add(ParagraphStyle('SubSec', fontName='Helvetica-Bold', fontSize=11,
                         textColor=INK_700, spaceBefore=10, spaceAfter=6, leading=14))

    s.add(ParagraphStyle('Body', fontName='Helvetica', fontSize=9.5,
                         textColor=INK_700, spaceAfter=6, leading=13.5))
    s.add(ParagraphStyle('BodySmall', fontName='Helvetica', fontSize=8.5,
                         textColor=INK_500, spaceAfter=4, leading=12))
    s.add(ParagraphStyle('Mono', fontName='Courier', fontSize=8,
                         textColor=INK_700, leading=11))

    s.add(ParagraphStyle('CellH', fontName='Helvetica-Bold', fontSize=8,
                         textColor=INK_400, leading=11))
    s.add(ParagraphStyle('Cell', fontName='Helvetica', fontSize=8.5,
                         textColor=INK_700, leading=12))
    s.add(ParagraphStyle('CellB', fontName='Helvetica-Bold', fontSize=8.5,
                         textColor=INK_900, leading=12))
    s.add(ParagraphStyle('CellMono', fontName='Courier', fontSize=8,
                         textColor=INK_500, leading=11))
    s.add(ParagraphStyle('CellSm', fontName='Helvetica', fontSize=7.5,
                         textColor=INK_400, leading=10))

    s.add(ParagraphStyle('MetricVal', fontName='Helvetica-Bold', fontSize=22,
                         textColor=BRAND_700, alignment=TA_CENTER, leading=26))
    s.add(ParagraphStyle('MetricLbl', fontName='Helvetica-Bold', fontSize=7,
                         textColor=INK_400, alignment=TA_CENTER, leading=10,
                         spaceAfter=0))

    s.add(ParagraphStyle('KVKey', fontName='Helvetica-Bold', fontSize=8.5,
                         textColor=INK_400, leading=12))
    s.add(ParagraphStyle('KVVal', fontName='Helvetica', fontSize=8.5,
                         textColor=INK_900, leading=12))

    s.add(ParagraphStyle('Footer', fontName='Helvetica', fontSize=7,
                         textColor=INK_400, alignment=TA_CENTER))
    return s


# ── Custom Flowables ─────────────────────────────────────────
class RoundedBox(Flowable):
    """A rounded rectangle container with optional border-top accent."""
    def __init__(self, content_table, accent_color=None, padding=12):
        Flowable.__init__(self)
        self.content = content_table
        self.accent = accent_color
        self.pad = padding

    def wrap(self, aw, ah):
        w, h = self.content.wrap(aw - self.pad * 2, ah)
        self.content_w = w
        self.content_h = h
        self.width = aw
        self.height = h + self.pad * 2
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        c.setStrokeColor(SURF_200)
        c.setLineWidth(0.5)
        c.setFillColor(white)
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=1)
        if self.accent:
            c.setFillColor(self.accent)
            c.rect(0, self.height - 3, self.width, 3, fill=1, stroke=0)
        self.content.drawOn(c, self.pad, self.pad)


class GreenAccentLine(Flowable):
    """A subtle green accent line."""
    def __init__(self, width=500):
        Flowable.__init__(self)
        self._width = width
        self.height = 1

    def wrap(self, aw, ah):
        return (aw, 6)

    def draw(self):
        self.canv.setStrokeColor(BRAND_100)
        self.canv.setLineWidth(1)
        self.canv.line(0, 3, self._width, 3)


class SectionHeader(Flowable):
    """Section header: green pill with number + title text."""
    def __init__(self, number, title, width=500):
        Flowable.__init__(self)
        self.num = str(number)
        self.title = title
        self._width = width
        self.height = 24

    def wrap(self, aw, ah):
        return (aw, self.height + 8)

    def draw(self):
        c = self.canv
        # Green pill with number
        c.setFillColor(BRAND_600)
        c.roundRect(0, 4, 22, 18, 4, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 9)
        c.drawCentredString(11, 10, self.num)
        # Title
        c.setFillColor(INK_900)
        c.setFont('Helvetica-Bold', 14)
        c.drawString(30, 8, self.title)
        # Subtle line under
        c.setStrokeColor(SURF_200)
        c.setLineWidth(0.5)
        c.line(0, 0, self._width, 0)


# ── Cover Page ───────────────────────────────────────────────
def _draw_cover(canvas, doc_data):
    """Draw a professional, centered cover page for executive presentation."""
    from reportlab.lib.utils import ImageReader

    c = canvas
    w, h = LETTER
    cx = w / 2  # center x

    # Full green gradient background (darker, more formal)
    steps = 50
    for i in range(steps):
        ratio = i / steps
        r = 0.059 + ratio * 0.06
        g = 0.298 + ratio * 0.12
        b = 0.165 + ratio * 0.16
        color = Color(r, g, b)
        c.setFillColor(color)
        y = h - (h * (i + 1) / steps)
        c.rect(0, y, w, h / steps + 1, fill=1, stroke=0)

    # Subtle decorative circles
    c.setFillColor(Color(1, 1, 1, 0.03))
    c.circle(w - 60, h - 60, 200, fill=1, stroke=0)
    c.circle(60, 80, 160, fill=1, stroke=0)

    # Thin decorative line across the page
    c.setStrokeColor(Color(1, 1, 1, 0.08))
    c.setLineWidth(0.5)
    c.line(80, h / 2 + 140, w - 80, h / 2 + 140)
    c.line(80, h / 2 - 120, w - 80, h / 2 - 120)

    # Reset canvas transparency state — decorative elements above
    # set alpha to 0.03/0.08 which persists for drawImage calls
    c.saveState()
    c.setFillColor(Color(1, 1, 1, 1))  # fully opaque

    # ── Logos (NADRO white on green × X-Data original on green) ──
    from PIL import Image as PILImage

    static_dir = Path(__file__).resolve().parent.parent / 'static' / 'img'
    logo_y = h - 130
    gap = 16
    sep_w = 24
    # Background green to composite onto (matches gradient ~top area)
    bg_rgb = (20, 83, 45)

    def _logo_on_green(img_path, make_white=False):
        """Flatten logo to solid RGB on green background."""
        raw = PILImage.open(img_path)
        # Convert palette/other modes to RGBA properly
        img = raw.convert('RGBA')
        # Create green background, composite, then convert to RGB
        # This handles all alpha blending correctly
        green_bg = PILImage.new('RGBA', img.size, (*bg_rgb, 255))
        if make_white:
            # Turn all visible pixels white before compositing
            white_img = PILImage.new('RGBA', img.size, (0, 0, 0, 0))
            wpx = white_img.load()
            spx = img.load()
            for yp in range(img.height):
                for xp in range(img.width):
                    a = spx[xp, yp][3]
                    if a > 10:
                        wpx[xp, yp] = (255, 255, 255, 255)
            result = PILImage.alpha_composite(green_bg, white_img)
        else:
            # Make semi-transparent pixels fully opaque
            opaque_img = img.copy()
            opx = opaque_img.load()
            for yp in range(img.height):
                for xp in range(img.width):
                    pr, pg, pb, a = opx[xp, yp]
                    if a > 10:
                        opx[xp, yp] = (pr, pg, pb, 255)
                    else:
                        opx[xp, yp] = (0, 0, 0, 0)
            result = PILImage.alpha_composite(green_bg, opaque_img)
        rgb = result.convert('RGB')
        buf = io.BytesIO()
        rgb.save(buf, format='JPEG', quality=95)
        buf.seek(0)
        return ImageReader(buf)

    # Load NADRO logo (white version composited on green)
    nadro_img, nadro_w, nadro_h = None, 0, 0
    try:
        nadro_path = static_dir / 'nadro-logo.png'
        if nadro_path.exists():
            nadro_img = _logo_on_green(nadro_path, make_white=True)
            nadro_h = 40
            iw, ih = nadro_img.getSize()
            nadro_w = nadro_h * iw / ih
    except Exception:
        pass

    # Load X-Data logo (original colors composited on green)
    xdata_img, xdata_w, xdata_h = None, 0, 0
    try:
        xdata_path = static_dir / 'xdata-logo-hd.png'
        if not xdata_path.exists():
            xdata_path = static_dir / 'xdata-logo.png'
        if xdata_path.exists():
            xdata_img = _logo_on_green(xdata_path, make_white=False)
            xdata_h = 50
            iw, ih = xdata_img.getSize()
            xdata_w = xdata_h * iw / ih
    except Exception:
        pass

    total_w = nadro_w + gap + sep_w + gap + xdata_w
    start_x = cx - total_w / 2
    row_h = max(nadro_h, xdata_h)

    # Draw NADRO logo (solid white on green)
    if nadro_img:
        ny = logo_y + (row_h - nadro_h) / 2
        c.drawImage(nadro_img, start_x, ny,
                    nadro_w, nadro_h)

    # × separator
    c.setFont('Helvetica', 20)
    c.setFillColor(Color(1, 1, 1, 0.4))
    sep_x = start_x + nadro_w + gap + sep_w / 2
    c.drawCentredString(sep_x, logo_y + row_h / 2 - 6, '×')

    # Draw X-Data logo (original colors on green)
    # Reset alpha after × separator set it to 0.4
    c.setFillColor(Color(1, 1, 1, 1))
    if xdata_img:
        xd_x = start_x + nadro_w + gap + sep_w + gap
        xd_y = logo_y + (row_h - xdata_h) / 2
        c.drawImage(xdata_img, xd_x, xd_y,
                    xdata_w, xdata_h)

    c.restoreState()  # restore after logo drawing

    # ── "DOCUMENTACIÓN DEL REPORTE" label ──
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(Color(1, 1, 1, 0.5))
    c.drawCentredString(cx, h / 2 + 110, 'DOCUMENTACIÓN DEL REPORTE')

    # ── Report Name (centered, large) ──
    name = doc_data.get('name', 'Reporte')
    c.setFillColor(white)
    max_w = w - 140

    # Determine font size that fits
    font_size = 34
    while font_size > 18 and c.stringWidth(name, 'Helvetica-Bold', font_size) > max_w:
        font_size -= 2

    c.setFont('Helvetica-Bold', font_size)
    # Word wrap if still too long
    if c.stringWidth(name, 'Helvetica-Bold', font_size) > max_w:
        words = name.split()
        lines, current = [], ''
        for word in words:
            test = f'{current} {word}'.strip()
            if c.stringWidth(test, 'Helvetica-Bold', font_size) > max_w:
                lines.append(current)
                current = word
            else:
                current = test
        if current:
            lines.append(current)
        y_start = h / 2 + 80
        for i, line in enumerate(lines):
            c.drawCentredString(cx, y_start - i * (font_size + 8), line)
    else:
        c.drawCentredString(cx, h / 2 + 80, name)

    # ── Description (centered) ──
    desc = doc_data.get('desc', '')
    if desc:
        c.setFont('Helvetica', 10)
        c.setFillColor(Color(1, 1, 1, 0.55))
        if len(desc) > 200:
            desc = desc[:197] + '...'
        words = desc.split()
        lines, current = [], ''
        for word in words:
            test = f'{current} {word}'.strip()
            if c.stringWidth(test, 'Helvetica', 10) > max_w:
                lines.append(current)
                current = word
            else:
                current = test
        if current:
            lines.append(current)
        y_desc = h / 2 + 30
        for i, line in enumerate(lines[:4]):
            c.drawCentredString(cx, y_desc - i * 15, line)

    # ── Metadata table (centered, clean) ──
    meta_items = []
    if doc_data.get('area'):
        meta_items.append(('Área', doc_data['area']))
    if doc_data.get('direccion'):
        meta_items.append(('Dirección', doc_data['direccion']))
    if doc_data.get('responsable'):
        meta_items.append(('Responsable', doc_data['responsable']))
    estado = doc_data.get('estado', 'activo')
    meta_items.append(('Estado', estado.upper()))
    if doc_data.get('compat'):
        meta_items.append(('Compatibilidad', f"PBI {doc_data['compat']}"))

    if meta_items:
        row_h = 18
        col_w = 200
        table_h = len(meta_items) * row_h
        table_y = h / 2 - 150
        table_x = cx - col_w  # total width = col_w * 2

        # Table background
        c.setFillColor(Color(1, 1, 1, 0.06))
        c.roundRect(table_x - 10, table_y - 6, col_w * 2 + 20, table_h + 12, 6, fill=1, stroke=0)

        for i, (key, val) in enumerate(meta_items):
            y = table_y + table_h - (i + 1) * row_h + 5
            c.setFont('Helvetica', 8.5)
            c.setFillColor(Color(1, 1, 1, 0.45))
            c.drawRightString(cx - 10, y, key)
            c.setFont('Helvetica-Bold', 8.5)
            c.setFillColor(Color(1, 1, 1, 0.85))
            c.drawString(cx + 10, y, val)

    # ── Footer area ──
    # Thin separator
    c.setStrokeColor(Color(1, 1, 1, 0.1))
    c.setLineWidth(0.5)
    c.line(100, 80, w - 100, 80)

    # Date centered
    c.setFont('Helvetica', 8.5)
    c.setFillColor(Color(1, 1, 1, 0.4))
    c.drawCentredString(cx, 60, f'Generado el {datetime.now().strftime("%d de %B de %Y · %H:%M")}')

    # Tags centered
    tags = doc_data.get('tags', [])
    if tags:
        c.setFont('Helvetica', 7.5)
        c.setFillColor(Color(1, 1, 1, 0.35))
        c.drawCentredString(cx, 42, '  '.join([f'#{t}' for t in tags]))

    # Platform label at very bottom
    c.setFont('Helvetica', 7)
    c.setFillColor(Color(1, 1, 1, 0.25))
    c.drawCentredString(cx, 22, 'PBI Docs · Plataforma de Documentación')


# ── Page Header/Footer ───────────────────────────────────────
def _header_footer(canvas, doc, doc_name=''):
    canvas.saveState()
    w, h = LETTER

    # Header — thin green line + branding
    canvas.setStrokeColor(BRAND_600)
    canvas.setLineWidth(1.5)
    canvas.line(40, h - 42, 40 + 60, h - 42)

    canvas.setStrokeColor(SURF_200)
    canvas.setLineWidth(0.5)
    canvas.line(105, h - 42, w - 40, h - 42)

    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(BRAND_700)
    canvas.drawString(40, h - 37, 'PBI Docs')

    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(INK_400)
    canvas.drawString(88, h - 37, '· NADRO')

    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(INK_400)
    canvas.drawRightString(w - 40, h - 37, doc_name)

    # Footer — line + date + page
    canvas.setStrokeColor(SURF_200)
    canvas.setLineWidth(0.5)
    canvas.line(40, 32, w - 40, 32)

    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(INK_400)
    canvas.drawString(40, 20, f'Generado: {datetime.now().strftime("%d/%m/%Y %H:%M")}')

    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(INK_400)
    canvas.drawCentredString(w / 2, 20, 'Confidencial · NADRO Analytics')

    canvas.setFont('Helvetica-Bold', 7)
    canvas.setFillColor(INK_500)
    canvas.drawRightString(w - 40, 20, f'Página {doc.page}')

    canvas.restoreState()


# ── Helper: Build clean table ────────────────────────────────
def _build_table(headers, rows, col_widths, accent_color=None):
    """Build a professional styled table."""
    h_row = [Paragraph(f'{h}', ParagraphStyle('_h', fontName='Helvetica-Bold',
              fontSize=7.5, textColor=INK_400, leading=10)) for h in headers]
    data = [h_row] + rows

    tbl = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), SURF_50),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('LINEBELOW', (0, 0), (-1, 0), 0.8, SURF_200),
        # Body rows
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, SURF_50]),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LINEBELOW', (0, 1), (-1, -2), 0.3, SURF_200),
        # Global
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # Outer border
        ('BOX', (0, 0), (-1, -1), 0.5, SURF_200),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]

    if accent_color:
        style_cmds.append(('LINEABOVE', (0, 0), (-1, 0), 2, accent_color))

    tbl.setStyle(TableStyle(style_cmds))
    return tbl


# ── Main PDF Builder ─────────────────────────────────────────
def generate_report_pdf(doc: dict) -> bytes:
    """Build a complete executive summary PDF. Returns PDF bytes."""
    buf = io.BytesIO()
    styles = build_styles()

    page_w, page_h = LETTER
    margin = 44

    template = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=margin, rightMargin=margin,
        topMargin=52, bottomMargin=46,
        title=doc.get('name', 'Reporte'),
        author='PBI Docs · NADRO Analytics',
    )

    story = []
    usable_w = page_w - margin * 2
    doc_name = doc.get('name', 'Sin nombre')

    tables_list = doc.get('tables', [])
    columns_list = doc.get('columns', [])
    folders_list = doc.get('folders', [])
    relations_list = doc.get('relations', [])
    total_measures = sum(len(f.get('measures', [])) for f in folders_list)
    active_rels = len([r for r in relations_list if r.get('active')])
    source = doc.get('source')

    # ═══════════════════════════════════════════════════════════
    #  PAGE 1: METRICS DASHBOARD
    # ═══════════════════════════════════════════════════════════
    story.append(Spacer(1, 4))

    # Section header
    story.append(SectionHeader('1', 'Resumen del Modelo', usable_w))
    story.append(Spacer(1, 12))

    # Metrics cards — 4 columns
    def _metric_cell(value, label, color):
        return Table(
            [[Paragraph(f'<font color="{color}">{value}</font>',
                        ParagraphStyle('_mv', fontName='Helvetica-Bold', fontSize=24,
                                       textColor=HexColor(color), alignment=TA_CENTER, leading=28))],
             [Paragraph(label,
                        ParagraphStyle('_ml', fontName='Helvetica-Bold', fontSize=7,
                                       textColor=INK_400, alignment=TA_CENTER, leading=10))]],
            colWidths=[usable_w / 4 - 8],
            rowHeights=[34, 16],
        )

    m1 = _metric_cell(str(len(tables_list)), 'TABLAS', '#15803d')
    m2 = _metric_cell(str(len(columns_list)), 'COLUMNAS', '#2563eb')
    m3 = _metric_cell(str(total_measures), 'MEDIDAS DAX', '#7c3aed')
    m4 = _metric_cell(str(active_rels), 'RELACIONES', '#d97706')

    metrics_row = Table([[m1, m2, m3, m4]], colWidths=[usable_w / 4] * 4)
    metrics_row.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (0, 0), 0.5, SURF_200),
        ('BOX', (1, 0), (1, 0), 0.5, SURF_200),
        ('BOX', (2, 0), (2, 0), 0.5, SURF_200),
        ('BOX', (3, 0), (3, 0), 0.5, SURF_200),
        ('LINEABOVE', (0, 0), (0, 0), 2, BRAND_600),
        ('LINEABOVE', (1, 0), (1, 0), 2, BLUE),
        ('LINEABOVE', (2, 0), (2, 0), 2, VIOLET),
        ('LINEABOVE', (3, 0), (3, 0), 2, AMBER),
        ('BACKGROUND', (0, 0), (-1, -1), white),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(metrics_row)
    story.append(Spacer(1, 12))

    # Details card — key-value pairs
    detail_items = [
        ('Área', doc.get('area', '—')),
        ('Dirección', doc.get('direccion', '—')),
        ('Responsable', doc.get('responsable', '—')),
        ('Compatibilidad', f"PBI {doc.get('compat', '—')}"),
        ('Creado', doc.get('createdAt', '—')),
        ('Actualizado', doc.get('updatedAt', '—')),
    ]
    detail_rows = []
    for k, v in detail_items:
        detail_rows.append([
            Paragraph(k, styles['KVKey']),
            Paragraph(str(v), styles['KVVal']),
        ])

    detail_tbl = Table(detail_rows, colWidths=[usable_w * 0.22, usable_w * 0.78])
    detail_tbl.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, SURF_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, SURF_200),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(detail_tbl)

    # Source summary (if exists)
    if source:
        story.append(Spacer(1, 8))
        src_items = [
            ('Conector', source.get('connector', '—')),
            ('Modo', source.get('mode', '—')),
        ]
        if source.get('url'):
            src_items.append(('URL', source['url']))

        src_rows = []
        for k, v in src_items:
            src_rows.append([
                Paragraph(k, styles['KVKey']),
                Paragraph(str(v), styles['KVVal']),
            ])

        src_tbl = Table(src_rows, colWidths=[usable_w * 0.22, usable_w * 0.78])
        src_tbl.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -2), 0.3, SURF_200),
            ('LINEABOVE', (0, 0), (-1, 0), 2, AMBER),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 0.5, SURF_200),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        story.append(src_tbl)

    # ═══════════════════════════════════════════════════════════
    #  2. TABLAS DEL MODELO
    # ═══════════════════════════════════════════════════════════
    if tables_list:
        story.append(Spacer(1, 6))
        story.append(SectionHeader('2', f'Tablas del Modelo ({len(tables_list)})', usable_w))
        story.append(Spacer(1, 8))

        headers = ['TABLA', 'TIPO', 'COLS', 'FILAS', 'DESCRIPCIÓN']
        rows = []
        for t in tables_list:
            type_label = TYPE_LABELS.get(t.get('type', ''), t.get('type', ''))
            rows.append([
                Paragraph(f"<b>{t.get('name', '')}</b>", styles['CellB']),
                Paragraph(type_label, styles['Cell']),
                Paragraph(str(t.get('cols', '')), styles['CellMono']),
                Paragraph(str(t.get('rows', '')), styles['CellSm']),
                Paragraph(t.get('desc', ''), styles['Cell']),
            ])

        col_w = [usable_w * 0.22, usable_w * 0.10, usable_w * 0.07, usable_w * 0.09, usable_w * 0.52]
        tbl = _build_table(headers, rows, col_w, accent_color=BRAND_600)
        story.append(tbl)

    # ═══════════════════════════════════════════════════════════
    #  3. RELACIONES
    # ═══════════════════════════════════════════════════════════
    visible_rels = [r for r in relations_list if 'Local' not in r.get('toTable', '')]
    if visible_rels:
        story.append(Spacer(1, 6))
        story.append(SectionHeader('3', f'Relaciones ({len(visible_rels)})', usable_w))
        story.append(Spacer(1, 8))

        headers = ['ORIGEN', 'COL.', '→', 'DESTINO', 'COL.', 'CARD.', 'DIR.', 'ESTADO']
        rows = []
        for r in visible_rels:
            dir_label = '↔' if r.get('dir') == 'BothDirections' else '→'
            estado = 'Activa' if r.get('active') else 'Inact.'
            est_style = ParagraphStyle('_e', fontName='Helvetica-Bold', fontSize=8,
                                        textColor=BRAND_600 if r.get('active') else INK_400, leading=11)
            rows.append([
                Paragraph(f"<b>{r.get('fromTable', '')}</b>", styles['CellB']),
                Paragraph(r.get('fromCol', ''), styles['CellMono']),
                Paragraph('→', styles['Cell']),
                Paragraph(f"<b>{r.get('toTable', '')}</b>", styles['CellB']),
                Paragraph(r.get('toCol', ''), styles['CellMono']),
                Paragraph(r.get('card', ''), styles['CellMono']),
                Paragraph(dir_label, styles['Cell']),
                Paragraph(estado, est_style),
            ])

        rw = usable_w
        r_widths = [rw * 0.16, rw * 0.12, rw * 0.04, rw * 0.16, rw * 0.12, rw * 0.10, rw * 0.06, rw * 0.08]
        rtbl = _build_table(headers, rows, r_widths, accent_color=BLUE)
        story.append(rtbl)

    # ═══════════════════════════════════════════════════════════
    #  4. COLUMNAS
    # ═══════════════════════════════════════════════════════════
    if columns_list:
        story.append(Spacer(1, 6))
        story.append(SectionHeader('4', f'Columnas ({len(columns_list)})', usable_w))
        story.append(Spacer(1, 8))

        headers = ['#', 'COLUMNA', 'TIPO', 'DESCRIPCIÓN']
        rows = []
        for i, c in enumerate(columns_list, 1):
            rows.append([
                Paragraph(str(i), styles['CellSm']),
                Paragraph(f"<b>{c.get('n', '')}</b>", styles['CellB']),
                Paragraph(c.get('t', ''), styles['Cell']),
                Paragraph(c.get('d', ''), styles['Cell']),
            ])

        c_widths = [usable_w * 0.05, usable_w * 0.25, usable_w * 0.10, usable_w * 0.60]
        ctbl = _build_table(headers, rows, c_widths, accent_color=BLUE)
        story.append(ctbl)

    # ═══════════════════════════════════════════════════════════
    #  5. MEDIDAS DAX
    # ═══════════════════════════════════════════════════════════
    if folders_list and total_measures > 0:
        story.append(Spacer(1, 6))
        story.append(SectionHeader('5', f'Medidas DAX ({total_measures} medidas)', usable_w))
        story.append(Spacer(1, 8))

        for folder in folders_list:
            measures = folder.get('measures', [])
            if not measures:
                continue

            fname = folder.get('name', 'Carpeta')
            fcolor_str = folder.get('color', '#78716c')
            try:
                fcolor = HexColor(fcolor_str)
            except:
                fcolor = INK_500

            # Folder sub-header
            story.append(Paragraph(
                f'<font color="{fcolor_str}">●</font>  <b>{fname}</b>  '
                f'<font color="#a8a29e" size="8">({len(measures)} medidas)</font>',
                styles['SubSec']))

            headers = ['MEDIDA', 'DESCRIPCIÓN']
            rows = []
            for m in measures:
                rows.append([
                    Paragraph(f"<b>{m.get('n', '')}</b>", styles['CellB']),
                    Paragraph(m.get('d', ''), styles['Cell']),
                ])

            m_widths = [usable_w * 0.32, usable_w * 0.68]
            mtbl = _build_table(headers, rows, m_widths, accent_color=fcolor)
            story.append(mtbl)
            story.append(Spacer(1, 8))

    # ═══════════════════════════════════════════════════════════
    #  6. FUENTE DE DATOS (detallada)
    # ═══════════════════════════════════════════════════════════
    if source:
        story.append(Spacer(1, 6))
        story.append(SectionHeader('6', 'Fuente de Datos', usable_w))
        story.append(Spacer(1, 8))

        src_fields = [
            ('Conector', source.get('connector', '—')),
            ('URL base', source.get('url', '—')),
            ('Carpeta', source.get('folder', '—')),
            ('Archivos', source.get('fileType', '—')),
            ('Modo', source.get('mode', '—')),
            ('API', source.get('api', '—')),
            ('Servicio', source.get('user', '—')),
        ]
        src_rows = []
        for k, v in src_fields:
            src_rows.append([
                Paragraph(k, styles['KVKey']),
                Paragraph(str(v or '—'), styles['KVVal']),
            ])

        src_tbl = Table(src_rows, colWidths=[usable_w * 0.18, usable_w * 0.82])
        src_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), SURF_50),
            ('LINEBELOW', (0, 0), (-1, -2), 0.3, SURF_200),
            ('LINEABOVE', (0, 0), (-1, 0), 2, AMBER),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('BOX', (0, 0), (-1, -1), 0.5, SURF_200),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        story.append(src_tbl)

        steps = source.get('steps', [])
        if steps:
            story.append(Spacer(1, 10))
            story.append(Paragraph('<b>Proceso de Transformación</b>', styles['SubSec']))
            for i, step in enumerate(steps, 1):
                step_row = Table(
                    [[Paragraph(str(i),
                        ParagraphStyle('_sn', fontName='Helvetica-Bold', fontSize=8,
                                       textColor=white, alignment=TA_CENTER, leading=11)),
                      Paragraph(step, styles['Cell'])]],
                    colWidths=[24, usable_w - 34],
                )
                step_row.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, 0), VIOLET),
                    ('ROUNDEDCORNERS', [3, 0, 0, 3]),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('LEFTPADDING', (0, 0), (0, 0), 4),
                    ('LEFTPADDING', (1, 0), (1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('BOX', (0, 0), (-1, -1), 0.3, SURF_200),
                ]))
                story.append(step_row)
                story.append(Spacer(1, 2))

    # ═══════════════════════════════════════════════════════════
    #  BUILD
    # ═══════════════════════════════════════���═══════════════════
    def first_page(canvas, doc_template):
        _draw_cover(canvas, doc)
        canvas.showPage()
        _header_footer(canvas, doc_template, doc_name=doc_name)

    def later_pages(canvas, doc_template):
        _header_footer(canvas, doc_template, doc_name=doc_name)

    # We need a cover page, so we add a PageBreak at the start
    # Actually, SimpleDocTemplate doesn't support drawing before the first flowable easily.
    # Instead, we'll build the cover as a separate PDF and merge.

    # Build content pages
    template.build(story, onFirstPage=later_pages, onLaterPages=later_pages)
    content_bytes = buf.getvalue()
    buf.close()

    # Build cover page
    cover_buf = io.BytesIO()
    cover_c = pdfcanvas.Canvas(cover_buf, pagesize=LETTER)
    _draw_cover(cover_c, doc)
    cover_c.save()
    cover_buf.seek(0)

    # Merge: cover + content
    writer = PdfWriter()

    cover_reader = PdfReader(cover_buf)
    writer.add_page(cover_reader.pages[0])

    content_reader = PdfReader(io.BytesIO(content_bytes))
    for page in content_reader.pages:
        writer.add_page(page)

    out_buf = io.BytesIO()
    writer.write(out_buf)
    final_bytes = out_buf.getvalue()
    out_buf.close()

    return final_bytes


def generate_report_pdf_with_attachment(doc: dict, pdfs_dir: Path) -> bytes:
    """
    Generate the executive summary PDF, and if the report has an attached PDF,
    append it at the end.
    """
    report_bytes = generate_report_pdf(doc)

    pdf_file = doc.get('pdfFile')
    if not pdf_file:
        return report_bytes

    attached_path = pdfs_dir / pdf_file
    if not attached_path.exists():
        return report_bytes

    # Merge: report + separator + attached PDF
    writer = PdfWriter()

    # Add report pages
    report_reader = PdfReader(io.BytesIO(report_bytes))
    for page in report_reader.pages:
        writer.add_page(page)

    # Add separator page
    sep_buf = io.BytesIO()
    sep_c = pdfcanvas.Canvas(sep_buf, pagesize=LETTER)
    w, h = LETTER

    # Dark background
    sep_c.setFillColor(INK_900)
    sep_c.rect(0, 0, w, h, fill=1)

    # Green accent line
    sep_c.setStrokeColor(BRAND_600)
    sep_c.setLineWidth(3)
    sep_c.line(w / 2 - 40, h / 2 + 50, w / 2 + 40, h / 2 + 50)

    # Title
    sep_c.setFillColor(white)
    sep_c.setFont('Helvetica-Bold', 24)
    sep_c.drawCentredString(w / 2, h / 2 + 15, 'Vista del Reporte')

    # Subtitle
    sep_c.setFillColor(INK_400)
    sep_c.setFont('Helvetica', 11)
    sep_c.drawCentredString(w / 2, h / 2 - 15, f'PDF adjunto: {pdf_file}')

    sep_c.setFont('Helvetica', 9)
    sep_c.setFillColor(INK_500)
    sep_c.drawCentredString(w / 2, h / 2 - 40, 'Las siguientes páginas contienen el reporte exportado desde Power BI')

    sep_c.save()
    sep_buf.seek(0)
    sep_reader = PdfReader(sep_buf)
    writer.add_page(sep_reader.pages[0])

    # Add attached PDF
    try:
        attached_reader = PdfReader(str(attached_path))
        for page in attached_reader.pages:
            writer.add_page(page)
    except Exception:
        pass

    out_buf = io.BytesIO()
    writer.write(out_buf)
    merged_bytes = out_buf.getvalue()
    out_buf.close()

    return merged_bytes
