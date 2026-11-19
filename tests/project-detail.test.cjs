// Run with: node --test tests/project-detail.test.cjs
// Exercises the real routing/schema helpers without browser or package dependencies.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const portfolio = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const detail = JSON.parse(fs.readFileSync(path.join(root, 'assets/projects/michv/data.json'), 'utf8'));
const dummy = () => ({ addEventListener() {}, setAttribute() {}, dataset: {}, classList: { add() {}, remove() {} } });
const elements = new Map();
const getElement = id => { if (!elements.has(id)) elements.set(id, dummy()); return elements.get(id); };
const context = vm.createContext({
    URL, URLSearchParams, console, AbortController, setTimeout, clearTimeout,
    document: { getElementById: getElement, documentElement: { dataset: { theme: 'light' } } },
    window: { location: { href: 'https://example.com/mobile-portfolio/project.html?project=michv' }, matchMedia: () => ({ addEventListener() {} }), addEventListener() {} },
    localStorage: { getItem: () => null }
});
vm.runInContext(fs.readFileSync(path.join(root, 'shared.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'project.js'), 'utf8').replace(/\nloadProjectDetail\(\);\s*$/, '\n'), context);

function call(name, ...args) {
    context.args = args;
    return vm.runInContext(`${name}(...args)`, context);
}

test('project identifiers cannot become arbitrary paths', () => {
    for (const project of portfolio.projects) assert.equal(call('validProjectId', project.id), true);
    for (const id of ['', '..', '../michv', 'michv/../data', 'michv\\data', '%2e%2e', 'MICHV', 'https://example.com', 'a'.repeat(65), null]) {
        assert.equal(call('validProjectId', id), false, String(id));
        assert.equal(call('projectDetailURL', id), null);
    }
    assert.equal(call('projectDetailURL', 'michv'), './project.html?project=michv');
});

test('asset resolution stays inside the selected project and GitHub Pages subdirectory', () => {
    assert.equal(call('projectAssetURL', 'michv', 'mobile/1.png'), 'https://example.com/mobile-portfolio/assets/projects/michv/mobile/1.png');
    for (const asset of ['../other/1.png', 'mobile/../../1.png', '/1.png', '//example.com/1.png', 'https://example.com/1.png', 'mobile/%2e%2e/1.png', 'mobile\\1.png', 'data.json', 'mobile/1.png?x=1', './mobile/1.png']) {
        assert.equal(call('projectAssetURL', 'michv', asset), null, asset);
    }
});

test('MiCHV schema and resources are valid, and optional sections can be absent', () => {
    assert.equal(call('validateProjectData', detail, 'michv'), detail);
    assert.equal(call('validateProjectData', { id: 'michv', name: 'MiCHV' }, 'michv').name, 'MiCHV');
    for (const malformed of [{}, { id: 'other', name: 'MiCHV' }, { id: 'michv', name: '' }, { id: 'michv', name: 'MiCHV', galleries: null }, { id: 'michv', name: 'MiCHV', features: {} }]) {
        assert.throws(() => call('validateProjectData', malformed, 'michv'));
    }
    for (const item of [detail.image, ...Object.values(detail.galleries).flat().map(image => image.src)]) {
        assert(call('projectAssetURL', detail.id, item));
        assert(fs.existsSync(path.join(root, 'assets/projects', detail.id, item)), item);
    }
});

test('store URLs are HTTPS links to the declared official store', () => {
    for (const store of detail.stores) assert.equal(call('storeURL', store), store.url);
    for (const url of ['javascript:alert(1)', 'http://play.google.com/store/apps/details?id=x', 'https://play.google.com.evil.example/store/apps/details?id=x', 'https://user:password@play.google.com/store/apps/details?id=x']) {
        assert.equal(call('storeURL', { type: 'google-play', url }), null, url);
    }
});

test('a card image still navigates when an ancestor outside the card has tabindex', () => {
    class Node {
        constructor() { this.children = []; this.events = {}; this.classList = { add() {} }; }
        append(...nodes) { this.children.push(...nodes); }
        replaceChildren(...nodes) { this.children = nodes; }
        setAttribute() {}
        addEventListener(event, listener) { this.events[event] = listener; }
        contains(node) { return node === this || this.children.some(child => child.contains?.(node)); }
    }
    context.document.createElement = () => new Node();
    elements.set('projectsContainer', new Node());
    const home = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
    vm.runInContext(home.slice(home.indexOf('function renderProjects('), home.indexOf('function renderEducation(')), context);
    const navigations = [];
    context.window.location.assign = value => navigations.push(value);
    context.window.getSelection = () => ({ toString: () => '' });
    call('renderProjects', [{ id: 'michv', name: 'MiCHV', technologies: [], links: [] }], {});
    const article = elements.get('projectsContainer').children[0];
    // This is the Home's <main tabindex="-1">, not a nested interactive element.
    const outsideMain = new Node();
    article.events.click({ button: 0, target: { closest: () => outsideMain } });
    assert.deepEqual(navigations, ['./project.html?project=michv']);
    const titleLink = article.children[1].children[0].children[0];
    article.events.click({ button: 0, target: { closest: () => titleLink } });
    assert.equal(navigations.length, 1, 'native nested links keep their own navigation');
});

 test('historical project IDs resolve to asset folders without accepting arbitrary paths', () => {
    assert.equal(call('projectDetailURL', 'bi-banking'), './project.html?project=bibanking');
    assert.equal(call('projectDetailURL', 'vive-health'), './project.html?project=vivehealth');
    assert.equal(call('projectFolderId', 'bibanking'), 'bibanking');
    assert.equal(call('projectFolderId', 'constructor'), 'constructor');
    assert.equal(call('projectFolderId', '../bibanking'), null);
});

test('completed projects have valid schemas and existing local resources', () => {
    for (const id of ['aventon', 'vivehealth', 'bibanking']) {
        const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/projects', id, 'data.json'), 'utf8'));
        call('validateProjectData', data, id);
        assert(!data.platforms.some(p => /TV|tvOS/.test(p)));
        assert(!data.galleries.tv?.length);
        for (const asset of [data.image, ...data.galleries.mobile.map(i => i.src)]) {
            assert(call('projectAssetURL', id, asset));
            assert(fs.existsSync(path.join(root, 'assets/projects', id, asset)));
        }
        for (const store of data.stores) assert.equal(call('storeURL', store), store.url);
        if (id === 'bibanking') assert(!data.technologies.includes('UserNotifications'));
    }
});
