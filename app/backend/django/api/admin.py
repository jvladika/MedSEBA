from django.contrib import admin
from .models import SearchHistory, CustomUser, Note, SearchResults

admin.site.register(SearchHistory)
admin.site.register(Note)
admin.site.register(CustomUser)
admin.site.register(SearchResults)
