import os
import runpy
from pathlib import Path
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, override_settings


SETTINGS_FILE = Path(__file__).resolve().parent.parent / 'setup' / 'settings.py'


class EnvironmentSettingsTests(SimpleTestCase):
    def load_settings(self, **overrides):
        environment = {
            'VERCEL': '1',
            'DJANGO_SECRET_KEY': 'chave-exclusiva-dos-testes-' * 3,
        }
        environment.update(overrides)
        with patch.dict(os.environ, environment, clear=True):
            return runpy.run_path(str(SETTINGS_FILE))

    def test_production_defaults_disable_debug_and_secure_https(self):
        config = self.load_settings()
        self.assertFalse(config['DEBUG'])
        self.assertTrue(config['SECURE_SSL_REDIRECT'])
        self.assertTrue(config['SESSION_COOKIE_SECURE'])
        self.assertTrue(config['CSRF_COOKIE_SECURE'])
        self.assertEqual(config['SECURE_PROXY_SSL_HEADER'], ('HTTP_X_FORWARDED_PROTO', 'https'))

    def test_vercel_hosts_and_custom_domains_are_allowed_explicitly(self):
        config = self.load_settings(
            VERCEL_URL='propp-deployment.vercel.app',
            VERCEL_BRANCH_URL='propp-git-feature.vercel.app',
            VERCEL_PROJECT_PRODUCTION_URL='propp.vercel.app',
            DJANGO_ALLOWED_HOSTS=' curso.example.com, propp.vercel.app, ',
            DJANGO_CSRF_TRUSTED_ORIGINS=' https://curso.example.com, ',
        )
        self.assertCountEqual(config['ALLOWED_HOSTS'], [
            'curso.example.com', 'propp-deployment.vercel.app',
            'propp-git-feature.vercel.app', 'propp.vercel.app',
        ])
        self.assertCountEqual(config['CSRF_TRUSTED_ORIGINS'], [
            'https://curso.example.com',
            'https://propp-deployment.vercel.app',
            'https://propp-git-feature.vercel.app',
            'https://propp.vercel.app',
        ])

    def test_missing_secret_prevents_startup(self):
        with self.assertRaisesMessage(ImproperlyConfigured, 'DJANGO_SECRET_KEY'):
            self.load_settings(DJANGO_SECRET_KEY='')

    def test_debug_cannot_be_enabled_on_vercel(self):
        with self.assertRaisesMessage(ImproperlyConfigured, 'DJANGO_DEBUG deve ser false'):
            self.load_settings(DJANGO_DEBUG='true')

    def test_invalid_boolean_prevents_silent_misconfiguration(self):
        with self.assertRaisesMessage(ImproperlyConfigured, 'DJANGO_DEBUG deve ser true ou false'):
            self.load_settings(DJANGO_DEBUG='invalid')

    def test_vercel_does_not_load_the_local_env_file(self):
        with patch('dotenv.load_dotenv') as load_dotenv:
            self.load_settings()
        load_dotenv.assert_not_called()

    def test_local_environment_keeps_hosting_values_and_supports_debug(self):
        with patch('dotenv.load_dotenv') as load_dotenv:
            config = self.load_settings(VERCEL='0', DJANGO_DEBUG='true')
        load_dotenv.assert_called_once_with(SETTINGS_FILE.parent.parent / '.env', override=False)
        self.assertTrue(config['DEBUG'])
        self.assertFalse(config['SECURE_SSL_REDIRECT'])
        self.assertFalse(config['SESSION_COOKIE_SECURE'])
        self.assertEqual(config['ALLOWED_HOSTS'], ['localhost', '127.0.0.1', '[::1]'])


@override_settings(
    DEBUG=False,
    ALLOWED_HOSTS=['testserver'],
    SECURE_SSL_REDIRECT=True,
    SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https'),
)
class ProxyHttpsTests(SimpleTestCase):
    def test_http_redirects_to_https(self):
        response = self.client.get('/')
        self.assertRedirects(response, 'https://testserver/', status_code=301, fetch_redirect_response=False)

    def test_vercel_forwarded_https_does_not_loop(self):
        response = self.client.get('/', HTTP_X_FORWARDED_PROTO='https')
        self.assertEqual(response.status_code, 200)
