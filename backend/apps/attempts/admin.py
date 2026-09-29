from django.contrib import admin

from .models import TestAnswer, TestResult, TestSession

admin.site.register(TestSession)
admin.site.register(TestAnswer)
admin.site.register(TestResult)
