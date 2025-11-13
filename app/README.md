source sebaenv/bin/activate
pip install -r requirements.txt
pip install -r backend/django/requirements.txt


new tab

source sebaenv/bin/activate
cd backend/django
python manage.py runserver


new tab

source sebaenv/bin/activate
cd frontend/seba-app
yarn install
yarn start


The first tab should have started the Weaviate database client, the second tab should have started the backend at port 8000, and the third tab should have started the frontend at port 3000.
It should be accessible at https://localhost:3000
