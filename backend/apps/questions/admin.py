from django.contrib import admin

from .models import Question, QuestionExplanation, QuestionOption


class OptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "subject", "topic", "difficulty", "origin", "is_valid")
    list_filter = ("origin", "is_valid", "subject", "difficulty")
    search_fields = ("text",)
    inlines = [OptionInline]


admin.site.register(QuestionExplanation)
