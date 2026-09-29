from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from apps.exams.models import Exam
from apps.mocks import builder
from apps.papers.extraction import segment_questions
from apps.questions import services
from apps.questions.models import Question

from . import services as attempts


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class ExamFlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_exams", verbosity=0)
        cls.user = get_user_model().objects.create_user("vicky", password="pass12345")
        cls.exam = Exam.objects.get(slug="rrb-alp")

    def make_questions(self, subject, n, prefix):
        for i in range(n):
            services.create_question(
                owner=self.user, exam=self.exam, subject=subject, text=f"{prefix} question number {i} ?",
                options=["A1", "B1", "C1", "D1"], correct_index=1, origin=Question.Origin.MANUAL,
            )

    def test_insufficient_then_ok(self):
        self.make_questions("Mathematics", 5, "math")
        a = builder.availability(self.user, self.exam, [])
        self.assertEqual(a["status"], "insufficient")
        self.assertEqual(a["required_questions"], 75)
        self.assertEqual(a["available_questions"], 5)
        with self.assertRaises(builder.InsufficientQuestions):
            builder.create_mock(self.user, self.exam, [])

    def _full_mock(self):
        for subject, n in [("Mathematics", 20), ("Reasoning", 25), ("General Science", 20), ("General Awareness", 10)]:
            self.make_questions(subject, n, subject)
        return builder.create_mock(self.user, self.exam, [])

    def test_scoring_and_negative_marking(self):
        mock = self._full_mock()
        self.assertEqual(mock.questions.count(), 75)
        session = attempts.start_session(self.user, mock)
        mqs = list(mock.questions.select_related("question").prefetch_related("question__options"))
        items = []
        for i, mq in enumerate(mqs[:3]):
            opts = list(mq.question.options.all())
            correct = next(o for o in opts if o.is_correct)
            wrong = next(o for o in opts if not o.is_correct)
            chosen = correct if i < 2 else wrong  # 2 correct, 1 wrong
            items.append({"mock_question": mq.id, "selected_option": chosen.id, "visited": True, "time_spent_seconds": 10})
        attempts.save_answers(session, items)
        result = attempts.submit_session(session)
        self.assertEqual((result.correct, result.incorrect, result.unattempted), (2, 1, 72))
        self.assertEqual(result.score, Decimal("2") - Decimal("0.33"))
        self.assertEqual(result.time_used_seconds, 30)
        # idempotent
        self.assertEqual(attempts.submit_session(session).id, result.id)

    def test_auto_submit_on_expiry(self):
        mock = self._full_mock()
        session = attempts.start_session(self.user, mock)
        session.expires_at = timezone.now() - timedelta(minutes=1)
        session.save()
        attempts.enforce_expiry(session)
        session.refresh_from_db()
        self.assertEqual(session.status, "expired")
        self.assertTrue(hasattr(session, "result"))


class ExtractionTests(TestCase):
    def test_segments_questions_and_answer_key(self):
        text = (
            "1. What is the SI unit of force?\nA. Joule\nB. Newton\nC. Watt\nD. Pascal\n"
            "2. Capital of India?\n(a) Mumbai (b) Delhi (c) Kolkata (d) Chennai\n"
            "Answer Key\n1. B 2. B\n"
        )
        qs = segment_questions(text)
        self.assertEqual(len(qs), 2)
        self.assertEqual(qs[0]["options"], ["Joule", "Newton", "Watt", "Pascal"])
        self.assertEqual([q["answer_index"] for q in qs], [1, 1])
        self.assertEqual(qs[1]["options"][1], "Delhi")
