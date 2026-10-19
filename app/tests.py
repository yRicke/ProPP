from copy import deepcopy

from django.conf import settings
from django.core.exceptions import PermissionDenied, SuspiciousOperation
from django.http import Http404
from django.test import Client, SimpleTestCase, override_settings
from django.urls import path

from app import error_views
from setup.urls import handler400, handler403, handler404, handler500
from setup.urls import urlpatterns as site_urlpatterns

INTERNAL_DETAIL = "detalhe-interno-nao-deve-aparecer"


def failing_view(request, status_code):
    exceptions = {
        400: SuspiciousOperation,
        403: PermissionDenied,
        404: Http404,
        500: RuntimeError,
    }
    raise exceptions[status_code](INTERNAL_DETAIL)


def broken_context_processor(request):
    raise RuntimeError("Processador de contexto indisponível")


urlpatterns = [
    *site_urlpatterns,
    # O runner importa setup.urls com DEBUG=False; exercitar a prévia separadamente.
    path("preview/erros/<int:status_code>/", error_views.preview),
    path("__test/failure/<int:status_code>/", failing_view),
]


@override_settings(DEBUG=False, ALLOWED_HOSTS=["testserver"], ROOT_URLCONF=__name__)
class ErrorPageTests(SimpleTestCase):
    def test_exceptions_reach_the_correct_error_pages(self):
        client = Client(raise_request_exception=False)
        for status_code in (400, 403, 404, 500):
            with self.subTest(status_code=status_code):
                response = client.get(f"/__test/failure/{status_code}/")
                self.assertEqual(response.status_code, status_code)
                self.assertTemplateUsed(response, f"{status_code}.html")
                self.assertContains(response, "Voltar ao início", status_code=status_code)
                self.assertNotContains(response, INTERNAL_DETAIL, status_code=status_code)
                self.assertEqual(response["X-Robots-Tag"], "noindex, nofollow")

    def test_missing_route_renders_the_branded_404(self):
        response = self.client.get("/pagina-que-nao-existe/")
        self.assertContains(response, "ESTÁ NO PLANO.", status_code=404)
        self.assertContains(response, 'href="/"', status_code=404)

    def test_invalid_host_can_render_400_without_reading_the_host_again(self):
        response = self.client.get("/", HTTP_HOST="host-invalido.example")
        self.assertEqual(response.status_code, 400)
        self.assertTemplateUsed(response, "400.html")

    def test_csrf_failure_uses_the_branded_403(self):
        response = Client(enforce_csrf_checks=True).post("/", {"name": "teste"})
        self.assertContains(response, "Não foi possível confirmar", status_code=403)
        self.assertTemplateUsed(response, "403.html")

    def test_server_error_does_not_depend_on_context_processors(self):
        templates = deepcopy(settings.TEMPLATES)
        templates[0]["OPTIONS"]["context_processors"] = [
            f"{__name__}.broken_context_processor",
        ]
        with override_settings(TEMPLATES=templates):
            response = Client(raise_request_exception=False).get("/__test/failure/500/")
        self.assertContains(response, "MESMA DIREÇÃO.", status_code=500)

    def test_preview_is_unavailable_outside_debug_mode(self):
        response = self.client.get("/preview/erros/500/")
        self.assertEqual(response.status_code, 404)

    @override_settings(DEBUG=True)
    def test_debug_previews_render_without_raising_an_exception(self):
        for status_code in (400, 403, 404, 500):
            with self.subTest(status_code=status_code):
                response = self.client.get(f"/preview/erros/{status_code}/")
                self.assertEqual(response.status_code, status_code)
                self.assertTemplateUsed(response, f"{status_code}.html")

    def test_landing_still_renders(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "landing.html")
