# -*- coding: utf-8 -*-
# Generated by Django 1.9.3 on 2016-03-15 19:31
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0003_auto_20160310_2101'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservation',
            name='comment',
            field=models.TextField(default=''),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='status',
            field=models.CharField(default='', max_length=30),
        ),
    ]