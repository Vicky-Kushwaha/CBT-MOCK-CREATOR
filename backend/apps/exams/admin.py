from django.contrib import admin

from .models import Exam, ExamPattern, PatternSection, Subject, Topic


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 1


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    inlines = [TopicInline]


class SectionInline(admin.TabularInline):
    model = PatternSection
    extra = 1


@admin.register(ExamPattern)
class ExamPatternAdmin(admin.ModelAdmin):
    list_display = ("exam", "duration_minutes")
    inlines = [SectionInline]


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    prepopulated_fields = {"slug": ("name",)}
