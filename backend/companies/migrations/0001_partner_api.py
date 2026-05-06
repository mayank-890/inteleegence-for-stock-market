from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PartnerAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("key_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("key_secret", models.CharField(max_length=512)),
                (
                    "tier",
                    models.CharField(
                        choices=[
                            ("BASIC", "Basic"),
                            ("PRO", "Pro"),
                            ("ENTERPRISE", "Enterprise"),
                        ],
                        default="BASIC",
                        max_length=20,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "db_table": "partner_account",
            },
        ),
        migrations.CreateModel(
            name="APIUsageLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("endpoint", models.CharField(max_length=500)),
                ("method", models.CharField(max_length=10)),
                ("status_code", models.PositiveSmallIntegerField()),
                ("response_time_ms", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "partner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="usage_logs",
                        to="companies.partneraccount",
                    ),
                ),
            ],
            options={
                "db_table": "api_usage_log",
            },
        ),
        migrations.AddIndex(
            model_name="apiusagelog",
            index=models.Index(fields=["partner", "created_at"], name="api_usage_l_partner_6176db_idx"),
        ),
        migrations.AddIndex(
            model_name="apiusagelog",
            index=models.Index(fields=["endpoint", "created_at"], name="api_usage_l_endpoin_148a7e_idx"),
        ),
    ]
