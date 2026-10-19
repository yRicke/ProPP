"""Páginas de erro sem consultas ou processadores de contexto da aplicação."""

from django.conf import settings
from django.http import Http404, HttpResponse
from django.template.loader import get_template

ERROR_STATUS_CODES = (400, 403, 404, 500)


def _error_response(status_code, *, csrf_failure=False):
    # Não passar request: a página deve funcionar mesmo se um context processor falhar.
    content = get_template(f"{status_code}.html").render({"csrf_failure": csrf_failure})
    response = HttpResponse(content, status=status_code)
    response["X-Robots-Tag"] = "noindex, nofollow"
    return response


def bad_request(request, exception):
    return _error_response(400)


def permission_denied(request, exception):
    return _error_response(403)


def page_not_found(request, exception):
    return _error_response(404)


def server_error(request):
    return _error_response(500)


def csrf_failure(request, reason=""):
    return _error_response(403, csrf_failure=True)


def preview(request, status_code):
    if not settings.DEBUG or status_code not in ERROR_STATUS_CODES:
        raise Http404
    return _error_response(status_code)
