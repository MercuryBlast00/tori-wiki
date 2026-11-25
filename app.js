// app.js
let allCards = [];
const tierNames = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"];

const EFFECT_TYPE_OVERRIDES = {
    "逻各斯": ["叠层", "战斗"],
};

const OTHER_TYPE_MAP = {
    "酒神": ["道具"],
    "机械师": ["招募"],
    "塔露拉": ["叠层"],
    "缪尔赛思": ["道具"],
    "凛御银灰": ["叠层加成"],
    "歌蕾蒂娅": ["招募"],
    "薇薇安娜": ["叠层加成"],
    "铃兰": ["其他"],
    "塞雷娅": ["其他"],
    "Mon3tr": ["叠层加成"],
    "阿米娅": ["叠层"],
    "“暴躁铁皮”（隐藏）": ["战斗"],
    "可露希尔": ["叠层"],
    "温蒂": ["经济"],
    "灵知": ["招募"],
    "白铁": ["道具"],
    "异客": ["道具"],
    "山": ["战斗"],
    "星极": ["经济"],
    "车尔尼": ["道具"],
    "卡涅利安": ["道具"],
    "海沫": ["经济"],
    "耶拉": ["道具"],
    "忍冬": ["经济"],
    "吉星": ["招募"],
    "伊桑": ["招募"],
    "乌有": ["经济"],
    "凯瑟琳": ["道具"],
    "盟约·辅助干员（隐藏）": ["战斗"],
    "至简": ["经济"],
    "奥尔佳": ["道具"],
    "奥斯塔": ["经济"],
    "波登可": ["经济"],
    "承曦格雷伊": ["道具"],
    "真理": ["经济"],
};

function normalizeEffectTypes(card) {
    if (EFFECT_TYPE_OVERRIDES[card.name]) return EFFECT_TYPE_OVERRIDES[card.name];
    if (Array.isArray(card.effect_type)) return card.effect_type;
    if (card.effect_type === "其他") {
        return OTHER_TYPE_MAP[card.name] || ["其他"];
    }
    return [card.effect_type];
}

let banResultMode = 'survive';
let banViewMode = 'detail';







// 读取保存的数据
let userTagsData = JSON.parse(localStorage.getItem('cardUserTags')) || {};

const wikiContainer = document.getElementById('wiki-card-container');
const banContainer = document.getElementById('ban-card-container');

// 页面切换 & 折叠
document.getElementById('tab-wiki').addEventListener('click', () => {
    document.getElementById('tab-wiki').classList.add('active');
    document.getElementById('tab-ban').classList.remove('active');
    document.getElementById('view-wiki').classList.add('active-view');
    document.getElementById('view-ban').classList.remove('active-view');
});
document.getElementById('tab-ban').addEventListener('click', () => {
    document.getElementById('tab-ban').classList.add('active');
    document.getElementById('tab-wiki').classList.remove('active');
    document.getElementById('view-ban').classList.add('active-view');
    document.getElementById('view-wiki').classList.remove('active-view');
});

document.querySelectorAll('.fold-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const body = document.getElementById(e.target.getAttribute('data-target'));
        body.classList.toggle('hidden');
        e.target.innerText = body.classList.contains('hidden') ? '展开' : '收起';
    });
});

// 排序弹窗逻辑 
let currentSortContainerId = null;

window.openSortModal = function(containerId, title) {
    currentSortContainerId = containerId;
    document.getElementById('sort-title').innerText = `排序 - ${title}`;
    const container = document.getElementById(containerId);
    
    // 获取当前 DOM 里的元素
    const items = Array.from(container.querySelectorAll('.checkbox-label')).map(el => ({
        value: el.querySelector('input').value,
        text: el.querySelector('span').innerText
    }));
    
    // 渲染列表
    const listContainer = document.getElementById('sort-list');
    listContainer.innerHTML = '';
    items.forEach((item) => {
        listContainer.innerHTML += `
            <div class="sort-item" data-value="${item.value}">
                <span>${item.text}</span>
                <div>
                    <button onclick="moveUp(this)">上移</button>
                    <button onclick="moveDown(this)">下移</button>
                </div>
            </div>
        `;
    });
    document.getElementById('sort-modal').classList.remove('hidden');
};

window.moveUp = function(btn) {
    const item = btn.closest('.sort-item');
    if (item.previousElementSibling) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
    }
};

window.moveDown = function(btn) {
    const item = btn.closest('.sort-item');
    if (item.nextElementSibling) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
    }
};

document.querySelector('.close-modal-btn').addEventListener('click', () => {
    // 获取新顺序
    const newOrder = Array.from(document.querySelectorAll('#sort-list .sort-item')).map(item => item.getAttribute('data-value'));
    
    // 同步更新
    const container = document.getElementById(currentSortContainerId);
    const elements = Array.from(container.children);
    container.innerHTML = '';
    
    newOrder.forEach(val => {
        const el = elements.find(e => e.querySelector('input').value === val);
        if (el) container.appendChild(el);
    });
    
    // 保存到 localStorage
    localStorage.setItem(`order_${currentSortContainerId}`, JSON.stringify(newOrder));
    
    
    document.getElementById('sort-modal').classList.add('hidden');
});

// 初始化排序（把上次保存的顺序重新应用）
function initSavedSorting(containerId) {
    const container = document.getElementById(containerId);
    const savedOrder = JSON.parse(localStorage.getItem(`order_${containerId}`));
    if (savedOrder && container) {
        const elements = Array.from(container.children);
        container.innerHTML = '';
        
        savedOrder.forEach(val => {
            const el = elements.find(e => e.querySelector('input').value === val);
            if (el) container.appendChild(el);
        });
        
        elements.forEach(el => {
            if (!savedOrder.includes(el.querySelector('input').value)) {
                container.appendChild(el);
            }
        });
    }
}

// 加载数据
async function loadData() {
    for (let i = 1; i <= 6; i++) {
        try {
            const response = await fetch(`pro-tier-${i}.json`);
            const data = await response.json();
            allCards = allCards.concat(data);
        } catch (error) { console.error(`读取第 ${i} 阶失败:`, error); }
    }
    
    allCards.forEach(card => {
    card.userTags = userTagsData[card.name] || [];
    card.effect_types = normalizeEffectTypes(card);
});

    document.querySelector('.header p').innerText = `数据加载完成，共收录 ${allCards.length} 位干员！`;
    
    extractAllOptions();
    initFilters();
    initBanCheckboxes();
    
    updateWikiResult();
    updateBanResult();
}

// 选项渲染 
let allOptions = { tiers: [], mains: [], subs: [], phases: [], types: [], usertags: [] };

function extractAllOptions() {
    let mains = new Set(), subs = new Set(), phases = new Set(), types = new Set(), usertags = new Set();
    allCards.forEach(card => {
        card.main_attrs.forEach(a => mains.add(a));
        card.sub_attrs.forEach(a => subs.add(a));
        const p = Array.isArray(card.phase) ? card.phase : [card.phase];
        p.forEach(v => phases.add(v));
        card.effect_types.forEach(t => types.add(t));
        card.userTags.forEach(t => usertags.add(t));
    });
    allOptions.tiers = tierNames;
    allOptions.mains = Array.from(mains).sort();
    allOptions.subs = Array.from(subs).sort();
    allOptions.phases = Array.from(phases).sort();
    const typeOrder = ["经济", "招募", "道具", "叠层", "战斗", "叠层加成", "其他"];
    allOptions.types = typeOrder.filter(t => types.has(t));
    allOptions.usertags = Array.from(usertags).sort();
}

function buildCheckboxGroup(containerId, options, isBanGroup = false) {
    const container = document.getElementById(containerId);
    const className = isBanGroup ? 'ban-cb' : 'filter-cb';
    container.innerHTML = ''; 
    options.forEach(opt => {
        container.innerHTML += `
            <label class="checkbox-label">
                <input type="checkbox" value="${opt}" class="${className}" data-group="${containerId}">
                <span>${opt}</span>
            </label>`;
    });
    // 渲染完后，立刻恢复用户上次的排序
    initSavedSorting(containerId);
}

function getCheckedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(cb => cb.value);
}

function initFilters() {
    buildCheckboxGroup('filter-tier-group', allOptions.tiers);
    buildCheckboxGroup('filter-main-group', allOptions.mains);
    buildCheckboxGroup('filter-sub-group', allOptions.subs);
    buildCheckboxGroup('filter-phase-group', allOptions.phases);
    buildCheckboxGroup('filter-type-group', allOptions.types);
    buildCheckboxGroup('filter-usertags-group', allOptions.usertags);
    
    buildCheckboxGroup('ban-filter-tier-group', allOptions.tiers);
    buildCheckboxGroup('ban-filter-main-group', allOptions.mains);
    buildCheckboxGroup('ban-filter-sub-group', allOptions.subs);

    document.querySelectorAll('.filter-cb').forEach(cb => cb.addEventListener('change', updateWikiResult));
    document.querySelectorAll('#ban-search-name, #ban-filter-tier-group input, #ban-filter-main-group input, #ban-filter-sub-group input').forEach(el => {
        el.addEventListener('input', updateBanResult);
        el.addEventListener('change', updateBanResult);
    });
}

// 渲染模板 
function createCardHTML(card, isSimple = false) {
    // 简略视图
    if (isSimple) {
        const tagsHTML = card.userTags.map(tag => `<span class="user-tag-simple">${tag}</span>`).join('');
        return `
            <div class="card-simple" data-tier="${card.tier}">
                <div class="simple-left">
                    <span class="name">${card.name}</span>
                    ${tagsHTML ? `<div class="simple-tags">${tagsHTML}</div>` : ''}
                </div>
                <span class="tier">${card.tier}</span>
            </div>
        `;
    }

    // 详细视图
    const allAttrs = [...card.main_attrs, ...card.sub_attrs];
    const attrsHTML = allAttrs.length > 0
    ? `<div class="card-attrs">${allAttrs.map(a => `<span class="attr-pill">${a}</span>`).join('')}</div>`
    : '';
    const phaseText = Array.isArray(card.phase) ? card.phase.join(' / ') : card.phase;

    const tagsHTML = card.userTags.map(tag => `<span class="user-tag" data-card="${card.name}" data-tag="${tag}">${tag}</span>`).join('');

    return `
        <div class="card" data-tier="${card.tier}">
            <div class="card-title">
                <div class="card-title-left">
                    <span>${card.name}</span>
                    <div class="add-tag-btn" onclick="addTag('${card.name}')">+</div>
                </div>
                <span class="card-tier">${card.tier} 阶</span>
            </div>
            <div class="user-tags-container" id="tags-${card.name}">${tagsHTML}</div>
            <div class="card-meta">${phaseText} | ${card.effect_types.map(t => `<span class="effect-type" data-type="${t}">${t}</span>`).join(' / ')}</div>
           ${attrsHTML}
            <div class="card-effect">
                <div class="effect-row effect-normal"><strong>普通：</strong>${card.effect.normal}</div>
                <div class="effect-row effect-advanced"><strong>精锐：</strong>${card.effect.advanced}</div>
            </div>
        </div>
    `;
}

// 添加/移除标签
window.addTag = function(cardName) {
    const tag = prompt(`给「${cardName}」加个标签：`);
    if (!tag || tag.trim() === '') return;
    const cleanTag = tag.trim();
    const card = allCards.find(c => c.name === cardName);
    if (!card.userTags.includes(cleanTag)) {
        card.userTags.push(cleanTag);
        saveUserTags();
        refreshAllViews();
    }
};

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('user-tag')) {
        const cardName = e.target.getAttribute('data-card');
        const tag = e.target.getAttribute('data-tag');
        if (confirm(`删除「${tag}」标签？`)) {
            const card = allCards.find(c => c.name === cardName);
            card.userTags = card.userTags.filter(t => t !== tag);
            saveUserTags();
            refreshAllViews();
        }
    }
});

function saveUserTags() {
    userTagsData = {};
    allCards.forEach(card => {
        if (card.userTags.length > 0) userTagsData[card.name] = card.userTags;
    });
    localStorage.setItem('cardUserTags', JSON.stringify(userTagsData));
}

function refreshAllViews() {
    extractAllOptions();
    initFilters();
    updateWikiResult();
    updateBanResult();
}

function renderCards(cardsToShow, container, countId, isSimple = false) {
    if (isSimple) container.classList.add('simple-mode');
    else container.classList.remove('simple-mode');

    container.innerHTML = "";
    document.getElementById(countId).innerText = `共 ${cardsToShow.length} 位干员`;

    if (cardsToShow.length === 0) {
        container.innerHTML = "<p style='text-align:center; width:100%; color:#888;'>没有找到符合条件的卡牌哦~</p>";
        return;
    }
    cardsToShow.forEach(card => { container.innerHTML += createCardHTML(card, isSimple); });
}

// 检索
function matchFilters(card, filters) {
    if (filters.tiers.length > 0 && !filters.tiers.includes(card.tier)) return false;
    if (filters.mains.length > 0 && !card.main_attrs.some(a => filters.mains.includes(a))) return false;
    if (filters.subs.length > 0 && !card.sub_attrs.some(a => filters.subs.includes(a))) return false;
    if (filters.phases && filters.phases.length > 0) {
        const p = Array.isArray(card.phase) ? card.phase : [card.phase];
        if (!p.some(v => filters.phases.includes(v))) return false;
    }
    if (filters.types && filters.types.length > 0 && !card.effect_types.some(t => filters.types.includes(t))) return false;
    if (filters.usertags && filters.usertags.length > 0 && !card.userTags.some(t => filters.usertags.includes(t))) return false;
    if (filters.name && !card.name.toLowerCase().includes(filters.name)) return false;
    return true;
}

function updateWikiResult() {
    const filters = {
        name: document.getElementById('search-name').value.toLowerCase().trim(),
        tiers: getCheckedValues('filter-tier-group'),
        mains: getCheckedValues('filter-main-group'),
        subs: getCheckedValues('filter-sub-group'),
        phases: getCheckedValues('filter-phase-group'),
        types: getCheckedValues('filter-type-group'),
        usertags: getCheckedValues('filter-usertags-group')
    };
    const filtered = allCards.filter(card => matchFilters(card, filters));
    renderCards(filtered, wikiContainer, 'wiki-count', false);
}
document.getElementById('search-name').addEventListener('input', updateWikiResult);

// ================= 7. Ban 卡计算 =================
function initBanCheckboxes() {
    buildCheckboxGroup('ban-main-checkboxes', allOptions.mains, true);
    buildCheckboxGroup('ban-sub-checkboxes', allOptions.subs, true);
    document.querySelectorAll('.ban-cb').forEach(cb => cb.addEventListener('change', updateBanResult));
}

function isCardBanned(card, bannedMain, bannedSub) {
    if (card.main_attrs.length > 0) return card.main_attrs.every(attr => bannedMain.includes(attr));
    else {
        if (card.sub_attrs.length === 0) return false;
        return card.sub_attrs.every(attr => bannedSub.includes(attr));
    }
}

function updateBanResult() {
    const bannedMain = getCheckedValues('ban-main-checkboxes');
    const bannedSub = getCheckedValues('ban-sub-checkboxes');

    const deadCards = [], aliveCards = [];
    allCards.forEach(card => {
        if (isCardBanned(card, bannedMain, bannedSub)) deadCards.push(card);
        else aliveCards.push(card);
    });

    let baseResult = (banResultMode === 'survive') ? aliveCards : deadCards;

    const filters = {
        name: document.getElementById('ban-search-name').value.toLowerCase().trim(),
        tiers: getCheckedValues('ban-filter-tier-group'),
        mains: getCheckedValues('ban-filter-main-group'),
        subs: getCheckedValues('ban-filter-sub-group')
    };

    let finalResult = baseResult.filter(card => matchFilters(card, filters));
    renderCards(finalResult, banContainer, 'ban-count', banViewMode === 'simple');
}

document.getElementById('btn-mode-survive').addEventListener('click', (e) => {
    banResultMode = 'survive';
    e.target.classList.add('active'); document.getElementById('btn-mode-banned').classList.remove('active');
    updateBanResult();
});
document.getElementById('btn-mode-banned').addEventListener('click', (e) => {
    banResultMode = 'banned';
    e.target.classList.add('active'); document.getElementById('btn-mode-survive').classList.remove('active');
    updateBanResult();
});
document.getElementById('btn-view-detail').addEventListener('click', (e) => {
    banViewMode = 'detail';
    e.target.classList.add('active'); document.getElementById('btn-view-simple').classList.remove('active');
    updateBanResult();
});
document.getElementById('btn-view-simple').addEventListener('click', (e) => {
    banViewMode = 'simple';
    e.target.classList.add('active'); document.getElementById('btn-view-detail').classList.remove('active');
    updateBanResult();
});

document.getElementById('ban-search-name').addEventListener('input', updateBanResult);


loadData();