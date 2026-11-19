'use strict';

const retryButton = document.getElementById('retryButton');
let loading = false;
let initialAnchorPending = true;

function renderPlatforms(platforms, multiplatform) {
    const nodes = records(platforms).filter(platform => typeof platform.name === 'string').map(platform => {
        const item = el('div', 'platform-item');
        item.append(remoteIcon(platform.icon), el('span', 'platform-name', platform.name));
        return item;
    });
    document.getElementById('platformsContainer').replaceChildren(...nodes);
    const container = document.getElementById('multiplatformContainer');
    container.replaceChildren();
    if (multiplatform && typeof multiplatform.name === 'string') {
        container.append(remoteIcon(multiplatform.icon), el('span', '', multiplatform.name));
    }
}

function renderToolGroups(groups) {
    const nodes = records(groups).map(group => {
        const item = el('div', `tool-group${group.kind === 'ai' ? ' ai-group' : ''}`);
        const list = el('div', 'chips');
        list.append(...chips(group.items));
        item.append(el('h3', '', group.title), list);
        return item;
    });
    document.getElementById('toolsContainer').replaceChildren(...nodes);
}

// Extend the image's own edge colors behind the uncropped foreground.
// All project covers use local resources; sampling failures retain the neutral fallback.
function setProjectCoverBackground(image, media) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0, 32, 32);
        const pixels = context.getImageData(0, 0, 32, 32).data;
        const edgeColor = (firstRow, lastRow) => {
            const total = [0, 0, 0];
            let count = 0;
            for (let y = firstRow; y < lastRow; y++) {
                for (const x of [1, 2, 3, 28, 29, 30]) {
                    const offset = (y * 32 + x) * 4;
                    if (pixels[offset + 3] < 230) continue;
                    for (let channel = 0; channel < 3; channel++) total[channel] += pixels[offset + channel];
                    count++;
                }
            }
            return count ? `rgb(${total.map(value => Math.round(value / count)).join(', ')})` : null;
        };
        const top = edgeColor(4, 10);
        const bottom = edgeColor(22, 28);
        if (top && bottom) {
            media.style.setProperty('--cover-top', top);
            media.style.setProperty('--cover-bottom', bottom);
        }
    } catch { /* Image remains visible even if its pixels cannot be sampled. */ }
}

function renderProjects(projects, icons) {
    const nodes = records(projects).map(project => {
        const article = el('article', 'project-item');
        const media = el('div', 'project-media media-frame');
        const placeholder = el('div', 'project-placeholder');
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.append(el('span', 'project-monogram', project.monogram || project.name));
        media.append(placeholder);
        const src = safeLocalImage(project.image);
        if (src) {
            const image = el('img', 'project-image');
            image.alt = `Vista de ${project.name}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            image.addEventListener('load', () => setProjectCoverBackground(image, media));
            media.append(image);
            prepareImage(image);
            image.src = src;
        }
        const content = el('div', 'project-content');
        const technologies = el('div', 'project-technologies');
        technologies.append(...strings(project.technologies).map(name => technologyToken(name, icons)));
        const heading = el('h3');
        const detailURL = projectDetailURL(project.id);
        if (detailURL) {
            const link = el('a', 'project-detail-link', project.name);
            link.href = detailURL;
            link.setAttribute('aria-label', `Ver detalle de ${project.name}`);
            heading.append(link);
            article.classList.add('has-detail');
            article.addEventListener('click', event => {
                const interactive = event.target.closest('a, button, [tabindex]');
                if (event.defaultPrevented || event.button !== 0 ||
                    (interactive && article.contains(interactive)) || window.getSelection()?.toString()) return;
                if (event.ctrlKey || event.metaKey) window.open(detailURL, '_blank', 'noopener,noreferrer');
                else window.location.assign(detailURL);
            });
        } else {
            heading.textContent = project.name;
            console.warn('Proyecto sin identificador válido:', project.name);
        }
        content.append(heading, el('p', 'project-platforms', project.platforms), el('p', 'project-description', project.description), technologies);
        // Optional links: [{ "label": "App Store", "url": "https://..." }].
        // No invented URLs or inactive buttons are shown.
        const links = records(project.links).map(link => {
            const url = externalURL(link.url);
            if (!url || typeof link.label !== 'string') return null;
            const anchor = el('a', '', link.label);
            anchor.href = url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.setAttribute('aria-label', `${link.label}: ${project.name} (abre en otra pestaña)`);
            return anchor;
        }).filter(Boolean);
        if (links.length) {
            const list = el('div', 'project-links');
            list.append(...links);
            content.append(list);
        }
        article.append(media, content);
        return article;
    });
    document.getElementById('projectsContainer').replaceChildren(...nodes);
}

function renderEducation(education, languages) {
    const nodes = records(education).map(item => {
        const article = el('article', 'education-item');
        const content = el('div');
        content.append(el('h3', '', item.title), el('p', '', item.institution), el('span', 'education-period', item.period));
        article.append(sectionIcon(item.icon), content);
        return article;
    });
    document.getElementById('educationContainer').replaceChildren(...nodes);
    document.getElementById('languagesContainer').replaceChildren(...chips(languages, ''));
}

async function loadPortfolioData() {
    if (loading) return;
    loading = true;
    retryButton.disabled = true;
    retryButton.textContent = 'Cargando…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch('./data.json?v=20261119-2', { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error(`data.json: HTTP ${response.status}`);
        const data = await response.json();
        if (!data || typeof data !== 'object' || !data.profile || !Array.isArray(data.projects) || !Array.isArray(data.platforms) || !Array.isArray(data.toolGroups)) throw new Error('Estructura de contenido no válida');
        setText('profileName', data.profile.name);
        setText('profileRole', data.profile.role);
        setText('profileDescription', data.profile.description);
        const profileSource = safeLocalImage(data.profile.image);
        if (profileSource) {
            const image = document.querySelector('.profile-image');
            if (image.getAttribute('src') !== profileSource) image.src = profileSource;
        }
        if (typeof data.profile.cv === 'string' && /^\.\/assets\/documents\/[a-zA-Z0-9_-]+\.pdf$/.test(data.profile.cv)) {
            document.querySelector('.cv-link').setAttribute('href', data.profile.cv);
        }
        renderPlatforms(data.platforms, data.multiplatform);
        renderToolGroups(data.toolGroups);
        renderProjects(data.projects, data.technologyIcons);
        renderEducation(data.education, data.languages);
        document.getElementById('dataError').hidden = true;
        // Resolve the return anchor after async cards have their final layout.
        if (initialAnchorPending) {
            initialAnchorPending = false;
            if (['#perfil', '#proyectos', '#contacto'].includes(window.location.hash)) {
                document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
        }
    } catch (error) {
        document.getElementById('dataError').hidden = false;
        console.error('No se pudo cargar el portafolio:', error);
    } finally {
        clearTimeout(timeout);
        loading = false;
        retryButton.disabled = false;
        retryButton.textContent = 'Volver a intentar';
    }
}

// Check on demand: do not offer a broken download when the local PDF is absent.
let checkingCV = false;
let cvAvailable = false;
document.querySelector('.cv-link').addEventListener('click', async event => {
    if (cvAvailable) return;
    event.preventDefault();
    if (checkingCV) return;
    checkingCV = true;
    const link = event.currentTarget;
    link.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(link.getAttribute('href'), { method: 'HEAD', cache: 'no-cache', signal: controller.signal });
        const isPDF = response.headers.get('content-type')?.toLowerCase().includes('application/pdf');
        if (!response.ok || !isPDF) throw new Error('PDF no disponible');
        cvAvailable = true;
        document.getElementById('cvNotice').hidden = true;
        link.click();
    } catch {
        const notice = document.getElementById('cvNotice');
        notice.hidden = false;
        notice.scrollIntoView({ block: 'nearest' });
    } finally {
        clearTimeout(timeout);
        checkingCV = false;
        link.removeAttribute('aria-busy');
    }
});

document.querySelectorAll('.media-frame img').forEach(prepareImage);
retryButton.addEventListener('click', loadPortfolioData);
loadPortfolioData();
