from django.contrib import admin

from .models import GenerationJob, MockQuestion, MockTest


class MockQuestionInline(admin.TabularInline):
    model = MockQuestion
    extra = 0
    raw_id_fields = ("question",)


@admin.register(MockTest)
class MockTestAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "exam", "duration_minutes", "total_marks", "created_at")
    inlines = [MockQuestionInline]


admin.site.register(GenerationJob)
