from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AvailabilityView, GenerateMissingView, GenerationJobView, MockTestViewSet

router = DefaultRouter()
router.register("", MockTestViewSet, basename="mock")

urlpatterns = [
    path("availability/", AvailabilityView.as_view()),
    path("generate-missing/", GenerateMissingView.as_view()),
    path("generation-jobs/<int:pk>/", GenerationJobView.as_view()),
] + router.urls
