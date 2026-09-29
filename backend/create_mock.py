import os
import django
import sys

# Setup Django
sys.path.append('d:/cbt-mock-creator/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.exams.models import Exam, Subject
from apps.questions.models import Question
from apps.mocks.generation import generate_missing
from django.contrib.auth.models import User

def main():
    try:
        exam = Exam.objects.get(slug='rrb-alp')
        user = User.objects.first()
        if not user:
            print("No user found.")
            return

        print("Generating questions for ALP CBT-1...")
        from apps.questions.models import QuestionOption, QuestionExplanation
        pattern = exam.pattern
        sections = pattern.sections.all()
        for ps in sections:
            existing = Question.objects.filter(exam=exam, subject=ps.subject).count()
            needed = ps.question_count - existing
            if needed > 0:
                print(f"Adding {needed} questions for {ps.subject.name}...")
                for i in range(needed):
                    import hashlib
                    q = Question.objects.create(
                        owner=user, exam=exam, subject=ps.subject,
                        text=f"Sample question {i+1} for {ps.subject.name}",
                        difficulty="medium", is_valid=True, origin=Question.Origin.MANUAL,
                        content_hash=hashlib.md5(f"sample-{ps.subject.name}-{i}".encode()).hexdigest()
                    )
                    QuestionOption.objects.create(question=q, text="Option A", order=1, is_correct=True)
                    QuestionOption.objects.create(question=q, text="Option B", order=2, is_correct=False)
                    QuestionOption.objects.create(question=q, text="Option C", order=3, is_correct=False)
                    QuestionOption.objects.create(question=q, text="Option D", order=4, is_correct=False)
                    QuestionExplanation.objects.create(question=q, text="Sample explanation")
        print("Questions generated successfully.")
        
        # Now create the mock
        from apps.mocks.builder import create_mock
        
        try:
            mock_test = create_mock(user, exam, [], title="ALP CBT-1 Full Mock Test")
            print(f"Mock test created successfully! ID: {mock_test.id}")
        except Exception as e:
            print(f"Could not create mock: {e}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
