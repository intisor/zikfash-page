document.addEventListener('DOMContentLoaded', () => {
    // ── Telemetry Initialization ───────────────────────────────────────
    let sessionId = 'temp-id';
    try {
        sessionId = localStorage.getItem('zf_session_id');
        if (!sessionId) {
            sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('zf_session_id', sessionId);
        }
    } catch (e) {
        // Fallback if localStorage is blocked
        sessionId = 'id-' + Math.random().toString(36).substr(2, 9);
    }

    const supabaseUrl = 'https://wvrasbwfwwmbfhhwejzy.supabase.co';
    const supabaseKey = 'sb_publishable_6I6rcfO2jIe1nkRsfKIjFA_kP9MhQPc';
    let supabaseClient = null;

    if (window.supabase && window.location.protocol !== 'file:') {
        try {
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
                auth: { 
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });
        } catch (e) {
            console.warn('Supabase initialization failed:', e);
        }
        // (Telemetry has been removed for privacy and performance)
    }
    // ──────────────────────────────────────────────────────────────────

    const observerOptions = {
        threshold: 0.1
    };

    const reveals = document.querySelectorAll('.reveal, .reveal-up');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        reveals.forEach(el => el.classList.add('active'));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        reveals.forEach(el => observer.observe(el));
    }

    // Smooth hover effect for hero image
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        heroVisual.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = heroVisual.getBoundingClientRect();
            
            const x = (clientX - left) / width - 0.5;
            const y = (clientY - top) / height - 0.5;

            const img = heroVisual.querySelector('img');
            if (img) {
                img.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
            }
        });

        heroVisual.addEventListener('mouseleave', () => {
            const img = heroVisual.querySelector('img');
            if (img) {
                img.style.transform = `perspective(1000px) rotateY(0) rotateX(0) scale(1)`;
            }
        });
    }

    // ── Onboarding Form Logic ──────────────────────────────────────────
    const onboardForm = document.getElementById('onboardForm');
    const phoneInput = document.getElementById('phoneInput');
    const phoneInputWrap = document.getElementById('phoneInputWrap');
    const phoneError = document.getElementById('phoneError');

    function cleanPhoneInput(val) {
        let cleaned = '';
        for (let i = 0; i < val.length; i++) {
            let char = val[i];
            if (i === 0 && char === '+') {
                cleaned += char;
            } else if (/[\d\s\-()]/.test(char)) {
                cleaned += char;
            }
        }
        return cleaned;
    }

    function validatePhone() {
        if (!phoneInput) return false;
        const val = phoneInput.value.trim();
        if (!val) {
            phoneInputWrap.classList.add('invalid-input');
            phoneError.style.display = 'flex';
            phoneError.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.95rem">error</span> Phone number is required';
            return false;
        }

        const phoneRegex = /^\+?[0-9\s\-()]+$/;
        const digits = val.replace(/\D/g, '');
        const isValid = phoneRegex.test(val) && digits.length >= 7 && digits.length <= 15;

        if (!isValid) {
            phoneInputWrap.classList.add('invalid-input');
            phoneError.style.display = 'flex';
            phoneError.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.95rem">error</span> Invalid format (7-15 digits allowed)';
            return false;
        } else {
            phoneInputWrap.classList.remove('invalid-input');
            phoneError.style.display = 'none';
            phoneError.textContent = '';
            return true;
        }
    }

    if (phoneInput) {
        phoneInput.addEventListener('keypress', (e) => {
            if (!/[0-9\s\-()+]/.test(e.key)) {
                e.preventDefault();
            }
        });

        phoneInput.addEventListener('input', () => {
            const cleaned = cleanPhoneInput(phoneInput.value);
            if (phoneInput.value !== cleaned) {
                phoneInput.value = cleaned;
            }
            validatePhone();
        });

        phoneInput.addEventListener('blur', () => {
            validatePhone();
        });
    }

    if (onboardForm) {
        onboardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const shopName = document.getElementById('shopNameInput').value;
            const phone = phoneInput ? phoneInput.value : '';
            const currency = document.getElementById('currencySelect').value;
            
            const isPhoneValid = validatePhone();
            if (!isPhoneValid) {
                if (phoneInputWrap) {
                    phoneInputWrap.classList.add('shake-input');
                    setTimeout(() => {
                        phoneInputWrap.classList.remove('shake-input');
                    }, 400);
                }
                return;
            }

            if (shopName && phone && currency) {
                const btn = onboardForm.querySelector('.btn-gold');
                if (btn) {
                    btn.innerText = "Starting...";
                    btn.style.opacity = '0.8';
                    btn.style.pointerEvents = 'none';
                }

                // Sync shop to CRM
                if (supabaseClient) {
                    (async () => {
                        try {
                            await supabaseClient.rpc('upsert_shop', {
                                p_session_id: sessionId,
                                p_shop_name: shopName,
                                p_phone: phone,
                                p_currency: currency
                            });
                        } catch (e) {}
                    })();
                }

                const baseUrl = 'https://zikfash.intitech.dev';
                const params = new URLSearchParams();
                params.set('ref', 'tailor');
                params.set('shop', shopName);
                params.set('phone', phone);
                params.set('currency', currency);
                params.set('session_id', sessionId); // Pass session ID to the App
                
                setTimeout(() => {
                    window.location.href = `${baseUrl}?${params.toString()}`;
                }, 400);
            } else {
                alert("Please provide Shop Name, Phone Number, and Currency.");
            }
        });
    }


    // ── Native Carousel Sync Logic ───────────────
    const setupCarouselSync = (gridSelector, navSelector) => {
        const grid = document.querySelector(gridSelector);
        const anchors = document.querySelectorAll(navSelector);
        if (!grid || anchors.length === 0) return;

        // Click pill to scroll to card
        anchors.forEach((anchor, index) => {
            anchor.addEventListener('click', () => {
                const card = grid.children[index];
                if (card) {
                    const scrollLeft = card.offsetLeft - grid.offsetLeft;
                    grid.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            });
        });

        // Scroll card to update active pill
        grid.addEventListener('scroll', () => {
            let activeIndex = 0;
            let minDiff = Infinity;
            
            Array.from(grid.children).forEach((card, index) => {
                const diff = Math.abs((card.offsetLeft - grid.offsetLeft) - grid.scrollLeft);
                if (diff < minDiff) {
                    minDiff = diff;
                    activeIndex = index;
                }
            });

            anchors.forEach((a, idx) => {
                if (idx === activeIndex) {
                    if (!a.classList.contains('active')) {
                        a.classList.add('active');
                        // Scroll pill container to keep active pill visible
                        a.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                } else {
                    a.classList.remove('active');
                }
            });
        }, { passive: true });
    };

    setupCarouselSync('.feature-grid', '#features .carousel-anchor');
    setupCarouselSync('.ai-grid', '.ai-carousel-nav .carousel-anchor');

    // Trigger the Z-logo transformation after the glide to top-left is done
    // Mobile: 5.5s animation + 2s delay + 0.5s buffer = 8s
    // Desktop: 7s animation + 2s delay + 0.5s buffer = 9.5s
    const isSmallMobile = window.matchMedia('(max-width: 480px)').matches;
    const transformationDelay = isSmallMobile ? 8000 : 9500;

    setTimeout(() => {
        const scissors = document.getElementById('scissors');
        const rig = document.getElementById('logo-rig');
        if (scissors) scissors.classList.add('transformed');
        if (rig) rig.classList.add('transformed');
    }, transformationDelay);
});
