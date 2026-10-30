from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ModelViewSet, mixins

from . import ai, catalog, engine
from .images import process_upload
from .models import Garment, Look, LookItem, Profile
from .serializers import (GarmentSerializer, LoginSerializer, LookSerializer, ProfileSerializer, RegisterSerializer,
                          SuggestSerializer)

User = get_user_model()


def profile_of(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def auth_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "user": ProfileSerializer(profile_of(user)).data}


class MetaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = catalog.meta()
        data["ai_available"] = ai.available()
        return Response(data)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(auth_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = authenticate(username=ser.validated_data["email"].strip().lower(), password=ser.validated_data["password"])
        if not user:
            return Response({"detail": "That email and password do not match."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(auth_payload(user))


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(ProfileSerializer(profile_of(request.user)).data)

    def patch(self, request):
        ser = ProfileSerializer(profile_of(request.user), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class GarmentViewSet(ModelViewSet):
    serializer_class = GarmentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None

    def get_queryset(self):
        qs = Garment.objects.filter(user=self.request.user)
        category = self.request.query_params.get("category")
        return qs.filter(category=category) if category else qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.photo:
            instance.photo.delete(save=False)
        instance.delete()


class AIThrottled:
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"


def read_image(upload):
    """A processed JPEG as (bytes, media_type) ready to send to Claude."""
    f = process_upload(upload, max_px=1200)
    return f.read(), "image/jpeg"


class AnalyzeGarmentView(AIThrottled, APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        upload = request.FILES.get("photo")
        if not upload:
            return Response({"detail": "Attach a photo."}, status=400)
        image = read_image(upload)
        try:
            return Response(ai.analyze_garment(image))
        except ai.AIUnavailable as exc:
            return Response({"detail": str(exc)}, status=503)
        except ai.AIError as exc:
            return Response({"detail": str(exc)}, status=502)


class SuggestView(AIThrottled, APIView):
    def post(self, request):
        ser = SuggestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        if d["occasion"] not in catalog.OCCASIONS:
            return Response({"occasion": ["Choose an occasion from the list."]}, status=400)

        wardrobe = list(Garment.objects.filter(user=request.user))
        if not wardrobe:
            return Response({"detail": "Your closet is empty. Add a few pieces first."}, status=400)
        profile = profile_of(request.user)
        ctx = engine.Context(
            occasion=d["occasion"], details=d["details"], temperature=d["temperature"], rain=d["rain"],
            love=profile.love, avoid=profile.avoid, hair_length=profile.hair_length, hair_texture=profile.hair_texture,
        )

        looks, source, notice = [], "rules", ""
        if d["mode"] == "auto" and ai.available():
            previous = ""
            if d["adjust"]:
                prev = Look.objects.filter(user=request.user, id__in=d["previous"])
                previous = "; ".join(f"{l.title}: {', '.join(l.garments.values_list('name', flat=True))}" for l in prev)
            try:
                looks = ai.suggest_looks(wardrobe, ctx, profile, request.user, d["adjust"], previous)
                source = "claude"
            except ai.AIError as exc:
                notice = "The stylist did not answer, so this is the built-in quick mix."
        elif d["mode"] == "auto":
            notice = "Claude is not set up on this server, so this is the built-in quick mix."
        if not looks:
            looks = engine.suggest(wardrobe, ctx)
        if not looks:
            return Response({"detail": "Not enough for a complete outfit yet. You need a top and a bottom, or a dress or an ethnic set."}, status=400)

        label = catalog.OCCASIONS[d["occasion"]]["label"] + (f" · {d['details'][:60]}" if d["details"] else "")
        saved = []
        with transaction.atomic():
            for item in looks:
                look = Look.objects.create(
                    user=request.user, occasion=d["occasion"], occasion_label=label, details=d["details"],
                    temperature=d["temperature"], rain=d["rain"], title=item["title"], hair=item["hair"] or engine.hair_for(ctx),
                    why=item["why"], tip=item["tip"], missing=item.get("missing", []), source=source,
                )
                LookItem.objects.bulk_create(
                    [LookItem(look=look, garment=g, position=i) for i, g in enumerate(item["items"])]
                )
                saved.append(look)
        data = LookSerializer(saved, many=True, context={"request": request}).data
        return Response({"source": source, "notice": notice, "looks": data})


class LookViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                  GenericViewSet):
    serializer_class = LookSerializer
    http_method_names = ["get", "patch", "delete", "post", "head", "options"]
    throttle_scope = None

    def get_queryset(self):
        qs = Look.objects.filter(user=self.request.user).prefetch_related("entries__garment")
        if self.request.query_params.get("chosen") in ("1", "true"):
            qs = qs.filter(chosen=True).order_by("-chosen_at", "-id")
        return qs

    def perform_update(self, serializer):
        chosen = serializer.validated_data.get("chosen")
        extra = {}
        if chosen is True and not serializer.instance.chosen:
            extra["chosen_at"] = timezone.now()
        serializer.save(**extra)

    def perform_destroy(self, instance):
        if instance.photo:
            instance.photo.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser])
    def photo(self, request, pk=None):
        look = self.get_object()
        upload = request.FILES.get("photo")
        if not upload:
            return Response({"detail": "Attach a photo."}, status=400)
        processed = process_upload(upload, max_px=1000)
        if look.photo:
            look.photo.delete(save=False)
        look.photo.save("worn.jpg", processed, save=False)
        look.review = None  # an old review no longer matches the new photo
        look.save()
        return Response(self.get_serializer(look).data)

    @action(detail=True, methods=["post"], throttle_classes=[ScopedRateThrottle], throttle_scope="ai")
    def review(self, request, pk=None):
        look = self.get_object()
        if not look.photo:
            return Response({"detail": "Post a photo of the look first."}, status=400)
        try:
            with look.photo.open("rb") as fh:
                image = (fh.read(), "image/jpeg")
            look.review = ai.review_photo(look, profile_of(request.user), image)
        except ai.AIUnavailable as exc:
            return Response({"detail": str(exc)}, status=503)
        except ai.AIError as exc:
            return Response({"detail": str(exc)}, status=502)
        look.save(update_fields=["review"])
        return Response(self.get_serializer(look).data)


class GapsView(AIThrottled, APIView):
    def get(self, request):
        wardrobe = list(Garment.objects.filter(user=request.user))
        if not wardrobe:
            return Response({"source": "rules", "gaps": []})
        if ai.available():
            try:
                return Response({"source": "claude", "gaps": ai.closet_gaps(wardrobe, profile_of(request.user))})
            except ai.AIError:
                pass
        have = {g.category for g in wardrobe}
        wanted = [
            ("top", "A versatile top in a neutral colour", "It pairs with every bottom you own."),
            ("bottom", "A neutral bottom, such as dark trousers", "It works with every top you own."),
            ("shoes", "A comfortable everyday pair of shoes", "Every look needs footwear to feel finished."),
            ("layer", "A light jacket or layer", "It lets you dress for cool evenings and rain."),
            ("jewellery", "One simple piece of jewellery", "It finishes ethnic and party looks."),
        ]
        gaps = [{"piece": p, "why": f"Your closet has no {catalog.CATEGORY_SINGULAR[c].lower()} yet.", "unlocks": u}
                for c, p, u in wanted if c not in have]
        return Response({"source": "rules", "gaps": gaps[:3]})
