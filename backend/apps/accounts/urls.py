from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import MeView, RegisterView
from .oauth import authorize_page, token_exchange

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("me/", MeView.as_view()),
    path("oauth/authorize", authorize_page),
    path("oauth/token", token_exchange),
]
