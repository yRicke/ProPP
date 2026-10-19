(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function initTestimonials() {
        const track = document.querySelector('[data-carousel]');
        const previous = document.querySelector('[data-carousel-prev]');
        const next = document.querySelector('[data-carousel-next]');
        const position = document.querySelector('[data-carousel-position]');
        const controls = document.querySelector('[data-carousel-controls]');
        if (!track || !previous || !next || !position || !controls) return;

        const slides = [...track.children];
        const pad = (value) => String(value).padStart(2, '0');

        function update() {
            const viewport = track.getBoundingClientRect();
            const visible = slides.filter((slide) => {
                const bounds = slide.getBoundingClientRect();
                return bounds.left < viewport.right - 12 && bounds.right > viewport.left + 12;
            });
            const first = slides.indexOf(visible[0]) + 1;
            const last = slides.indexOf(visible.at(-1)) + 1;
            position.textContent = `${pad(first)}—${pad(last)} / ${pad(slides.length)}`;
            previous.disabled = track.scrollLeft <= 2;
            next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
            controls.hidden = track.scrollWidth <= track.clientWidth + 2;
        }

        function move(direction) {
            const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
            const distance = slides[0].getBoundingClientRect().width + gap;
            track.scrollBy({ left: direction * distance, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        }

        previous.addEventListener('click', () => move(-1));
        next.addEventListener('click', () => move(1));
        track.addEventListener('keydown', (event) => {
            if (event.target !== track) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                move(event.key === 'ArrowRight' ? 1 : -1);
            }
        });
        let frame = 0;
        track.addEventListener('scroll', () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => { update(); frame = 0; });
        }, { passive: true });
        if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
        update();
    }

    function initVideo() {
        const dialog = document.querySelector('[data-video-dialog]');
        const container = document.querySelector('[data-video-container]');
        const close = document.querySelector('[data-video-close]');
        if (!dialog || !container || !close || typeof dialog.showModal !== 'function') return;

        document.querySelectorAll('[data-video-open]').forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                // Preserve the regular link for new-tab and modified clicks.
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                const iframe = document.createElement('iframe');
                iframe.src = trigger.dataset.videoUrl;
                iframe.title = 'Apresentação do método PRO Prevenção e Performance';
                iframe.allow = 'autoplay; fullscreen; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                container.replaceChildren(iframe);
                dialog.showModal();
            });
        });

        close.addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        });
        // Destroying the iframe also stops playback and all third-party work.
        dialog.addEventListener('close', () => container.replaceChildren());
    }

    initTestimonials();
    initVideo();
})();
