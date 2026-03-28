document.addEventListener('DOMContentLoaded', function () {
    // initialize
    if (typeof ensureMobileAuthButtons === 'undefined') {
        // ensure function exists for older inline loads
    }
    setupMobileMenuToggle();
    setupHeaderHideOnScroll();

    // ensure auth buttons on load/resize for small screens
    if (window.innerWidth < 768) ensureMobileAuthButtons();
    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) ensureMobileAuthButtons();
    });
});

function ensureMobileAuthButtons() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    if (menu.querySelector('.mobile-auth-buttons')) return; // already added

    const container = document.createElement('div');
    container.className = 'flex flex-col space-y-2 pt-4 border-t border-gray-200 mobile-auth-buttons';
    container.innerHTML = `
        <a href="snippets/sign-in.html" class="inline-flex items-center justify-center font-medium bg-rose-500 text-white hover:bg-rose-600 px-4 py-2 rounded-lg w-full text-center">Sign in</a>
        <a href="snippets/sign-up.html" class="inline-flex items-center justify-center font-medium border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-lg w-full text-center">Sign up</a>
    `;
    menu.appendChild(container);
}

function setupMobileMenuToggle() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const header = document.querySelector('header');
    if (!btn || !menu) return;
    const icon = btn.querySelector('i');

    function updateIcon(open) {
        if (!icon) return;
        icon.classList.remove('ri-menu-line', 'ri-close-line');
        // keep text-xl for size
        icon.classList.add(open ? 'ri-close-line' : 'ri-menu-line', 'text-xl');
    }

    // initialize icon based on aria-expanded or menu visibility
    const initiallyOpen = btn.getAttribute('aria-expanded') === 'true' || !menu.classList.contains('hidden');
    btn.setAttribute('aria-expanded', String(initiallyOpen));
    updateIcon(initiallyOpen);
    if (initiallyOpen && header) {
        header.classList.remove('header-hidden', 'translate-y-full');
    }

    function openMenu() {
        ensureMobileAuthButtons();
        btn.setAttribute('aria-expanded', 'true');
        menu.classList.remove('hidden');
        updateIcon(true);
        // keep header visible and prevent page from scrolling while menu is open
        if (header) {
            header.classList.remove('header-hidden', 'translate-y-full');
        }
        // lock body scroll
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.add('hidden');
        updateIcon(false);
        // restore body scroll
        document.body.style.overflow = '';
        // let the scroll handler re-evaluate header state
        window.dispatchEvent(new Event('scroll'));
    }

    btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (!isOpen) openMenu();
        else closeMenu();
    });

    // prevent clicks inside menu from closing it
    menu.addEventListener('click', function (ev) {
        ev.stopPropagation();
    });

    // close when a link inside menu is clicked
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        closeMenu();
    }));

    // close when clicking outside
    function handleDocumentClick() {
        if (!menu.classList.contains('hidden')) closeMenu();
    }
    document.addEventListener('click', handleDocumentClick);

    // close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handleDocumentClick();
    });

    // close when switching to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && !menu.classList.contains('hidden')) closeMenu();
    });
}

function setupHeaderHideOnScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBtn = document.getElementById('mobile-menu-btn');

    let lastScroll = 0;
    let ticking = false;
    const START_HIDE_OFFSET = 80; // start hiding after this many px

    function update() {
        const current = window.pageYOffset || document.documentElement.scrollTop;

        // if mobile menu is open, keep the header visible and reset lastScroll
        const menuOpen = (mobileBtn && mobileBtn.getAttribute('aria-expanded') === 'true') || (mobileMenu && !mobileMenu.classList.contains('hidden'));
        if (menuOpen) {
            header.classList.remove('header-hidden', 'translate-y-full');
            lastScroll = Math.max(0, current); // prevent next scroll from miscomputing direction
            ticking = false;
            return;
        }

        // hide when scrolling down past START_HIDE_OFFSET
        if (current > lastScroll && current > START_HIDE_OFFSET) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }

        // add small shadow when page is scrolled a bit
        if (current > 8) header.classList.add('shadow-sm');
        else header.classList.remove('shadow-sm');

        lastScroll = Math.max(0, current);
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
}



        (function declare () {
            const drawer = document.getElementById('cart-drawer');
            const overlay = document.getElementById('cart-overlay');
            const desktopBtn = document.getElementById('desktop-cart-btn');
            const mobileBtn = document.getElementById('mobile-cart-btn');
            const closeBtn = document.getElementById('cart-drawer-close');
            const cartItemsContainer = document.getElementById('cart-items');
            const cartCountEl = document.getElementById('cart-count');
            const cartSubtotalEl = document.getElementById('cart-subtotal');
            const checkoutBtn = document.getElementById('checkout-btn');
            const clearBtn = document.getElementById('clear-cart-btn');
            const CART_KEY = 'benatural_cart_v1';

            function loadCart() {
                try {
                    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
                } catch {
                    return {};
                }
            }
            function saveCart(cart) {
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
            }

            function formatPrice(n) {
                return '$' + Number(n).toFixed(2);
            }

            function renderCart() {
                const cart = loadCart();
                const ids = Object.keys(cart);
                const emptyEl = document.getElementById('cart-empty');
                if (!ids.length) {
                    if (emptyEl) emptyEl.style.display = '';
                    cartItemsContainer.querySelectorAll('.cart-item').forEach(e => e.remove());
                    cartCountEl.textContent = '(0)';
                    cartSubtotalEl.textContent = formatPrice(0);
                    return;
                }
                if (emptyEl) emptyEl.style.display = 'none';
                cartItemsContainer.querySelectorAll('.cart-item').forEach(e => e.remove());
                let subtotal = 0;
                ids.forEach(id => {
                    const item = cart[id];
                    subtotal += item.price * item.qty;
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item flex items-center gap-4 py-4 border-b';
                    itemEl.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900">${item.name}</div>
                            <div class="text-sm text-gray-500">${formatPrice(item.price)}</div>
                            <div class="mt-2 inline-flex items-center gap-2">
                                <button class="decrease text-gray-600 px-2 py-1 border rounded" data-id="${id}">-</button>
                                <span class="px-2">${item.qty}</span>
                                <button class="increase text-gray-600 px-2 py-1 border rounded" data-id="${id}">+</button>
                                <button class="remove text-red-500 text-sm ml-4" data-id="${id}">Remove</button>
                            </div>
                        </div>
                    `;
                    cartItemsContainer.appendChild(itemEl);
                });
                cartCountEl.textContent = `(${ids.reduce((s, i) => s + cart[i].qty, 0)})`;
                cartSubtotalEl.textContent = formatPrice(subtotal);
            }

            function openCart() {
                // keep existing class behavior for Tailwind, and also clear inline fallback
                drawer.classList.remove('translate-x-full');
                drawer.style.transform = ''; // <- fallback removal
                drawer.setAttribute('aria-hidden', 'false');
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.classList.add('opacity-100');
                overlay.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                renderCart();
            }

            function closeCart() {
                // keep existing class behavior and set inline fallback
                drawer.classList.add('translate-x-full');
                drawer.style.transform = 'translateX(100%)'; // <- fallback
                drawer.setAttribute('aria-hidden', 'true');
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.classList.remove('opacity-100');
                overlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }

            // Add to cart using event delegation
            document.addEventListener('click', (e) => {
                // header/toolbar cart open
                if (e.target.closest('#desktop-cart-btn') || e.target.closest('#mobile-cart-btn')) {
                    openCart();
                    return;
                }

                // add-to-cart buttons inside product cards (elements with class add-to-cart-btn or cart icon)
                const btn = e.target.closest('.add-to-cart-btn') || (e.target.classList && e.target.classList.contains('ri-shopping-cart-line') && e.target.closest('[data-product-id]'));
                if (!btn) return;

                const card = btn.closest('[data-product-id]');
                if (!card) return;

                const id = card.dataset.productId;
                const name = card.dataset.productName;
                const price = parseFloat(card.dataset.productPrice) || 0;
                const image = card.dataset.productImage || '';

                const cart = loadCart();
                if (!cart[id]) {
                    cart[id] = { id, name, price, image, qty: 0 };
                }
                cart[id].qty += 1;
                saveCart(cart);
                renderCart();
                openCart();
            });

            // cart drawer controls (increase/decrease/remove) using delegation
            cartItemsContainer.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (!id) return;
                const cart = loadCart();
                if (!cart[id]) return;

                if (e.target.classList.contains('increase')) {
                    cart[id].qty += 1;
                } else if (e.target.classList.contains('decrease')) {
                    cart[id].qty = Math.max(1, cart[id].qty - 1);
                } else if (e.target.classList.contains('remove')) {
                    delete cart[id];
                }
                saveCart(cart);
                renderCart();
            });

            // clear cart
            clearBtn.addEventListener('click', () => {
                localStorage.removeItem(CART_KEY);
                renderCart();
            });

            // checkout (placeholder)
            checkoutBtn.addEventListener('click', () => {
                alert('Checkout not implemented in this demo.');
            });

            // overlay and close handlers
            if (desktopBtn) desktopBtn.addEventListener('click', openCart);
            if (mobileBtn) mobileBtn.addEventListener('click', openCart);
            if (closeBtn) closeBtn.addEventListener('click', closeCart);
            overlay.addEventListener('click', closeCart);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeCart();
            });

            // initial render (update count when page loads)
            renderCart();
        })();