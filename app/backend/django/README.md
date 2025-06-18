# Django Appserver

This directory contains the backend logic of the project, concerned with the webserver and the associated mongo-databse.

Under the subdirectory `/backend/`:

- `/controller`: Contains the application controllers, specifiying the application logic of individual endpoints.
- `/routes`: Houses URL route definitions for each of the the controllers.
- `/models`: Stores data models.
- `urls.py`: Central URL configuration file that maps URLs to controllers.

Start the server in this directy with `$python manage.py runserver`
Start the database console with `$python manage.py dbshell`.
Run the tests with `$python manage.py test`.
See /backend/mongo/README.md for more information on the mongo-database.

For details on the available API endpoints, please refer to the [Controllers README](https://gitlab.lrz.de/sebanswers/app/-/tree/35-document-backend-routes-in-readme/backend/django/backend/controller).
