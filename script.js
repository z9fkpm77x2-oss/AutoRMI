/* [ADDED - NEW FILE IN PART 3] global behaviour for every page
 *
 * AutoRMI - global script (loaded on every page)
 * Part 3: interactive elements, animations, DOM manipulation, lightbox.
 * Uses jQuery (loaded before this file) plus a little vanilla JavaScript.
 * 
 *(FreeCodeCampe.org,2018)/
(function ($) {
    'use strict';

    /* ---------- [ADDED] 1. Small DOM touches ---------- */

    // Keep the copyright year correct automatically.
    $('#year').text(new Date().getFullYear());

    // Shadow on the sticky header once the page is scrolled.
    var $header = $('.header');
    // "Back to top" button appears after scrolling down.
    var $toTop = $('#backToTop');

    function onScroll() {
        var y = window.scrollY || document.documentElement.scrollTop;
        $header.toggleClass('is-scrolled', y > 10);
        $toTop.toggleClass('show', y > 400);
    }
    $(window).on('scroll', onScroll);
    onScroll();

    $toTop.on('click', function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    // Smooth scrolling for same-page anchor links (e.g. #faq, #map-section)FreeCodeCampe.org,2018.
    $('a[href^="#"]').not('[href="#"]').on('click', function (ev) {
        var target = document.querySelector(this.getAttribute('href'));
        if (!target) { return; }
        ev.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    });

    /* ---------- [ADDED] 2. Partner logo slider (Slick) ---------- */

    if ($.fn.slick && $('.client-slider').length) {
        $('.client-slider').slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 2200,
            arrows: false,
            dots: false,
            pauseOnHover: true,
            responsive: [
                { breakpoint: 992, settings: { slidesToShow: 3 } },
                { breakpoint: 576, settings: { slidesToShow: 2 } }
            ]
        });
    }

    /* ---------- [ADDED] 3. Scroll-reveal animation ---------- */
    // Elements with class "reveal" fade and slide up as they enter the screen.
    // CSS handles the transition; JS only adds the "in-view" (classFreeCodeCampe.org,2018).

    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
        document.documentElement.classList.add('js-reveal');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        reveals.forEach(function (el, i) {
            // small stagger for items in the same row
            el.style.transitionDelay = (i % 3) * 90 + 'ms';
            io.observe(el);
        });
    }

    // Parts rendered later by products.js call this so they animate too(Bro Code,2024).
    window.AutoRMI = window.AutoRMI || {};
    window.AutoRMI.observeReveal = function (root) {
        var els = (root || document).querySelectorAll('.reveal:not(.in-view)');
        els.forEach(function (el) {
            if ('IntersectionObserver' in window && document.documentElement.classList.contains('js-reveal')) {
                var o = new IntersectionObserver(function (en) {
                    if (en[0].isIntersecting) { el.classList.add('in-view'); o.disconnect(); }
                }, { threshold: 0.12 });
                o.observe(el);
            } else {
                el.classList.add('in-view');
            }
        });
    };

    /* ---------- [ADDED] 4. Gallery lightbox ---------- */
    // Any link with [data-lightbox] opens its image in a full-screen viewer.
    // Keyboard: Esc closes, Left/Right arrows move, Tab is kept inside the dialog.

    function initLightbox() {
        var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox]'));
        if (!links.length) { return; }

        var current = 0;
        var lastFocus = null;

        // Build the overlay once, with DOM methods (no innerHTML => no injection risk).
        var box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Image viewer');
        box.hidden = true;

        function btn(cls, label, icon) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'lb-btn ' + cls;
            b.setAttribute('aria-label', label);
            var i = document.createElement('i');
            i.className = 'fa-solid ' + icon;
            i.setAttribute('aria-hidden', 'true');
            b.appendChild(i);
            return b;
        }
        var closeBtn = btn('lb-close', 'Close image viewer', 'fa-xmark');
        var prevBtn = btn('lb-prev', 'Previous image', 'fa-chevron-left');
        var nextBtn = btn('lb-next', 'Next image', 'fa-chevron-right');
        var figure = document.createElement('figure');
        figure.className = 'lb-figure';
        var img = document.createElement('img');
        img.className = 'lb-img';
        img.alt = '';
        var cap = document.createElement('figcaption');
        cap.className = 'lb-caption';
        var counter = document.createElement('span');
        counter.className = 'lb-counter';
        counter.setAttribute('aria-live', 'polite');
        figure.appendChild(img);
        figure.appendChild(cap);
        box.appendChild(closeBtn);
        box.appendChild(prevBtn);
        box.appendChild(figure);
        box.appendChild(nextBtn);
        box.appendChild(counter);
        document.body.appendChild(box);

        function show(index) {
            current = (index + links.length) % links.length;
            var a = links[current];
            var thumb = a.querySelector('img');
            box.classList.add('loading');
            img.onload = function () { box.classList.remove('loading'); };
            img.onerror = function () { box.classList.remove('loading'); };
            img.src = a.getAttribute('href');
            img.alt = thumb ? thumb.alt : '';
            cap.textContent = a.getAttribute('data-caption') || '';
            counter.textContent = (current + 1) + ' / ' + links.length;
            // warm the cache for the neighbours so next/prev feels instant
            [current - 1, current + 1].forEach(function (n) {
                var p = new Image();
                p.src = links[(n + links.length) % links.length].getAttribute('href');
            });
        }

        function open(index) {
            lastFocus = document.activeElement;
            show(index);
            box.hidden = false;
            requestAnimationFrame(function () { box.classList.add('open'); });
            document.body.classList.add('lb-lock');
            closeBtn.focus();
        }

        function close() {
            box.classList.remove('open');
            box.hidden = true;
            document.body.classList.remove('lb-lock');
            if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
        }

        links.forEach(function (a, i) {
            a.addEventListener('click', function (ev) {
                ev.preventDefault();
                open(i);
            });
        });
        closeBtn.addEventListener('click', close);
        prevBtn.addEventListener('click', function () { show(current - 1); });
        nextBtn.addEventListener('click', function () { show(current + 1); });
        // click on the dark backdrop closes
        box.addEventListener('click', function (ev) { if (ev.target === box) { close(); } });

        document.addEventListener('keydown', function (ev) {
            if (box.hidden) { return; }
            if (ev.key === 'Escape') { close(); }
            else if (ev.key === 'ArrowLeft') { show(current - 1); }
            else if (ev.key === 'ArrowRight') { show(current + 1); }
            else if (ev.key === 'Tab') {
                // keep focus inside the dialog
                var f = [closeBtn, prevBtn, nextBtn];
                var idx = f.indexOf(document.activeElement);
                ev.preventDefault();
                var next = ev.shiftKey ? idx - 1 : idx + 1;
                f[(next + f.length) % f.length].focus();
            }
        });

        // swipe on touch screens
        var startX = null;
        box.addEventListener('touchstart', function (ev) { startX = ev.changedTouches[0].clientX; }, { passive: true });
        box.addEventListener('touchend', function (ev) {
            if (startX === null) { return; }
            var dx = ev.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 50) { show(current + (dx < 0 ? 1 : -1)); }
            startX = null;
        }, { passive: true });
    }
    initLightbox();

})(jQuery);
