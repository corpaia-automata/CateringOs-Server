from django.apps import AppConfig


class MasterConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.master'

    def ready(self):
        import apps.master.signals  # noqa: F401
