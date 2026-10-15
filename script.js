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

    // ── UTM & Traffic Attribution Engine ──────────────────────────────
    let zfAttribution = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        const utmContent = urlParams.get('utm_content');
        const utmTerm = urlParams.get('utm_term');
        const gclid = urlParams.get('gclid');
        const fbclid = urlParams.get('fbclid');
        const ttclid = urlParams.get('ttclid');

        let refHost = '';
        if (document.referrer) {
            try {
                refHost = new URL(document.referrer).hostname.toLowerCase();
            } catch (e) {}
        }

        let detectedSource = utmSource;
        let detectedMedium = utmMedium;
        let detectedCampaign = utmCampaign || '';
        const clickId = gclid || fbclid || ttclid || null;

        if (!detectedSource) {
            if (ttclid) {
                detectedSource = 'tiktok';
                detectedMedium = 'cpc';
            } else if (fbclid) {
                detectedSource = 'facebook';
                detectedMedium = 'cpc';
            } else if (gclid) {
                detectedSource = 'google';
                detectedMedium = 'cpc';
            } else if (refHost) {
                if (refHost.includes('tiktok.com')) {
                    detectedSource = 'tiktok';
                    detectedMedium = 'social';
                } else if (refHost.includes('instagram.com')) {
                    detectedSource = 'instagram';
                    detectedMedium = 'social';
                } else if (refHost.includes('facebook.com') || refHost.includes('fb.com') || refHost.includes('messenger.com')) {
                    detectedSource = 'facebook';
                    detectedMedium = 'social';
                } else if (refHost.includes('google.')) {
                    detectedSource = 'google';
                    detectedMedium = 'organic';
                } else if (refHost.includes('x.com') || refHost.includes('t.co') || refHost.includes('twitter.com')) {
                    detectedSource = 'twitter';
                    detectedMedium = 'social';
                } else if (refHost.includes('youtube.com')) {
                    detectedSource = 'youtube';
                    detectedMedium = 'video';
                } else if (refHost.includes('linkedin.com')) {
                    detectedSource = 'linkedin';
                    detectedMedium = 'social';
                } else if (refHost.includes('whatsapp') || refHost.includes('wa.me')) {
                    detectedSource = 'whatsapp';
                    detectedMedium = 'chat';
                } else {
                    detectedSource = refHost.replace(/^www\./, '');
                    detectedMedium = 'referral';
                }
            } else {
                detectedSource = 'direct';
                detectedMedium = 'none';
            }
        }

        if (!detectedMedium) {
            detectedMedium = detectedSource === 'direct' ? 'none' : 'referral';
        }

        zfAttribution = {
            utm_source: detectedSource,
            utm_medium: detectedMedium,
            utm_campaign: detectedCampaign,
            utm_content: utmContent || '',
            utm_term: utmTerm || '',
            referrer: document.referrer || '',
            referrer_domain: refHost,
            click_id: clickId,
            landing_path: window.location.pathname,
            captured_at: new Date().toISOString()
        };

        // Persist first-touch attribution (never overwrite first touch)
        if (!localStorage.getItem('zf_first_attribution')) {
            localStorage.setItem('zf_first_attribution', JSON.stringify(zfAttribution));
        }
        // Always store last-touch attribution
        localStorage.setItem('zf_last_attribution', JSON.stringify(zfAttribution));
        window.zfAttribution = zfAttribution;

        // Dispatch custom event and send to GA4
        window.dispatchEvent(new CustomEvent('zf_attribution_ready', { detail: zfAttribution }));
        if (typeof window.gtag === 'function') {
            window.gtag('set', 'user_properties', {
                traffic_source: zfAttribution.utm_source,
                traffic_medium: zfAttribution.utm_medium,
                traffic_campaign: zfAttribution.utm_campaign
            });
        }
    } catch (e) {
        console.warn('Attribution detection failed:', e);
    }

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

    // ── Header Scroll Glass Effect ─────────────────────────────────────
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // Auto-close mobile navigation drawer on link click
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav a');
    if (navToggle && navLinks.length) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navToggle.checked) {
                    navToggle.checked = false;
                }
            });
        });
    }

    // Smooth hover effect for hero illustration
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        heroVisual.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = heroVisual.getBoundingClientRect();
            
            const x = (clientX - left) / width - 0.5;
            const y = (clientY - top) / height - 0.5;

            const target = heroVisual.querySelector('.illustration-container') || heroVisual.querySelector('img');
            if (target) {
                target.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
            }
        });

        heroVisual.addEventListener('mouseleave', () => {
            const target = heroVisual.querySelector('.illustration-container') || heroVisual.querySelector('img');
            if (target) {
                target.style.transform = `perspective(1000px) rotateY(0) rotateX(0)`;
            }
        });
    }

    // ── Smart Geotagging & Currency Detection (No Location Permission) ─
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        let userManuallyChangedCurrency = false;

        // Persist when user selects manually
        currencySelect.addEventListener('change', () => {
            userManuallyChangedCurrency = true;
            try {
                localStorage.setItem('zf_currency', currencySelect.value);
            } catch (e) {}
        });

        // 1. Check if user already picked a preferred currency in a previous session
        let hasRestoredPreference = false;
        try {
            const savedCurrency = localStorage.getItem('zf_currency');
            if (savedCurrency && currencySelect.querySelector(`option[value="${savedCurrency}"]`)) {
                currencySelect.value = savedCurrency;
                hasRestoredPreference = true;
                userManuallyChangedCurrency = true;
            }
        } catch (e) {}

        // Helper: apply country code if matched to an option's data-countries
        const applyCountry = (countryCode) => {
            if (!countryCode || !currencySelect) return false;
            countryCode = countryCode.toUpperCase().trim();
            const option = currencySelect.querySelector(`option[data-countries~="${countryCode}"]`);
            if (option) {
                currencySelect.value = option.value;
                if (typeof updateCurrencyTriggerUI === 'function') {
                    updateCurrencyTriggerUI();
                }
                return true;
            }
            return false;
        };

        // Comprehensive IANA Timezone to Country Code Mapping (Instant, 100% Offline, Zero Permission)
        const getCountryFromTimezone = () => {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (!tz) return null;

                const tzMap = {
                    // West & Central Africa
                    'Africa/Lagos': 'NG',
                    'Africa/Accra': 'GH',
                    'Africa/Abidjan': 'CI',
                    'Africa/Dakar': 'SN',
                    'Africa/Douala': 'CM',
                    'Africa/Bamako': 'ML',
                    'Africa/Ouagadougou': 'BF',
                    'Africa/Lome': 'TG',
                    'Africa/Cotonou': 'BJ',
                    'Africa/Niamey': 'NE',
                    'Africa/Bissau': 'GW',
                    'Africa/Libreville': 'GA',
                    'Africa/Brazzaville': 'CG',
                    'Africa/Bangui': 'CF',
                    'Africa/Ndjamena': 'TD',
                    'Africa/Malabo': 'GQ',
                    'Africa/Freetown': 'SL',
                    'Africa/Monrovia': 'LR',
                    'Africa/Banjul': 'GM',
                    'Africa/Conakry': 'GN',
                    'Africa/Kinshasa': 'CD',
                    'Africa/Lubumbashi': 'CD',
                    'Africa/Luanda': 'AO',

                    // East & Southern Africa
                    'Africa/Nairobi': 'KE',
                    'Africa/Dar_es_Salaam': 'TZ',
                    'Africa/Kampala': 'UG',
                    'Africa/Kigali': 'RW',
                    'Africa/Addis_Ababa': 'ET',
                    'Africa/Johannesburg': 'ZA',
                    'Africa/Maseru': 'ZA',
                    'Africa/Mbabane': 'ZA',
                    'Africa/Gaborone': 'BW',
                    'Africa/Windhoek': 'NA',
                    'Africa/Lusaka': 'ZM',
                    'Africa/Harare': 'US',
                    'Africa/Maputo': 'MZ',
                    'Indian/Mauritius': 'MU',
                    'Indian/Antananarivo': 'MG',
                    'Africa/Blantyre': 'MW',

                    // North Africa & Middle East
                    'Africa/Cairo': 'EG',
                    'Africa/Casablanca': 'MA',
                    'Africa/El_Aaiun': 'MA',
                    'Africa/Algiers': 'DZ',
                    'Africa/Tunis': 'TN',
                    'Asia/Dubai': 'AE',
                    'Asia/Riyadh': 'SA',
                    'Asia/Qatar': 'QA',
                    'Asia/Kuwait': 'KW',
                    'Asia/Bahrain': 'BH',
                    'Asia/Muscat': 'OM',
                    'Asia/Amman': 'JO',
                    'Asia/Jerusalem': 'IL',
                    'Asia/Tel_Aviv': 'IL',
                    'Asia/Beirut': 'LB',

                    // Europe & UK
                    'Europe/London': 'GB',
                    'Europe/Belfast': 'GB',
                    'Europe/Dublin': 'IE',
                    'Europe/Paris': 'FR',
                    'Europe/Berlin': 'DE',
                    'Europe/Rome': 'IT',
                    'Europe/Madrid': 'ES',
                    'Europe/Amsterdam': 'NL',
                    'Europe/Brussels': 'BE',
                    'Europe/Vienna': 'AT',
                    'Europe/Lisbon': 'PT',
                    'Europe/Athens': 'GR',
                    'Europe/Helsinki': 'FI',
                    'Europe/Zurich': 'CH',
                    'Europe/Stockholm': 'SE',
                    'Europe/Oslo': 'NO',
                    'Europe/Copenhagen': 'DK',
                    'Europe/Warsaw': 'PL',
                    'Europe/Istanbul': 'TR',
                    'Europe/Prague': 'CZ',
                    'Europe/Budapest': 'HU',
                    'Europe/Bucharest': 'RO',

                    // Americas & Caribbean
                    'America/New_York': 'US',
                    'America/Chicago': 'US',
                    'America/Denver': 'US',
                    'America/Los_Angeles': 'US',
                    'America/Phoenix': 'US',
                    'America/Detroit': 'US',
                    'America/Anchorage': 'US',
                    'Pacific/Honolulu': 'US',
                    'America/Toronto': 'CA',
                    'America/Vancouver': 'CA',
                    'America/Montreal': 'CA',
                    'America/Edmonton': 'CA',
                    'America/Winnipeg': 'CA',
                    'America/Halifax': 'CA',
                    'America/St_Johns': 'CA',
                    'America/Mexico_City': 'MX',
                    'America/Cancun': 'MX',
                    'America/Monterrey': 'MX',
                    'America/Tijuana': 'MX',
                    'America/Sao_Paulo': 'BR',
                    'America/Fortaleza': 'BR',
                    'America/Manaus': 'BR',
                    'America/Recife': 'BR',
                    'America/Bogota': 'CO',
                    'America/Argentina/Buenos_Aires': 'AR',
                    'America/Santiago': 'CL',
                    'America/Lima': 'PE',
                    'America/Jamaica': 'JM',
                    'America/Port_of_Spain': 'TT',
                    'America/Barbados': 'BB',
                    'America/Guyana': 'GY',
                    'America/Nassau': 'BS',
                    'America/Santo_Domingo': 'DO',

                    // Asia & Pacific
                    'Asia/Kolkata': 'IN',
                    'Asia/Calcutta': 'IN',
                    'Asia/Karachi': 'PK',
                    'Asia/Dhaka': 'BD',
                    'Asia/Colombo': 'LK',
                    'Asia/Kathmandu': 'NP',
                    'Asia/Manila': 'PH',
                    'Asia/Jakarta': 'ID',
                    'Asia/Makassar': 'ID',
                    'Asia/Jayapura': 'ID',
                    'Asia/Kuala_Lumpur': 'MY',
                    'Asia/Singapore': 'SG',
                    'Australia/Sydney': 'AU',
                    'Australia/Melbourne': 'AU',
                    'Australia/Brisbane': 'AU',
                    'Australia/Perth': 'AU',
                    'Australia/Adelaide': 'AU',
                    'Pacific/Auckland': 'NZ',
                    'Asia/Tokyo': 'JP',
                    'Asia/Shanghai': 'CN',
                    'Asia/Hong_Kong': 'HK',
                    'Asia/Seoul': 'KR',
                    'Asia/Bangkok': 'TH',
                    'Asia/Ho_Chi_Minh': 'VN'
                };

                if (tzMap[tz]) return tzMap[tz];

                // Heuristic fallbacks by continent prefix
                if (tz.startsWith('Africa/')) {
                    const cfaCities = ['Abidjan', 'Dakar', 'Douala', 'Bamako', 'Ouagadougou', 'Lome', 'Cotonou', 'Niamey', 'Libreville', 'Brazzaville', 'Bangui', 'Ndjamena', 'Malabo'];
                    if (cfaCities.some(c => tz.includes(c))) return 'SN';
                    return null;
                }
                if (tz.startsWith('America/')) return 'US';
                if (tz.startsWith('Europe/')) return 'FR';
                if (tz.startsWith('Australia/')) return 'AU';
            } catch (e) {}
            return null;
        };

        // Browser language/locale tag (e.g. "en-GB", "fr-SN", "en-US")
        const getCountryFromLocale = () => {
            try {
                const langs = navigator.languages || [navigator.language || ''];
                for (const lang of langs) {
                    if (!lang) continue;
                    const parts = lang.split('-');
                    if (parts.length > 1 && parts[1].length === 2) {
                        return parts[1].toUpperCase();
                    }
                }
            } catch (e) {}
            return null;
        };

        // If no prior manual preference was found, run zero-permission detection
        if (!hasRestoredPreference) {
            let matched = false;
            // A. Instant synchronous timezone detection (100% offline, 0ms latency)
            const tzCountry = getCountryFromTimezone();
            if (tzCountry) {
                matched = applyCountry(tzCountry);
            }
            // B. Locale tag fallback
            if (!matched) {
                const locCountry = getCountryFromLocale();
                if (locCountry) {
                    matched = applyCountry(locCountry);
                }
            }

            // C. Lightweight IP geotagging check (Zero location permission, silent fallback)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                fetch('https://api.country.is/', { signal: controller.signal })
                    .then(res => res.json())
                    .then(data => {
                        clearTimeout(timeoutId);
                        if (data && data.country && !userManuallyChangedCurrency) {
                            applyCountry(data.country);
                        }
                    })
                    .catch(() => {});
            } catch (e) {}
        }
    }

    // ── Google Analytics / Stripe Style Searchable Currency Picker ─────────
    const countryAliases = {
        'NG': 'Nigeria Lagos Abuja Kano Ibadan Port Harcourt',
        'GH': 'Ghana Accra Kumasi Cedi',
        'KE': 'Kenya Nairobi Mombasa Shilling',
        'US': 'United States USA America Dollar',
        'GB': 'United Kingdom UK Great Britain England London British Pound',
        'FR': 'France Paris Euro',
        'DE': 'Germany Berlin Euro',
        'IT': 'Italy Rome Euro',
        'ES': 'Spain Madrid Euro',
        'NL': 'Netherlands Amsterdam Euro',
        'SN': 'Senegal Dakar CFA Franc',
        'CI': 'Ivory Coast Cote d\'Ivoire Abidjan CFA Franc',
        'CM': 'Cameroon Douala Yaounde CFA Franc',
        'BJ': 'Benin Cotonou CFA Franc',
        'TG': 'Togo Lome CFA Franc',
        'ML': 'Mali Bamako CFA Franc',
        'BF': 'Burkina Faso Ouagadougou CFA Franc',
        'NE': 'Niger Niamey CFA Franc',
        'GA': 'Gabon Libreville CFA Franc',
        'CG': 'Congo Brazzaville CFA Franc',
        'ZA': 'South Africa Johannesburg Cape Town Durban Rand',
        'AE': 'United Arab Emirates UAE Dubai Abu Dhabi Dirham',
        'SA': 'Saudi Arabia Riyadh Jeddah Dirham Riyal',
        'IN': 'India Delhi Mumbai Bangalore Rupee',
        'CA': 'Canada Toronto Vancouver Montreal Canadian Dollar',
        'AU': 'Australia Sydney Melbourne Australian Dollar',
        'SL': 'Sierra Leone Freetown Leone',
        'LR': 'Liberia Monrovia Liberian Dollar',
        'GM': 'Gambia Banjul Dalasi',
        'GN': 'Guinea Conakry Franc',
        'CD': 'Democratic Republic of Congo Kinshasa Congolese Franc',
        'AO': 'Angola Luanda Kwanza',
        'TZ': 'Tanzania Dar es Salaam Zanzibar Shilling',
        'UG': 'Uganda Kampala Shilling',
        'RW': 'Rwanda Kigali Franc',
        'ET': 'Ethiopia Addis Ababa Birr',
        'ZM': 'Zambia Lusaka Kwacha',
        'MZ': 'Mozambique Maputo Metical',
        'BW': 'Botswana Gaborone Pula',
        'NA': 'Namibia Windhoek Dollar',
        'MU': 'Mauritius Port Louis Rupee',
        'MG': 'Madagascar Antananarivo Ariary',
        'MW': 'Malawi Lilongwe Kwacha',
        'EG': 'Egypt Cairo Alexandria Egyptian Pound',
        'MA': 'Morocco Casablanca Rabat Dirham',
        'DZ': 'Algeria Algiers Dinar',
        'TN': 'Tunisia Tunis Dinar',
        'QA': 'Qatar Doha Riyal',
        'KW': 'Kuwait Kuwait City Dinar',
        'BH': 'Bahrain Manama Dinar',
        'OM': 'Oman Muscat Rial',
        'JO': 'Jordan Amman Dinar',
        'IL': 'Israel Tel Aviv Jerusalem Shekel',
        'LB': 'Lebanon Beirut Pound',
        'CH': 'Switzerland Zurich Geneva Swiss Franc',
        'SE': 'Sweden Stockholm Krona',
        'NO': 'Norway Oslo Krone',
        'DK': 'Denmark Copenhagen Krone',
        'PL': 'Poland Warsaw Zloty',
        'TR': 'Turkey Istanbul Ankara Lira',
        'CZ': 'Czech Republic Prague Koruna',
        'HU': 'Hungary Budapest Forint',
        'RO': 'Romania Bucharest Leu',
        'MX': 'Mexico Mexico City Peso',
        'BR': 'Brazil Sao Paulo Rio Real',
        'CO': 'Colombia Bogota Peso',
        'AR': 'Argentina Buenos Aires Peso',
        'CL': 'Chile Santiago Peso',
        'PE': 'Peru Lima Sol',
        'JM': 'Jamaica Kingston Jamaican Dollar',
        'TT': 'Trinidad and Tobago Port of Spain Dollar',
        'BB': 'Barbados Bridgetown Dollar',
        'GY': 'Guyana Georgetown Dollar',
        'BS': 'Bahamas Nassau Dollar',
        'DO': 'Dominican Republic Santo Domingo Peso',
        'PK': 'Pakistan Karachi Lahore Islamabad Rupee',
        'BD': 'Bangladesh Dhaka Taka',
        'LK': 'Sri Lanka Colombo Rupee',
        'NP': 'Nepal Kathmandu Rupee',
        'PH': 'Philippines Manila Peso',
        'ID': 'Indonesia Jakarta Rupiah',
        'MY': 'Malaysia Kuala Lumpur Ringgit',
        'SG': 'Singapore Dollar',
        'NZ': 'New Zealand Auckland Wellington Dollar',
        'JP': 'Japan Tokyo Yen',
        'CN': 'China Beijing Shanghai Guangzhou Yuan',
        'HK': 'Hong Kong Dollar',
        'KR': 'South Korea Seoul Won',
        'TH': 'Thailand Bangkok Baht',
        'VN': 'Vietnam Ho Chi Minh City Hanoi Dong'
    };

    function updateCurrencyTriggerUI() {
        const select = document.getElementById('currencySelect');
        const triggerSymbol = document.getElementById('currTriggerSymbol');
        const triggerCode = document.getElementById('currTriggerCode');
        const list = document.getElementById('currencyOptionsList');
        if (!select || !triggerSymbol || !triggerCode) return;

        const selectedOption = select.options[select.selectedIndex] || select.options[0];
        if (!selectedOption) return;

        const val = selectedOption.value;
        const code = selectedOption.getAttribute('data-code') || '';

        triggerSymbol.textContent = val;
        triggerCode.textContent = code;

        if (list) {
            const allItems = list.querySelectorAll('.zf-curr-item');
            allItems.forEach(item => {
                const isMatch = item.getAttribute('data-code') === code && item.getAttribute('data-value') === val;
                item.classList.toggle('is-selected', isMatch);
                item.setAttribute('aria-selected', isMatch ? 'true' : 'false');
            });
        }
    }

    function initSearchableCurrencyPicker() {
        const select = document.getElementById('currencySelect');
        const trigger = document.getElementById('currencyTrigger');
        const triggerWrap = document.getElementById('currencySelectWrap');
        const modal = document.getElementById('currencyModal');
        const backdrop = document.getElementById('currModalBackdrop');
        const closeBtn = document.getElementById('currModalClose');
        const searchInput = document.getElementById('currencySearchInput');
        const searchClear = document.getElementById('currSearchClear');
        const resetBtn = document.getElementById('currResetSearch');
        const listContainer = document.getElementById('currencyOptionsList');
        const emptyState = document.getElementById('currencyEmptyState');
        const emptyQuery = document.getElementById('currEmptyQuery');
        const chips = document.querySelectorAll('#currFilterChips .curr-chip');

        if (!select || !trigger || !modal || !listContainer) return;

        // Build list dynamically from <select> options to stay 100% in sync
        listContainer.innerHTML = '';
        const optgroups = select.querySelectorAll('optgroup');

        optgroups.forEach((group) => {
            const groupTitle = document.createElement('div');
            groupTitle.className = 'zf-curr-group-title';
            groupTitle.textContent = group.label;
            groupTitle.dataset.group = group.label.toLowerCase();
            listContainer.appendChild(groupTitle);

            const options = group.querySelectorAll('option');
            options.forEach(opt => {
                const val = opt.value;
                const code = opt.getAttribute('data-code') || '';
                const countries = opt.getAttribute('data-countries') || '';
                const fullTitle = opt.getAttribute('title') || opt.textContent;

                // Extract clean currency name
                const cleanName = fullTitle.replace(/\s*\([^)]*\)/g, '').trim();

                // Country subtext
                let subtext = `${code}`;
                const primaryCountryCode = countries.split(' ')[0];
                if (primaryCountryCode && countryAliases[primaryCountryCode]) {
                    const countryName = countryAliases[primaryCountryCode].split(' ')[0];
                    subtext += ` · ${countryName}`;
                }

                // Search keywords index
                const aliasWords = countries.split(' ').map(c => countryAliases[c] || '').join(' ');
                const keywords = `${val} ${code} ${cleanName} ${fullTitle} ${countries} ${aliasWords}`.toLowerCase();

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'zf-curr-item';
                btn.role = 'option';
                btn.dataset.value = val;
                btn.dataset.code = code;
                btn.dataset.keywords = keywords;
                btn.dataset.group = group.label.toLowerCase();
                btn.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
                if (opt.selected) {
                    btn.classList.add('is-selected');
                }

                btn.innerHTML = `
                    <div class="zf-curr-item-left">
                        <span class="zf-curr-badge">${val}</span>
                        <div class="zf-curr-info">
                            <span class="zf-curr-name">${cleanName}</span>
                            <span class="zf-curr-sub">${subtext}</span>
                        </div>
                    </div>
                    <div class="zf-curr-item-right">
                        <span class="zf-curr-code-tag">${code}</span>
                        <span class="material-symbols-outlined zf-curr-check-icon">check</span>
                    </div>
                `;

                btn.addEventListener('click', () => {
                    selectCurrency(val, code);
                });

                listContainer.appendChild(btn);
            });
        });

        // Set initial trigger UI
        updateCurrencyTriggerUI();

        function selectCurrency(val, code) {
            const matchingOpt = Array.from(select.options).find(opt => opt.value === val && opt.getAttribute('data-code') === code) || Array.from(select.options).find(opt => opt.value === val);
            if (matchingOpt) {
                matchingOpt.selected = true;
                select.value = matchingOpt.value;
            } else {
                select.value = val;
            }
            select.dispatchEvent(new Event('change', { bubbles: true }));
            updateCurrencyTriggerUI();
            closeModal();
        }

        let currentFilter = 'all';

        function filterCurrencies() {
            const query = searchInput.value.trim().toLowerCase();
            const items = listContainer.querySelectorAll('.zf-curr-item');
            const groupTitles = listContainer.querySelectorAll('.zf-curr-group-title');

            if (searchClear) {
                searchClear.style.display = query ? 'flex' : 'none';
            }

            let totalVisible = 0;
            const visibleGroups = new Set();

            items.forEach(item => {
                const itemGroup = item.dataset.group || '';
                const itemKeywords = item.dataset.keywords || '';

                let matchesCategory = true;
                if (currentFilter === 'popular') {
                    matchesCategory = itemGroup.includes('popular') || itemGroup.includes('africa');
                } else if (currentFilter === 'global') {
                    matchesCategory = itemGroup.includes('popular') || itemGroup.includes('global');
                } else if (currentFilter === 'europe') {
                    matchesCategory = itemGroup.includes('europe') || itemGroup.includes('kingdom');
                } else if (currentFilter === 'americas') {
                    matchesCategory = itemGroup.includes('americas') || itemGroup.includes('caribbean');
                } else if (currentFilter === 'asia') {
                    matchesCategory = itemGroup.includes('asia') || itemGroup.includes('pacific');
                }

                const matchesQuery = !query || itemKeywords.includes(query);

                if (matchesCategory && matchesQuery) {
                    item.style.display = 'flex';
                    visibleGroups.add(itemGroup);
                    totalVisible++;
                } else {
                    item.style.display = 'none';
                }
            });

            groupTitles.forEach(title => {
                const g = title.dataset.group || '';
                title.style.display = visibleGroups.has(g) ? 'block' : 'none';
            });

            if (emptyState) {
                if (totalVisible === 0) {
                    emptyState.style.display = 'block';
                    if (emptyQuery) emptyQuery.textContent = query;
                    listContainer.style.display = 'none';
                } else {
                    emptyState.style.display = 'none';
                    listContainer.style.display = 'block';
                }
            }
        }

        function openModal() {
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            trigger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';

            // Reset search input
            if (searchInput) {
                searchInput.value = '';
                if (searchClear) searchClear.style.display = 'none';
                setTimeout(() => searchInput.focus(), 80);
            }

            // Reset category filter to 'all'
            currentFilter = 'all';
            chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'all'));
            filterCurrencies();

            // Scroll selected item into view
            setTimeout(() => {
                const selectedItem = listContainer.querySelector('.zf-curr-item.is-selected');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }, 100);
        }

        function closeModal() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            trigger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            trigger.focus();
        }

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });

        if (triggerWrap) {
            triggerWrap.addEventListener('click', (e) => {
                if (e.target !== trigger && !trigger.contains(e.target)) {
                    openModal();
                }
            });
        }

        if (backdrop) backdrop.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('is-open')) return;

            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Enter' && document.activeElement === searchInput) {
                e.preventDefault();
                const firstVisible = listContainer.querySelector('.zf-curr-item[style*="display: flex"], .zf-curr-item:not([style*="display: none"])');
                if (firstVisible) {
                    firstVisible.click();
                }
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', filterCurrencies);
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchInput.focus();
                filterCurrencies();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentFilter = 'all';
                chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'all'));
                filterCurrencies();
                if (searchInput) searchInput.focus();
            });
        }

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentFilter = chip.dataset.filter || 'all';
                filterCurrencies();
            });
        });

        // Listen for changes on native select
        select.addEventListener('change', () => {
            updateCurrencyTriggerUI();
        });
    }

    // Initialize the searchable currency picker
    initSearchableCurrencyPicker();

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
                try {
                    sessionStorage.setItem('zf_signed_up', 'true');
                } catch (e) {}
                const waChatPrompt = document.getElementById('waChatPrompt');
                if (waChatPrompt) waChatPrompt.classList.remove('active');

                const btn = onboardForm.querySelector('.btn-gold');
                if (btn) {
                    btn.innerText = "Starting...";
                    btn.style.opacity = '0.8';
                    btn.style.pointerEvents = 'none';
                }

                // Track Conversion in Google Analytics (GA4)
                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'sign_up_initiated', {
                        shop_name: shopName,
                        currency: currency,
                        traffic_source: zfAttribution ? zfAttribution.utm_source : 'direct',
                        traffic_medium: zfAttribution ? zfAttribution.utm_medium : 'none',
                        traffic_campaign: zfAttribution ? zfAttribution.utm_campaign : 'none'
                    });
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

                const baseUrl = 'https://app.zikfash.com';
                const params = new URLSearchParams();
                params.set('ref', 'tailor');
                params.set('shop', shopName);
                params.set('phone', phone);
                params.set('currency', currency);
                params.set('session_id', sessionId); // Pass session ID to the App

                // Forward Attribution & UTM Data to the App
                if (zfAttribution) {
                    if (zfAttribution.utm_source) params.set('utm_source', zfAttribution.utm_source);
                    if (zfAttribution.utm_medium) params.set('utm_medium', zfAttribution.utm_medium);
                    if (zfAttribution.utm_campaign) params.set('utm_campaign', zfAttribution.utm_campaign);
                    if (zfAttribution.utm_content) params.set('utm_content', zfAttribution.utm_content);
                    if (zfAttribution.utm_term) params.set('utm_term', zfAttribution.utm_term);
                    if (zfAttribution.referrer_domain) params.set('ref_domain', zfAttribution.referrer_domain);
                    if (zfAttribution.click_id) params.set('click_id', zfAttribution.click_id);
                }
                
                setTimeout(() => {
                    window.location.href = `${baseUrl}?${params.toString()}`;
                }, 400);
            } else {
                alert("Please provide Shop Name, Phone Number, and Currency.");
            }
        });
    }


    // ── Native Carousel Sync & Auto-Next Logic ─────────────────────────
    const setupCarouselSync = (gridSelector, navSelector, autoIntervalMs = 4500) => {
        const grid = document.querySelector(gridSelector);
        const anchors = Array.from(document.querySelectorAll(navSelector));
        if (!grid || anchors.length === 0) return;

        const navContainer = anchors[0].closest('.features-carousel-nav, .ai-carousel-nav');
        const cards = Array.from(grid.children);
        let currentIndex = 0;
        let isUserInteracting = false;
        let resumeTimer = null;
        let autoTimer = null;
        let isVisibleOnScreen = false;

        const scrollToCard = (index, smooth = true) => {
            if (index < 0 || index >= cards.length) return;
            currentIndex = index;
            const card = cards[index];
            if (card) {
                const scrollLeft = card.offsetLeft - grid.offsetLeft;
                grid.scrollTo({ left: scrollLeft, behavior: smooth ? 'smooth' : 'auto' });
            }
            updateActivePill(index);
        };

        const updateActivePill = (index) => {
            anchors.forEach((a, idx) => {
                if (idx === index) {
                    if (!a.classList.contains('active')) {
                        a.classList.add('active');
                    }
                    // Smoothly center active pill in its horizontal nav without scrolling the window
                    if (navContainer) {
                        const pillLeft = a.offsetLeft - navContainer.offsetLeft;
                        const targetScroll = pillLeft - (navContainer.clientWidth / 2) + (a.clientWidth / 2);
                        navContainer.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
                    }
                } else {
                    a.classList.remove('active');
                }
            });
        };

        // Click pill to jump to card
        anchors.forEach((anchor, index) => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                pauseAutoPlay();
                scrollToCard(index);
                scheduleResume(7000);
            });
        });

        // Track user scroll position to update active pill
        let scrollRaf = null;
        grid.addEventListener('scroll', () => {
            if (scrollRaf) cancelAnimationFrame(scrollRaf);
            scrollRaf = requestAnimationFrame(() => {
                let activeIndex = 0;
                let minDiff = Infinity;
                
                cards.forEach((card, index) => {
                    const diff = Math.abs((card.offsetLeft - grid.offsetLeft) - grid.scrollLeft);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIndex = index;
                    }
                });

                if (activeIndex !== currentIndex) {
                    currentIndex = activeIndex;
                    updateActivePill(activeIndex);
                }
            });
        }, { passive: true });

        // Auto-Next Rotation
        const isCarouselMode = () => {
            return grid.scrollWidth > grid.clientWidth + 15;
        };

        const nextSlide = () => {
            if (isUserInteracting || !isVisibleOnScreen || !isCarouselMode()) return;
            const nextIndex = (currentIndex + 1) % cards.length;
            scrollToCard(nextIndex);
        };

        const startAutoPlay = () => {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = setInterval(nextSlide, autoIntervalMs);
        };

        const pauseAutoPlay = () => {
            isUserInteracting = true;
            if (resumeTimer) clearTimeout(resumeTimer);
        };

        const scheduleResume = (delay = 7000) => {
            if (resumeTimer) clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                isUserInteracting = false;
            }, delay);
        };

        // Pause on touch/swipe/mouse drag
        ['touchstart', 'mousedown', 'pointerdown'].forEach(evt => {
            grid.addEventListener(evt, () => {
                pauseAutoPlay();
            }, { passive: true });
        });

        ['touchend', 'mouseup', 'pointerup', 'touchcancel'].forEach(evt => {
            grid.addEventListener(evt, () => {
                scheduleResume(7000);
            }, { passive: true });
        });

        // IntersectionObserver: Only auto-play when section is visible in viewport
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isVisibleOnScreen = entry.isIntersecting;
                });
            }, { threshold: 0.15 });
            observer.observe(grid);
        } else {
            isVisibleOnScreen = true;
        }

        startAutoPlay();
    };

    setupCarouselSync('.feature-grid', '#features .carousel-anchor', 4500);
    setupCarouselSync('.ai-grid', '.ai-carousel-nav .carousel-anchor', 4500);

    // ── FAQ Mobile Accordion Logic ─────────────────────────────────────
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length) {
        faqItems.forEach(item => {
            const btn = item.querySelector('.faq-question');
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                // Desktop is always fully open in a 2-column grid; only toggle on mobile
                if (window.innerWidth > 768) return;
                e.preventDefault();

                const isCurrentlyOpen = item.classList.contains('open');
                // Close other items on mobile by removing 'open' (NEVER touch 'active' which belongs to .reveal-up)
                faqItems.forEach(other => {
                    other.classList.remove('open');
                    const otherBtn = other.querySelector('.faq-question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                });
                if (!isCurrentlyOpen) {
                    item.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    // ── Proof Tab Switcher (Certificate vs Facebook Post) ───────────────
    const proofTabs = document.querySelectorAll('.proof-tab-btn');
    const proofPanes = document.querySelectorAll('.proof-pane');
    if (proofTabs.length && proofPanes.length) {
        proofTabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                proofTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                proofPanes.forEach(pane => pane.classList.remove('active'));

                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.classList.add('active');
            });
        });
    }

    // ── Floating WhatsApp Bot Assistant & Scroll Nudge Controller ──────
    const waFloatingWidget = document.getElementById('waFloatingWidget');
    const waChatPrompt = document.getElementById('waChatPrompt');
    const waPromptClose = document.getElementById('waPromptClose');
    const waFloatBtn = document.getElementById('waFloatBtn');

    if (waFloatingWidget && waChatPrompt) {
        const waDirectBtn = document.getElementById('waDirectBtn');

        // Personalize WhatsApp link prefill with acquisition source (e.g. from TikTok, from Instagram)
        if (zfAttribution && zfAttribution.utm_source && zfAttribution.utm_source !== 'direct') {
            const rawSource = zfAttribution.utm_source;
            const sourceDisplay = rawSource.charAt(0).toUpperCase() + rawSource.slice(1);
            const defaultMsg = 'Hey, I want to learn more about ZikFash';
            const attributedMsg = `${defaultMsg} (from ${sourceDisplay})`;
            const newWaHref = `https://wa.me/2349119320371?text=${encodeURIComponent(attributedMsg)}`;

            if (waDirectBtn) waDirectBtn.href = newWaHref;
            if (waFloatBtn) waFloatBtn.href = newWaHref;
        }

        // Track WhatsApp CTA click conversions in GA4
        const trackWaLead = () => {
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'whatsapp_lead_click', {
                    traffic_source: zfAttribution ? zfAttribution.utm_source : 'direct',
                    traffic_medium: zfAttribution ? zfAttribution.utm_medium : 'none',
                    traffic_campaign: zfAttribution ? zfAttribution.utm_campaign : 'none'
                });
            }
        };
        if (waDirectBtn) waDirectBtn.addEventListener('click', trackWaLead);
        if (waFloatBtn) waFloatBtn.addEventListener('click', trackWaLead);

        let hasDisturbed = false;
        let isPromptManuallyClosed = false;
        let cumulativeScrollDistance = 0;
        let lastScrollY = window.scrollY || 0;
        let disturbTimer = null;

        const isUserSignedUp = () => {
            try {
                return sessionStorage.getItem('zf_signed_up') === 'true';
            } catch (e) {
                return false;
            }
        };

        const triggerNudge = () => {
            if (isUserSignedUp() || isPromptManuallyClosed || waChatPrompt.classList.contains('active')) return;

            waChatPrompt.classList.add('active');
            waChatPrompt.setAttribute('aria-hidden', 'false');

            // Trigger eye-catching disturbance wobble on both widget and card
            waFloatingWidget.classList.add('disturb');
            waChatPrompt.classList.add('disturb');
            setTimeout(() => {
                waFloatingWidget.classList.remove('disturb');
                waChatPrompt.classList.remove('disturb');
            }, 800);

            hasDisturbed = true;
        };

        // Dismiss button handler
        if (waPromptClose) {
            waPromptClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                waChatPrompt.classList.remove('active');
                waChatPrompt.setAttribute('aria-hidden', 'true');
                isPromptManuallyClosed = true;
                cumulativeScrollDistance = 0;
            });
        }

        // Toggle prompt card if clicking on the floating button when card is closed
        if (waFloatBtn) {
            waFloatBtn.addEventListener('click', (e) => {
                // If closed, open it and stop default navigate so visitor reads the message first on desktop/mobile
                if (!waChatPrompt.classList.contains('active')) {
                    e.preventDefault();
                    isPromptManuallyClosed = false;
                    triggerNudge();
                }
            });
        }

        // Trigger 1: Inactivity timer - browsing for 16 seconds without signing up
        disturbTimer = setTimeout(() => {
            if (!hasDisturbed && !isUserSignedUp()) {
                triggerNudge();
            }
        }, 16000);

        // Trigger 2: Excessive scrolling - scrolled past 850px (deep into features) or 2200px cumulative scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            const currentY = window.scrollY || 0;
            const scrollDelta = Math.abs(currentY - lastScrollY);
            cumulativeScrollDistance += scrollDelta;
            lastScrollY = currentY;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (!isUserSignedUp()) {
                        // Deep scroll past hero or cumulative exploration
                        if (!hasDisturbed && (currentY > 850 || cumulativeScrollDistance > 2200)) {
                            triggerNudge();
                        } else if (isPromptManuallyClosed && cumulativeScrollDistance > 4500) {
                            // If dismissed but user continues scrolling heavily without converting,
                            // give a gentle shake on the floating button icon
                            waFloatingWidget.classList.add('disturb');
                            setTimeout(() => {
                                waFloatingWidget.classList.remove('disturb');
                            }, 800);
                            cumulativeScrollDistance = 0;
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

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
