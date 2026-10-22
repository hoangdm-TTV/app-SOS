import io
import os
import sys
from pathlib import Path
from typing import List, Optional
import qrcode
from PIL import Image, ImageDraw, ImageFont
from app.config import settings


def generate_qr_image(
    target_url: str,
    header_text: str = "SOS KHẨN CẤP",
    footer_text: str = "",
    box_size: int = 10,
    border: int = 2,
) -> Image.Image:
    """Generate high-resolution printable QR code image with headers and location labels."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    qr_w, qr_h = qr_img.size

    # Extra padding for title header and footer label
    top_padding = 60
    bottom_padding = 80 if footer_text else 20
    canvas_w = qr_w + 40
    canvas_h = qr_h + top_padding + bottom_padding

    # Create white canvas
    canvas = Image.new("RGB", (canvas_w, canvas_h), color="white")
    draw = ImageDraw.Draw(canvas)

    # Load default font
    try:
        font_header = ImageFont.load_default()
        font_footer = ImageFont.load_default()
    except Exception:
        font_header = None
        font_footer = None

    # Draw Red Header Bar
    draw.rectangle([(0, 0), (canvas_w, top_padding - 10)], fill="#D32F2F")
    if font_header:
        # Centered Header Text
        bbox = draw.textbbox((0, 0), header_text, font=font_header)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        draw.text(
            ((canvas_w - text_w) / 2, (top_padding - 10 - text_h) / 2),
            header_text,
            fill="white",
            font=font_header,
        )

    # Paste QR Code into Canvas
    qr_x = (canvas_w - qr_w) // 2
    qr_y = top_padding
    canvas.paste(qr_img, (qr_x, qr_y))

    # Draw Footer Text
    if footer_text and font_footer:
        bbox_f = draw.textbbox((0, 0), footer_text, font=font_footer)
        footer_w = bbox_f[2] - bbox_f[0]
        footer_y = qr_y + qr_h + 15
        draw.text(
            ((canvas_w - footer_w) / 2, footer_y),
            footer_text,
            fill="#1A237E",
            font=font_footer,
        )

    # Draw outer frame
    draw.rectangle([(0, 0), (canvas_w - 1, canvas_h - 1)], outline="#B0BEC5", width=2)
    return canvas


def generate_qr_bytes(
    target_url: str,
    header_text: str = "SOS KHẨN CẤP",
    footer_text: str = "",
) -> bytes:
    """Return PNG image bytes for HTTP endpoint response."""
    img = generate_qr_image(target_url, header_text, footer_text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


async def batch_generate_from_db(output_dir: str = "generated_qrcodes") -> List[str]:
    """CLI tool helper to generate QR code files for all locations in the database."""
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.location import Location

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    generated_files = []
    async with AsyncSessionLocal() as session:
        stmt = select(Location).order_by(Location.code)
        result = await session.execute(stmt)
        locations = result.scalars().all()

        print(f"Generating QR codes for {len(locations)} locations into {out_path.resolve()}...")
        for loc in locations:
            target_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/sos?location_id={loc.id}"
            footer_label = f"MÃ: {loc.code} - {loc.name_display[:30]}"
            img = generate_qr_image(
                target_url=target_url,
                header_text=f"SOS - {loc.type.value}",
                footer_text=footer_label,
            )
            safe_filename = f"{loc.type.value}_{loc.code}.png".replace("/", "_").replace(" ", "_")
            file_dest = out_path / safe_filename
            img.save(file_dest, format="PNG")
            generated_files.append(str(file_dest))
            print(f"  [+] Saved {file_dest.name} -> {target_url}")

    return generated_files


if __name__ == "__main__":
    import asyncio
    print("Running batch QR generator...")
    asyncio.run(batch_generate_from_db())
