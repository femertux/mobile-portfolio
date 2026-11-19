'use strict';

const detailState = document.getElementById('projectState');
const detailContent = document.getElementById('detailContent');
const detailRetry = document.getElementById('detailRetry');
const mainContent = document.getElementById('main');
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrevious = document.getElementById('lightboxPrevious');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxFrame = document.getElementById('lightboxImageFrame');
const lightboxImageState = document.getElementById('lightboxImageState');
let detailLoading = false;
let activeGallery = [];
let activeIndex = 0;
let lastGalleryTrigger = null;
let lightboxRequest = 0;

// Paths are always relative to this template, including a GitHub Pages subdirectory.
function projectAssetURL(id, value) {
    if (!validProjectId(id) || typeof value !== 'string' || !value ||
        !/^[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|avif|gif)$/i.test(value) ||
        value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..')) return null;
    const base = new URL(`./assets/projects/${id}/`, window.location.href);
    const asset = new URL(value, base);
    return asset.origin === base.origin && asset.pathname.startsWith(base.pathname) ? asset.href : null;
}

function paragraphs(value) {
    if (typeof value === 'string') return value.trim() ? value.split(/\n\s*\n/).map(text => text.trim()) : [];
    return strings(value);
}

function validateProjectData(data, id) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.id !== id ||
        typeof data.name !== 'string' || !data.name.trim()) throw new Error('El JSON de detalle requiere id coincidente y name no vacío.');
    for (const key of ['description', 'participation']) {
        if (data[key] !== undefined && typeof data[key] !== 'string' &&
            !(Array.isArray(data[key]) && data[key].every(value => typeof value === 'string'))) throw new Error(`${key} debe ser texto o una lista de textos.`);
    }
    for (const key of ['platforms', 'features', 'technologies']) {
        if (data[key] !== undefined && !(Array.isArray(data[key]) && data[key].every(value => typeof value === 'string'))) throw new Error(`${key} debe ser una lista de textos.`);
    }
    if (data.stores !== undefined && !Array.isArray(data.stores)) throw new Error('stores debe ser una lista.');
    if (data.galleries !== undefined) {
        if (!data.galleries || typeof data.galleries !== 'object' || Array.isArray(data.galleries)) throw new Error('galleries debe ser un objeto.');
        for (const key of ['mobile', 'tv']) {
            if (data.galleries[key] !== undefined && !Array.isArray(data.galleries[key])) throw new Error(`galleries.${key} debe ser una lista.`);
        }
    }
    return data;
}

async function readProjectJSON(url, signal) {
    const response = await fetch(url, { signal, cache: 'no-cache' });
    if (!response.ok) {
        const error = new Error(`HTTP ${response.status} al cargar ${url}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function showDetailState(name, message, retry = false) {
    detailContent.hidden = true;
    detailState.hidden = false;
    setText('stateTitle', name || 'Detalle del proyecto');
    setText('stateMessage', message);
    detailRetry.hidden = !retry;
    document.title = `${name || 'Detalle de proyecto'} | Julio García Carballo`;
}

function section(className, title) {
    const card = el('section', `card ${className}`);
    const heading = el('h2', 'section-title', title);
    heading.id = `${className}-title`;
    card.setAttribute('aria-labelledby', heading.id);
    card.append(heading);
    return card;
}

function textCard(className, title, values) {
    const text = paragraphs(values);
    if (!text.length) return null;
    const card = section(className, title);
    const content = el('div', 'detail-description');
    content.append(...text.map(value => el('p', '', value)));
    card.append(content);
    return card;
}

function storeURL(store) {
    const value = externalURL(store.url);
    if (!value) return null;
    const url = new URL(value);
    if (url.username || url.password || url.port) return null;
    if (store.type === 'google-play' && url.hostname === 'play.google.com' && ['/store/apps/details', '/store/apps/developer'].includes(url.pathname) && url.searchParams.get('id')) return url.href;
    if (store.type === 'app-store' && url.hostname === 'apps.apple.com' && /\/app\/(?:[^/]+\/)?id\d+\/?$/.test(url.pathname)) return url.href;
    return null;
}

function storeIcon(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (type === 'google-play') {
        // Four-color Google Play triangle, contained in the store button.
        for (const [d, fill] of [
            ['M3 2.5 13 12 3 21.5Z', '#4285F4'],
            ['m3 2.5 13 7-3 2.5Z', '#34A853'],
            ['m13 12 3 2.5-13 7Z', '#EA4335'],
            ['m13 12 3-2.5 5 2.5-5 2.5Z', '#FBBC04']
        ]) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d); path.setAttribute('fill', fill); svg.append(path);
        }
    } else {
        // App Store's recognizable three-stroke A, without external requests.
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2.2');
        svg.setAttribute('stroke-linecap', 'round');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'm8 4 10 17M16 4 6 21M3 16h18');
        svg.append(path);
    }
    return svg;
}

function renderProjectHero(data) {
    const hero = el('section', 'card detail-hero');
    hero.setAttribute('aria-labelledby', 'projectTitle');
    const src = projectAssetURL(data.id, data.image);
    if (src) {
        const logo = el('div', 'detail-logo media-frame');
        const placeholder = el('span', 'portrait-placeholder', data.name.slice(0, 2));
        placeholder.setAttribute('aria-hidden', 'true');
        logo.append(placeholder);
        const image = el('img'); image.alt = `Icono de ${data.name}`;
        image.width = 108; image.height = 108;
        logo.append(image); prepareImage(image); image.src = src;
        hero.append(logo);
    }
    const heading = el('div', 'detail-heading');
    const title = el('h1', '', data.name); title.id = 'projectTitle';
    heading.append(el('p', 'eyebrow', 'Proyecto seleccionado'), title);
    const platforms = strings(data.platforms);
    if (platforms.length) {
        const list = el('div', 'detail-platforms');
        list.append(...chips(platforms)); heading.append(list);
    }
    const stores = records(data.stores).map(store => {
        const url = storeURL(store);
        if (!url) { console.warn('Enlace de tienda omitido por formato no válido:', store); return null; }
        const label = typeof store.label === 'string' && store.label.trim() ? store.label : (store.type === 'google-play' ? 'Google Play' : 'App Store');
        const link = el('a', 'store-link');
        link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${data.name} en ${label} (abre en otra pestaña)`);
        link.append(storeIcon(store.type), el('span', '', label));
        return link;
    }).filter(Boolean);
    if (stores.length) { const list = el('div', 'store-links'); list.append(...stores); heading.append(list); }
    hero.append(heading);
    return hero;
}

function galleryItems(id, items) {
    return records(items).map((item, index) => {
        const src = projectAssetURL(id, item.src);
        if (!src) { console.warn('Ruta de captura omitida:', item.src); return null; }
        return { src, alt: typeof item.alt === 'string' && item.alt.trim() ? item.alt : `Captura ${index + 1}`, width: item.width, height: item.height };
    }).filter(Boolean);
}

function renderGallery(data, kind, title) {
    const items = galleryItems(data.id, data.galleries?.[kind]);
    if (!items.length) return null;
    const card = section(`${kind}-gallery-card`, title);
    card.append(el('p', 'gallery-hint', 'Selecciona una captura para verla ampliada.'));
    const gallery = el('div', `screenshot-gallery ${kind}-gallery`);
    gallery.setAttribute('role', 'group');
    gallery.setAttribute('aria-label', title);
    items.forEach((item, index) => {
        const figure = el('figure', 'screenshot-item');
        const button = el('button', 'screenshot-button'); button.type = 'button';
        button.setAttribute('aria-label', `Ampliar ${item.alt}`);
        button.setAttribute('aria-haspopup', 'dialog');
        const placeholder = el('span', 'screenshot-placeholder', 'Cargando captura…');
        placeholder.setAttribute('aria-hidden', 'true');
        const image = el('img'); image.alt = item.alt; image.loading = 'lazy'; image.decoding = 'async';
        if (Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0) { image.width = item.width; image.height = item.height; }
        image.addEventListener('load', () => button.classList.add('is-loaded'));
        image.addEventListener('error', () => {
            image.hidden = true; button.classList.add('is-missing');
            placeholder.textContent = 'Esta captura no está disponible';
            console.warn('No se pudo cargar la captura:', item.src);
        });
        button.append(placeholder, image); image.src = item.src;
        button.addEventListener('click', () => openLightbox(items, index, title, button));
        figure.append(button); gallery.append(figure);
    });
    card.append(gallery);
    return card;
}

function renderProjectDetail(data) {
    const description = textCard('description-card', 'Acerca del proyecto', data.description);
    detailContent.replaceChildren(renderProjectHero(data));
    if (description) detailContent.append(description);
    const features = strings(data.features);
    if (features.length) {
        const card = section('features-card', 'Funcionalidades implementadas');
        const list = el('ul', 'feature-list'); list.append(...features.map(value => el('li', '', value)));
        card.append(list); detailContent.append(card);
    }
    for (const [kind, title] of [['mobile', 'Capturas móviles'], ['tv', 'Capturas de TV']]) {
        const gallery = renderGallery(data, kind, title);
        if (gallery) detailContent.append(gallery);
    }
    const technologies = strings(data.technologies);
    if (technologies.length) {
        const card = section('technologies-card', 'Tecnologías');
        const list = el('div', 'detail-technologies');
        list.append(...chips(technologies));
        card.append(list); detailContent.append(card);
    }
    document.title = `${data.name} | Julio García Carballo`;
    const summary = paragraphs(data.description)[0];
    if (summary) document.querySelector('meta[name="description"]').setAttribute('content', summary);
    detailState.hidden = true; detailContent.hidden = false;
}

function showLightboxImage() {
    const item = activeGallery[activeIndex];
    const request = ++lightboxRequest;
    const image = el('img'); image.alt = item.alt; image.hidden = true;
    lightboxImageState.hidden = false; lightboxImageState.textContent = 'Cargando captura…';
    lightboxFrame.replaceChildren(lightboxImageState, image);
    image.addEventListener('load', () => { if (request === lightboxRequest) { image.hidden = false; lightboxImageState.hidden = true; } });
    image.addEventListener('error', () => {
        if (request === lightboxRequest) lightboxImageState.textContent = 'Esta captura no está disponible. Puedes continuar con las demás.';
        console.warn('No se pudo ampliar la captura:', item.src);
    });
    image.src = item.src;
    setText('lightboxCounter', `${activeIndex + 1} de ${activeGallery.length}`);
    lightboxPrevious.disabled = lightboxNext.disabled = activeGallery.length < 2;
}

function openLightbox(items, index, title, trigger) {
    activeGallery = items; activeIndex = index; lastGalleryTrigger = trigger;
    setText('lightboxTitle', title);
    showLightboxImage();
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add('lightbox-open');
    lightboxClose.focus();
}

function moveLightbox(direction) {
    if (!activeGallery.length) return;
    activeIndex = (activeIndex + direction + activeGallery.length) % activeGallery.length;
    showLightboxImage();
}

lightboxClose.addEventListener('click', () => lightbox.close());
lightboxPrevious.addEventListener('click', () => moveLightbox(-1));
lightboxNext.addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    ++lightboxRequest;
    lastGalleryTrigger?.focus({ preventScroll: true });
});
lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const rect = lightbox.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
});
lightbox.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); lightbox.close(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
    if (event.key === 'Tab') {
        const focusable = [...lightbox.querySelectorAll('button:not(:disabled)')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
});

async function loadProjectDetail() {
    if (detailLoading) return;
    detailLoading = true; detailRetry.disabled = true; mainContent.setAttribute('aria-busy', 'true');
    const params = new URLSearchParams(window.location.search);
    const id = projectFolderId(params.get('project'));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let name = '';
    let readingDetail = false;
    try {
        if (params.getAll('project').length !== 1 || !validProjectId(id)) {
            showDetailState('', 'El identificador del proyecto no es válido. Vuelve al portafolio para seleccionar un proyecto.');
            return;
        }
        const portfolio = await readProjectJSON('./data.json?v=20261119-2', controller.signal);
        if (!portfolio || !Array.isArray(portfolio.projects)) throw new Error('El índice principal no contiene una lista de proyectos válida.');
        const registered = portfolio.projects.find(project => project && projectFolderId(project.id) === id);
        if (!registered) { showDetailState('', 'El detalle de este proyecto todavía no está disponible'); return; }
        name = typeof registered.name === 'string' ? registered.name : '';
        readingDetail = true;
        const data = await readProjectJSON(`./assets/projects/${id}/data.json`, controller.signal);
        validateProjectData(data, id);
        renderProjectDetail(data);
    } catch (error) {
        if (readingDetail && error.status === 404) showDetailState(name, 'El detalle de este proyecto todavía no está disponible');
        else {
            console.error('No se pudo cargar el detalle del proyecto:', { project: id, error });
            showDetailState(name, 'No pudimos cargar la información de este proyecto. Puedes volver a intentarlo o regresar a proyectos.', true);
        }
    } finally {
        clearTimeout(timeout); detailLoading = false; detailRetry.disabled = false; mainContent.setAttribute('aria-busy', 'false');
    }
}

detailRetry.addEventListener('click', loadProjectDetail);
loadProjectDetail();
