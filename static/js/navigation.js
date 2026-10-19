(() => {
    'use strict';

    const header = document.querySelector('[data-header]');
    const navigation = document.querySelector('[data-navigation]');
    const toggle = document.querySelector('[data-menu-toggle]');
    if (!header || !navigation || !toggle) return;

    const mobile = window.matchMedia('(max-width: 900px)');

    function setMenu(open, restoreFocus = false) {
        navigation.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        if (restoreFocus) toggle.focus();
    }

    function syncLayout() {
        toggle.hidden = !mobile.matches;
        navigation.classList.toggle('is-collapsible', mobile.matches);
        setMenu(false);
    }

    toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    navigation.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || !mobile.matches) return;
        setMenu(false);
        if (link.hash && link.origin === window.location.origin) {
            const destination = document.querySelector(link.hash);
            destination?.setAttribute('tabindex', '-1');
            destination?.focus({ preventScroll: true });
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setMenu(false, true);
        }
    });

    document.addEventListener('click', (event) => {
        if (!header.contains(event.target)) setMenu(false);
    });

    header.addEventListener('focusout', (event) => {
        if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
    });

    mobile.addEventListener('change', syncLayout);
    syncLayout();

    // One read per scroll frame; no permanent animation loop.
    let pending = false;
    function updateHeader() {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
        pending = false;
    }
    window.addEventListener('scroll', () => {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(updateHeader);
    }, { passive: true });
    updateHeader();

    if (!('IntersectionObserver' in window)) return;
    const links = [...navigation.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const link = links.find((item) => item.hash === `#${entry.target.id}`);
            if (!link) return;
            if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }, { rootMargin: '-15% 0px -60% 0px' });
    links.forEach((link) => {
        const section = document.querySelector(link.hash);
        if (section) observer.observe(section);
    });
})();
