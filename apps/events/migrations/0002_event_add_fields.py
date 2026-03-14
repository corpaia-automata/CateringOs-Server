from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='service_type_narration',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='event',
            name='payment_status',
            field=models.CharField(
                blank=True,
                choices=[
                    ('ADVANCE_PAID', 'Advance Paid'),
                    ('PARTIAL', 'Partial'),
                    ('PENDING', 'Pending'),
                    ('FULLY_PAID', 'Fully Paid'),
                ],
                max_length=15,
            ),
        ),
        migrations.AddField(
            model_name='event',
            name='total_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='advance_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AlterField(
            model_name='event',
            name='event_type',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='event',
            name='event_date',
            field=models.DateField(blank=True, db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name='event',
            name='service_type',
            field=models.CharField(
                choices=[
                    ('BUFFET', 'Buffet'),
                    ('BOX_COUNTER', 'Box Counter'),
                    ('TABLE_SERVICE', 'Table Service'),
                    ('OTHER', 'Other'),
                ],
                max_length=15,
            ),
        ),
    ]
