# -*- coding: utf-8 -*-
# Generated by Django 1.9.3 on 2016-03-19 16:04
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0006_studio_is_piano'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservation',
            name='song',
            field=models.CharField(default='', max_length=250),
        ),
    ]