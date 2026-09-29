from django.contrib import admin

from .models import QuestionPaper


@admin.register(QuestionPaper)
class QuestionPaperAdmin(admin.ModelAdmin):
    list_display = ("original_name", "owner", "exam", "status", "extracted_count", "created_at")
    list_filter = ("status", "exam")
