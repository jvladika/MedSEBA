SEBAnswers
##Instructions to run

Pre-installations

Download and install Docker Desktop: https://www.docker.com/products/docker-desktop/

Install MongoDB Community and start the services: https://www.mongodb.com/docs/manual/administration/install-community/



Run the app
Go to project folder and run:

source sebaenv/bin/activate
pip install -r requirements.txt
pip install -r backend/django/requirements.txt


new tab (and run Docker Desktop on your PC)

source sebaenv/bin/activate
cd backend/weaviate
docker-compose up --build


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

Import first documents
There is also a script to import some initial documents to the Weaviate database. Before running it, you first want to create a database schema. If the backend is running, visit http://localhost:8000/document/createWeaviateClass/ . If this leads to an error, go to backend/django/backend/routes and comment out the line path('str:documentId', DocumentController.getDocument) and restart the server. Now try accessing http://localhost:8000/document/createWeaviateClass/ again. If it worked, uncomment the line you just commented and restart.
To import the documents, go to the project root folder and run

source sebaenv/bin/activate
python importDatasetToWeaviate.py


This script should embedd and import 1000 test medical documents (located in backend/weaviate/pubmed_landscape_abstracts_1000.csv) to the Weaviate database.
Now try running a simple search query like "report" or "cancer", and see if you get any results.