from rest_framework import generics, permissions

from .serializers import MeSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user
