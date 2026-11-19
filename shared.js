'use strict';

const themeButton = document.getElementById('themeButton');

function updateThemeButton() {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', `Activar modo ${dark ? 'claro' : 'oscuro'}`);
    themeButton.title = `Activar modo ${dark ? 'claro' : 'oscuro'}`;
}

function initializeTheme() {
    updateThemeButton();
    themeButton.addEventListener('click', () => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme;
        try { localStorage.setItem('portfolio-theme', theme); } catch { /* Theme still works without storage. */ }
        updateThemeButton();
    });
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', event => {
        let saved;
        try { saved = localStorage.getItem('portfolio-theme'); } catch {}
        if (saved !== 'dark' && saved !== 'light') {
            document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
            updateThemeButton();
        }
    });
    window.addEventListener('storage', event => {
        if (event.key === 'portfolio-theme' && ['light', 'dark'].includes(event.newValue)) {
            document.documentElement.dataset.theme = event.newValue;
            updateThemeButton();
        }
    });
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function strings(value) {
    return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : [];
}

function records(value) {
    return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
}

function setText(id, value) {
    if (typeof value === 'string' && value.trim()) document.getElementById(id).textContent = value;
}

function chips(values, className = 'chip') {
    return strings(values).map(value => el('span', className, value));
}

// A failed image stays invisible; the decorative placeholder remains visible.
// The original src is retained, so adding the file works on the next page load.

function prepareImage(image) {
    const frame = image.closest('.media-frame');
    image.addEventListener('load', () => frame.classList.add('is-loaded'));
    image.addEventListener('error', () => frame.classList.remove('is-loaded'));
    if (image.complete && image.naturalWidth > 0) frame.classList.add('is-loaded');
}

// SVGs are served remotely by Iconify, without local SVG assets or an icon JS library.

function safeIconURL(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'api.iconify.design' &&
            /^\/(simple-icons|lucide)\/[a-z0-9-]+\.svg$/.test(url.pathname) &&
            !url.username && !url.password && !url.port ? url.href : '';
    } catch { return ''; }
}

function remoteIcon(icon) {
    const frame = el('span', 'remote-icon');
    frame.setAttribute('aria-hidden', 'true');
    const fallback = el('span', 'icon-fallback');
    frame.append(fallback);
    const src = safeIconURL(icon?.src);
    if (!src) return frame;
    const image = el('img');
    image.alt = '';
    image.width = 24;
    image.height = 24;
    image.decoding = 'async';
    const fail = () => {
        frame.classList.remove('is-loaded');
        image.hidden = true;
        clearTimeout(timeout);
    };
    const timeout = setTimeout(fail, 10000);
    image.addEventListener('load', () => {
        clearTimeout(timeout);
        image.hidden = false;
        frame.classList.add('is-loaded');
    });
    image.addEventListener('error', fail);
    frame.append(image);
    image.src = src;
    return frame;
}

function technologyToken(name, icons) {
    const icon = icons && typeof icons === 'object' ? icons[name] : null;
    const token = el('span', `technology-token${icon?.kind === 'conceptual' ? ' conceptual-token' : ''}`);
    const description = icon?.kind === 'conceptual' ? `${name} — icono conceptual: ${icon.meaning || 'tecnología'}` : name;
    token.setAttribute('role', 'img');
    token.setAttribute('aria-label', description);
    token.setAttribute('tabindex', '0');
    token.dataset.tooltip = description;
    token.append(remoteIcon(icon));
    // Keep the tooltip inside its card even when the last icon wraps onto a new row.
    const alignTooltip = () => {
        const boundary = token.closest('.project-item');
        if (!boundary) return;
        const card = boundary.getBoundingClientRect();
        const bounds = token.getBoundingClientRect();
        const center = bounds.left + bounds.width / 2;
        const inset = Math.min(102, card.width / 2);
        const adjusted = Math.max(card.left + inset, Math.min(center, card.right - inset));
        token.style.setProperty('--tooltip-offset', `${adjusted - center}px`);
    };
    token.addEventListener('mouseenter', alignTooltip);
    token.addEventListener('focus', alignTooltip);
    return token;
}

function sectionIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'section-icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', name === 'certificate' ? '#icon-certificate' : '#icon-education');
    svg.append(use);
    return svg;
}

function safeLocalImage(value) {
    return typeof value === 'string' && /^\.\/assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|avif|svg)$/i.test(value) && !value.includes('..') ? value : '';
}

function externalURL(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : null;
    } catch { return null; }
}

function validProjectId(value) {
    return typeof value === 'string' && value.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

// Keep stable Home IDs compatible with the existing asset folder names.
function projectFolderId(id) {
    if (!validProjectId(id)) return null;
    if (id === 'bi-banking') return 'bibanking';
    if (id === 'vive-health') return 'vivehealth';
    return id;
}

function projectDetailURL(id) {
    return validProjectId(id) ? `./project.html?project=${encodeURIComponent(projectFolderId(id))}` : null;
}

initializeTheme();
