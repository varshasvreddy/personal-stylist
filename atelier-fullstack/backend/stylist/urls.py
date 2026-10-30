from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("garments", views.GarmentViewSet, basename="garment")
router.register("looks", views.LookViewSet, basename="look")

urlpatterns = [
    path("meta/", views.MetaView.as_view()),
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    path("garments/analyze/", views.AnalyzeGarmentView.as_view()),
    path("styling/suggest/", views.SuggestView.as_view()),
    path("styling/gaps/", views.GapsView.as_view()),
    path("", include(router.urls)),
]
