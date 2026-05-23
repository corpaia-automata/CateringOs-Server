from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('engine', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='eventingredient',
            unique_together={('event', 'ingredient', 'unit')},
        ),
    ]
