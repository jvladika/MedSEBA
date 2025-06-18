# Mongo

The `mongo` directory is responsible for database-related operations that are not concerned with storing information about individual research papers.

- `/models`: Houses MongoDB data models.
- `connection.py`: Exposes the connection to the MongoDB database.

## Mongoengine Installation and Setup

mongoengine is used as a connector to enable Django projects to use MongoDB. It allows the use of Django's ORM for MongoDB interactions.

To install mongoengine, use the following pip command:

```bash
pip install mongoengine
```