up:            ## start everything (hot reload)
	docker compose up --build
down:
	docker compose down
logs:
	docker compose logs -f backend celery mcp frontend
migrations:    ## create new migrations after model changes
	docker compose exec backend python manage.py makemigrations
migrate:
	docker compose exec backend python manage.py migrate
superuser:
	docker compose exec backend python manage.py createsuperuser
seed:
	docker compose exec backend python manage.py seed_exams
test:
	docker compose exec backend python manage.py test
reset:         ## wipe DB + uploads
	docker compose down -v
