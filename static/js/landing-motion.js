(() => {
    "use strict";

    const { gsap } = window;
    if (!gsap) return;

    // Premium motion: short travel, a consistent ease, and no scroll hijacking.
    const motion = gsap.matchMedia();

    function splitHeading(heading) {
        if (heading.dataset.split) return;
        heading.dataset.split = "true";
        heading.setAttribute(
            "aria-label",
            heading.innerText.replace(/\s+/g, " ").trim(),
        );
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach((node) => {
            const fragment = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach((text) => {
                if (!text.trim()) {
                    fragment.append(document.createTextNode(text));
                    return;
                }
                const clip = document.createElement("span");
                const word = document.createElement("span");
                clip.className = "word-clip";
                clip.setAttribute("aria-hidden", "true");
                word.className = "word";
                word.textContent = text;
                clip.append(word);
                fragment.append(clip);
            });
            node.replaceWith(fragment);
        });
    }

    motion.add("(prefers-reduced-motion: no-preference)", (context) => {
        document.querySelectorAll("[data-heading]").forEach(splitHeading);

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
            .from(
                "[data-hero-line]",
                {
                    yPercent: 88,
                    rotationX: 12,
                    autoAlpha: 0,
                    duration: 0.8,
                    stagger: 0.1,
                },
                0,
            )
            .from(
                "[data-hero-meta]",
                { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.035 },
                0.3,
            )
            .from(
                "[data-hero-art]",
                { y: 24, rotation: 1.5, autoAlpha: 0, duration: 0.85 },
                0.24,
            )
            .from(
                ".hero-art__stamp",
                { x: 15, y: 8, autoAlpha: 0, duration: 0.45 },
                0.85,
            )
            .fromTo(
                ".training-route__line",
                { strokeDashoffset: 560 },
                { strokeDashoffset: 0, duration: 1.2 },
                0.65,
            );

        if (!("IntersectionObserver" in window)) return;

        // Register asynchronous animations in this media context for cleanup.
        context.add("reveal", (element) => {
            gsap.from(element, {
                y: 24,
                autoAlpha: 0,
                duration: 0.65,
                ease: "power3.out",
                clearProps: "transform,opacity,visibility",
            });
            const words = element.querySelectorAll("[data-heading] .word");
            if (words.length) {
                gsap.from(words, {
                    yPercent: 85,
                    rotationX: 8,
                    duration: 0.65,
                    stagger: { amount: 0.16 },
                    ease: "power3.out",
                    clearProps: "transform",
                });
            }
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    context.reveal(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.08 },
        );
        document
            .querySelectorAll("[data-reveal]")
            .forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    });

    motion.add(
        "(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
            const area = document.querySelector("[data-tilt-area]");
            const board = document.querySelector("[data-tilt-target]");
            if (!area || !board) return;

            const rotateX = gsap.quickTo(board, "rotationX", {
                duration: 0.55,
                ease: "power3.out",
            });
            const rotateY = gsap.quickTo(board, "rotationY", {
                duration: 0.55,
                ease: "power3.out",
            });
            let bounds;

            function measure() {
                bounds = area.getBoundingClientRect();
            }
            function move(event) {
                if (!bounds) return;
                const x = Math.max(
                    -0.5,
                    Math.min(
                        0.5,
                        (event.clientX - bounds.left) / bounds.width - 0.5,
                    ),
                );
                const y = Math.max(
                    -0.5,
                    Math.min(
                        0.5,
                        (event.clientY - bounds.top) / bounds.height - 0.5,
                    ),
                );
                rotateX(-y * 5);
                rotateY(x * 6);
            }
            function reset() {
                rotateX(0);
                rotateY(0);
            }

            area.addEventListener("pointerenter", measure);
            area.addEventListener("pointermove", move);
            area.addEventListener("pointerleave", reset);
            window.addEventListener("resize", reset);

            return () => {
                area.removeEventListener("pointerenter", measure);
                area.removeEventListener("pointermove", move);
                area.removeEventListener("pointerleave", reset);
                window.removeEventListener("resize", reset);
            };
        },
    );
})();
