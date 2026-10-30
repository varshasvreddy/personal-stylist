"""Upload handling: check it really is an image, fix its rotation, shrink it, re-encode as JPEG."""
import io

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework import serializers

MAX_BYTES = 6 * 1024 * 1024


def process_upload(upload, max_px=900, quality=82):
    if upload.size > MAX_BYTES:
        raise serializers.ValidationError("That photo is over 6 MB. Choose a smaller one.")
    try:
        img = Image.open(upload)
        img.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise serializers.ValidationError("That file is not a readable image. Use a JPEG, PNG or WebP photo.")
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "L"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.convert("RGBA").split()[-1])
        img = background
    img = img.convert("RGB")
    img.thumbnail((max_px, max_px))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True)
    return ContentFile(buf.getvalue(), name="photo.jpg")
