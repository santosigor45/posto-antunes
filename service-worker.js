const CACHE_NAME = "static_cache";

const STATIC_ASSETS = [
    '/',
    '/home',
    '/abastecimentos',
    '/entrega_combustivel',
    'static/style.css',
    'static/main.js',
    'static/images/bomba.png',
    'static/images/caminhao.png',
    'static/images/logo_text.png',
    'static/icons/user.svg',
    'static/manifest.json'
];

function checkServerAvailability() {
    return fetch('/ping')
        .then(response => response.ok ? true : false)
        .catch(() => false);
}

// Função para pré-carregar ativos estáticos no cache
async function preCache() {
    const cache = await caches.open(CACHE_NAME);

    // Verificar se os recursos já estão no cache antes de tentar adicioná-los
    const cachedRequests = await cache.keys();
    const newRequests = STATIC_ASSETS.map(request => {
        return new Request(request);
    }).filter(request => !cachedRequests.some(cachedRequest => cachedRequest.url === request.url));

    if (newRequests.length > 0) {
        return cache.addAll(newRequests);
    }
}

// Evento de instalação do service worker
self.addEventListener('install', event => {
    console.log("[SW] installed");
    self.skipWaiting();
    event.waitUntil(preCache());
});

// Função para limpar caches antigos
async function cleanupCache() {
    const keys = await caches.keys();
    const keysToDelete = keys.map(key => {
        if (key !== CACHE_NAME) {
            return caches.delete(key);
        }
    });

    return Promise.all(keysToDelete);
}

// Evento de ativação do service worker
self.addEventListener('activate', event => {
    console.log("[SW] activated");
    event.waitUntil(cleanupCache());
});

function normalizeUrl(url) {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
}

async function fetchAssets(event) {
    const cache = await caches.open(CACHE_NAME);
    const request = event.request;

    const exactRoutes = [
        '/admin',
        '/logout/',
        '/ultimos_lancamentos'
    ].map(route => normalizeUrl(location.origin + route));
    const requestUrl = normalizeUrl(request.url);
    const isExactMatch = exactRoutes.includes(requestUrl);

    if (isExactMatch) {
        const serverAvailable = await checkServerAvailability();
        if (!serverAvailable) {
            const cachedHome = await cache.match('/');
            if (cachedHome) {
                return cachedHome;
            }
        } else {
            return fetch(request)
        }
    }

    if (request.url.includes('/processar_formulario') || request.url.includes('/admin')) {
        if (request.url.includes('/admin')) {
            return fetch(request);
        }
        return fetch(request);
    }

    if (request.method === 'GET' && (request.url.startsWith('http') || request.url.startsWith('https'))) {
        try {
            const response = await fetch(request);

            if (response && response.ok) {
                if (response.redirected) {
                    const redirectedResponse = await fetch(response.url);
                    return redirectedResponse;
                }

                const clonedResponse = response.clone();
                cache.put(request, clonedResponse);
            }

            return response;
        } catch (err) {
            console.error('Fetch failed:', err);

            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            return new Response(null, { status: 404, statusText: 'Not Found' });
        }
    } else {
        return new Response(null, { status: 404, statusText: 'Not Found' });
    }
}

// Evento de busca do service worker
self.addEventListener('fetch', event => {
    event.respondWith(fetchAssets(event));
});