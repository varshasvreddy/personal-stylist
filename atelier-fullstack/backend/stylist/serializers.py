from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .catalog import COLORS, PATTERNS
from .images import process_upload
from .models import Garment, Look, Profile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=60)
    email = serializers.EmailField(max_length=120)
    password = serializers.CharField(write_only=True, max_length=128)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("An account with this email already exists. Log in instead.")
        return value

    def validate(self, attrs):
        validate_password(attrs["password"], user=User(username=attrs["email"], first_name=attrs["name"]))
        return attrs

    def create(self, data):
        user = User.objects.create_user(
            username=data["email"], email=data["email"], password=data["password"], first_name=data["name"].strip()
        )
        Profile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.first_name", max_length=60)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ["name", "email", "styles", "fit", "hair_length", "hair_texture", "love", "avoid", "undertone", "notes"]

    def _colors(self, value):
        if not isinstance(value, list) or any(v not in COLORS for v in value):
            raise serializers.ValidationError("Choose colours from the list.")
        return value

    def validate_love(self, value):
        return self._colors(value)

    def validate_avoid(self, value):
        return self._colors(value)

    def validate_styles(self, value):
        if not isinstance(value, list) or len(value) > 12 or any(not isinstance(v, str) or len(v) > 30 for v in value):
            raise serializers.ValidationError("Styles must be a short list of words.")
        return value

    def update(self, instance, validated):
        user_data = validated.pop("user", {})
        if "first_name" in user_data:
            instance.user.first_name = user_data["first_name"].strip()
            instance.user.save(update_fields=["first_name"])
        return super().update(instance, validated)


class GarmentSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Garment
        fields = ["id", "name", "category", "color", "pattern", "formality", "warmth", "photo", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give the piece a name.")
        return value

    def validate_color(self, value):
        if value not in COLORS:
            raise serializers.ValidationError("Choose a colour from the list.")
        return value

    def validate_pattern(self, value):
        if value not in PATTERNS:
            raise serializers.ValidationError("Choose a pattern from the list.")
        return value

    def validate_formality(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Dress code is 1 (casual) to 5 (formal).")
        return value

    def validate_warmth(self, value):
        if not 1 <= value <= 3:
            raise serializers.ValidationError("Weight is 1 (light) to 3 (heavy).")
        return value

    def validate_photo(self, value):
        return process_upload(value, max_px=700) if value else value


class LookSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    photo = serializers.ImageField(read_only=True)

    class Meta:
        model = Look
        fields = [
            "id", "occasion", "occasion_label", "details", "temperature", "rain", "title", "items", "hair", "why", "tip",
            "missing", "source", "rating", "chosen", "chosen_at", "photo", "review", "created_at",
        ]
        read_only_fields = [f for f in fields if f not in ("rating", "chosen")]

    def get_items(self, look):
        entries = look.entries.select_related("garment").order_by("position")
        return GarmentSerializer([e.garment for e in entries], many=True, context=self.context).data

    def validate_rating(self, value):
        if not 0 <= value <= 5:
            raise serializers.ValidationError("Rating is 0 to 5.")
        return value


class SuggestSerializer(serializers.Serializer):
    occasion = serializers.CharField(max_length=20)
    details = serializers.CharField(max_length=160, allow_blank=True, required=False, default="")
    temperature = serializers.IntegerField(min_value=-20, max_value=55, default=26)
    rain = serializers.BooleanField(default=False)
    mode = serializers.ChoiceField(choices=["auto", "rules"], default="auto")
    adjust = serializers.CharField(max_length=200, allow_blank=True, required=False, default="")
    previous = serializers.ListField(child=serializers.IntegerField(), required=False, default=list, max_length=8)
