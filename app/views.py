from django.shortcuts import render

from .landing_content import LANDING_CONTEXT


def landing(request):
    return render(request, "landing.html", LANDING_CONTEXT)
