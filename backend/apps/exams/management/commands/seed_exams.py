"""Seed subjects, topics and starter exam patterns.

Only creates exams that do not exist yet, so edits made in the Django admin are never overwritten.
Verify every pattern against the latest official notification - they are starting points.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.exams.models import Exam, ExamPattern, PatternSection, Subject, Topic

SUBJECTS = {
    "Mathematics": [
        "Number System", "Percentage", "Ratio and Proportion", "Profit and Loss", "Time and Work",
        "Time, Speed and Distance", "Simple and Compound Interest", "Algebra", "Geometry",
        "Mensuration", "Trigonometry", "Data Interpretation",
    ],
    "Reasoning": [
        "Analogy", "Classification", "Series", "Coding-Decoding", "Blood Relations",
        "Direction Sense", "Syllogism", "Venn Diagrams", "Non-Verbal Reasoning", "Puzzles",
    ],
    "General Science": ["Physics", "Chemistry", "Biology", "Units and Measurements"],
    "General Awareness": [
        "Current Affairs", "History", "Geography", "Polity", "Economics", "Static GK", "Sports", "Books and Authors",
    ],
    "English": ["Grammar", "Vocabulary", "Comprehension", "Error Spotting", "Sentence Improvement"],
}

INSTRUCTIONS = (
    "1. The countdown timer is driven by the server and shows the time left to complete the exam.\n"
    "2. The question palette shows the status of each question: not visited, not answered, answered, "
    "marked for review, and answered & marked for review.\n"
    "3. Answered & marked for review questions are considered for evaluation.\n"
    "4. Select an option and click 'Save & Next' to move on. Use 'Clear Response' to deselect.\n"
    "5. Wrong answers may carry negative marking as shown for each section.\n"
    "6. The exam is submitted automatically when the timer reaches zero."
)

THIRD = Decimal("0.33")
HALF = Decimal("0.50")
QUARTER = Decimal("0.25")

# name, slug, description, minutes, [(section name, subject, count, marks, negative)]
EXAMS = [
    ("RRB ALP (CBT-1)", "rrb-alp", "Railway Assistant Loco Pilot - first stage CBT.", 60, [
        ("Mathematics", "Mathematics", 20, 1, THIRD),
        ("Mental Ability", "Reasoning", 25, 1, THIRD),
        ("General Science", "General Science", 20, 1, THIRD),
        ("General Awareness", "General Awareness", 10, 1, THIRD),
    ]),
    ("RRB NTPC (CBT-1)", "rrb-ntpc", "Railway Non-Technical Popular Categories - first stage CBT.", 90, [
        ("Mathematics", "Mathematics", 30, 1, THIRD),
        ("General Intelligence & Reasoning", "Reasoning", 30, 1, THIRD),
        ("General Awareness", "General Awareness", 40, 1, THIRD),
    ]),
    ("SSC CGL (Tier 1)", "ssc-cgl", "Staff Selection Commission Combined Graduate Level - Tier 1.", 60, [
        ("General Intelligence & Reasoning", "Reasoning", 25, 2, HALF),
        ("General Awareness", "General Awareness", 25, 2, HALF),
        ("Quantitative Aptitude", "Mathematics", 25, 2, HALF),
        ("English Comprehension", "English", 25, 2, HALF),
    ]),
    ("SSC CHSL (Tier 1)", "ssc-chsl", "Staff Selection Commission Combined Higher Secondary Level - Tier 1.", 60, [
        ("English Language", "English", 25, 2, HALF),
        ("General Intelligence", "Reasoning", 25, 2, HALF),
        ("Quantitative Aptitude", "Mathematics", 25, 2, HALF),
        ("General Awareness", "General Awareness", 25, 2, HALF),
    ]),
    ("Banking - IBPS PO Prelims (simplified)", "ibps-po-prelims",
     "Simplified: one combined timer (sectional timing is not enforced).", 60, [
        ("English Language", "English", 30, 1, QUARTER),
        ("Quantitative Aptitude", "Mathematics", 35, 1, QUARTER),
        ("Reasoning Ability", "Reasoning", 35, 1, QUARTER),
    ]),
]


class Command(BaseCommand):
    help = "Seed subjects, topics and starter exam patterns"

    @transaction.atomic
    def handle(self, *args, **options):
        subjects = {}
        for name, topics in SUBJECTS.items():
            subject, _ = Subject.objects.get_or_create(name=name)
            subjects[name] = subject
            for t in topics:
                Topic.objects.get_or_create(subject=subject, name=t)

        created = 0
        for name, slug, desc, minutes, sections in EXAMS:
            exam, was_created = Exam.objects.get_or_create(slug=slug, defaults={"name": name, "description": desc})
            if not was_created:
                continue
            pattern = ExamPattern.objects.create(exam=exam, duration_minutes=minutes, instructions=INSTRUCTIONS)
            for i, (sname, subject, count, marks, neg) in enumerate(sections):
                PatternSection.objects.create(
                    pattern=pattern, name=sname, subject=subjects[subject], order=i,
                    question_count=count, marks_per_question=Decimal(marks), negative_marks=neg,
                )
            created += 1
        self.stdout.write(self.style.SUCCESS(f"Seed complete ({created} new exams)."))
