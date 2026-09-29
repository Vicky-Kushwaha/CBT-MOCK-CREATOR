from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/exams/", include("apps.exams.urls")),
    path("api/subjects/", include("apps.exams.subject_urls")),
    path("api/questions/", include("apps.questions.urls")),
    path("api/papers/", include("apps.papers.urls")),
    path("api/mocks/", include("apps.mocks.urls")),
    path("api/sessions/", include("apps.attempts.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
