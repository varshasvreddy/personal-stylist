from django.conf import settings
from django.db import models

from .catalog import CATEGORY_CHOICES


class Profile(models.Model):
    """Style preferences. One per user, created on first use."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    styles = models.JSONField(default=list, blank=True)
    fit = models.CharField(max_length=20, blank=True)
    hair_length = models.CharField(max_length=20, blank=True)
    hair_texture = models.CharField(max_length=20, blank=True)
    love = models.JSONField(default=list, blank=True)
    avoid = models.JSONField(default=list, blank=True)
    undertone = models.CharField(max_length=20, blank=True)
    notes = models.CharField(max_length=400, blank=True)

    def __str__(self):
        return f"Profile of {self.user}"


class Garment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="garments")
    name = models.CharField(max_length=60)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    color = models.CharField(max_length=20)
    pattern = models.CharField(max_length=20, default="solid")
    formality = models.PositiveSmallIntegerField(default=2)  # 1 casual ... 5 formal
    warmth = models.PositiveSmallIntegerField(default=2)  # 1 light ... 3 heavy
    photo = models.ImageField(upload_to="garments/%Y/%m/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["user", "category"])]

    def __str__(self):
        return f"{self.name} ({self.category})"


class Look(models.Model):
    """A suggested outfit. Rating, picking it, the worn photo and its review all live here."""

    SOURCES = [("claude", "Claude"), ("rules", "Built-in rules")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="looks")
    garments = models.ManyToManyField(Garment, through="LookItem", related_name="looks")
    occasion = models.CharField(max_length=20)
    occasion_label = models.CharField(max_length=120)
    details = models.CharField(max_length=160, blank=True)
    temperature = models.SmallIntegerField(default=26)
    rain = models.BooleanField(default=False)
    title = models.CharField(max_length=80)
    hair = models.CharField(max_length=300, blank=True)
    why = models.TextField(blank=True)
    tip = models.CharField(max_length=300, blank=True)
    missing = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=10, choices=SOURCES, default="rules")
    rating = models.PositiveSmallIntegerField(default=0)
    chosen = models.BooleanField(default=False)
    chosen_at = models.DateTimeField(null=True, blank=True)
    photo = models.ImageField(upload_to="looks/%Y/%m/", blank=True, null=True)
    review = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["user", "chosen"])]

    def __str__(self):
        return f"{self.title} for {self.occasion_label}"


class LookItem(models.Model):
    look = models.ForeignKey(Look, on_delete=models.CASCADE, related_name="entries")
    garment = models.ForeignKey(Garment, on_delete=models.CASCADE)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position"]
        unique_together = [("look", "garment")]
