# This model is the base class for all models used within mongo db / djongo.
# It represent a generic object that has a unique identifier and a creation-timestamp.
# Accordingly, all other models should inherit from this one.
import uuid
from datetime import datetime
from mongoengine import Document,fields

class AbstractBaseModel(Document):
    meta = {
        'allow_inheritance': True, 
        'abstract' : True 
    }
   
    id = fields.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    createdAt = fields.DateTimeField(default=datetime.utcnow())

    def toDict(self):
        return {
            "id": str(self.id),
            "createdAt": self.createdAt.strftime("%Y-%m-%d %H:%M:%S") if self.createdAt else None,
        }