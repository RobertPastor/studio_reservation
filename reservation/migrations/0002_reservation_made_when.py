# -*- coding: utf-8 -*-
# Generated by Django 1.9.3 on 2016-03-05 17:17
from __future__ import unicode_literals

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='made_when',
            field=models.DateTimeField(default=datetime.datetime(2016, 3, 5, 17, 17, 41, 917000, tzinfo=utc)),
            preserve_default=False,
        ),
    ]