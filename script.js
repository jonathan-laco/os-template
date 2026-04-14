// State Management
const DEFAULT_MODE = 'complex';
let currentMode = DEFAULT_MODE;
const fieldPool = {
    priority: {
        label: { simple: 'Nível de prioridade', complex: 'Tipo (P0/P1/P2)' },
        type: 'text',
        default: 'P1',
        simple: true,
        complex: true,
        os: true,
        tel: true
    },
    plan: {
        label: { simple: 'Plano contratado', complex: 'Pacote (Mbps)' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: false
    },
    nap: {
        label: { simple: 'Caixa e Porta', complex: 'NAP' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: false
    },
    pop: {
        label: { simple: 'POP e setor', complex: 'POP' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: false
    },
    reason: {
        label: { simple: 'Sintomas', complex: 'Motivo' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: true
    },
    reference: {
        label: { simple: 'Ponto de referência', complex: 'Referência' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: false
    },
    contact: {
        label: { simple: 'Contato no local', complex: 'Contato/Telefone' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: true
    },
    location: {
        label: { simple: 'Endereço', complex: 'Local' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: true,
        tel: true
    },
    customer: {
        label: { simple: 'Nome', complex: 'Cliente' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: false,
        tel: true
    },
    visit_date: {
        label: { simple: 'HORÁRIO', complex: 'Data da Visita' },
        type: 'text',
        default: '',
        simple: true,
        complex: true,
        os: false,
        tel: true
    },

    os_recente: { label: 'Houve O.S. recente?', type: 'text', default: 'Não', simple: false, complex: true, os: true, tel: true },
    alarme_onu: { label: 'Alarmes da ONU', type: 'text', default: 'Nenhum', simple: false, complex: true, os: true, tel: false },
    sinal_onu: { label: 'Sinal da ONU (dBm)', type: 'text', default: '', simple: false, complex: true, os: true, tel: false },
    restricao: { label: 'Restrição', type: 'text', default: 'Nenhuma', simple: false, complex: true, os: true, tel: false },

    caixa_ok: { label: 'Caixa ok?', type: 'binary', simple: false, complex: true, os: true, tel: false },
    cabos_rompidos: { label: 'Nota cabos rompidos ou soltos?', type: 'binary', simple: false, complex: true, os: true, tel: false },
    estrutura_ok: { label: 'Estrutura conferida, sem efeito?', type: 'binary', simple: false, complex: true, os: true, tel: false },
    reboot_ok: { label: 'Reboot físico, sem efeito?', type: 'binary', simple: false, complex: true, os: true, tel: false },
    outras_obs: {
        label: 'Outras observações gerais',
        type: 'textarea',
        default: 'Nenhuma observação adicional.',
        simple: false,
        complex: true,
        os: true,
        tel: false,
        fullWidth: true
    }
};

const defaultFieldPool = JSON.parse(JSON.stringify(fieldPool));
const defaultFieldOrder = {
    simple: [
        'priority',
        'reason',
        'plan',
        'nap',
        'pop',
        'reference',
        'contact',
        'location',
        'customer',
        'visit_date',
        'outras_obs'
    ],
    complex: [
        'priority',
        'visit_date',
        'customer',
        'reason',
        'os_recente',
        'alarme_onu',
        'sinal_onu',
        'plan',
        'nap',
        'pop',
        'location',
        'reference',
        'contact',
        'restricao',
        'caixa_ok',
        'cabos_rompidos',
        'estrutura_ok',
        'reboot_ok',
        'outras_obs'
    ]
};

let fieldOrder = JSON.parse(JSON.stringify(defaultFieldOrder));

const binaryOptions = ['Sim', 'Não'];

let values = {};
let lastActiveFieldByMode = { simple: null, complex: null };

const legacyFieldMap = {
    prioridade_s: 'priority',
    tipo: 'priority',
    plano: 'plan',
    pacote: 'plan',
    caixa_porta: 'nap',
    nap: 'nap',
    pop_setor_s: 'pop',
    pop: 'pop',
    sintomas: 'reason',
    motivo: 'reason',
    referencia_s: 'reference',
    referencia: 'reference',
    contato_local: 'contact',
    contato: 'contact',
    endereco_s: 'location',
    local: 'location',
    nome: 'customer',
    cliente: 'customer',
    horario: 'visit_date',
    data_visita: 'visit_date'
};

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    migrateLegacyValues();
    switchMode(DEFAULT_MODE);
    startTimeUpdate();

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && currentMode !== 'config') {
            focusLastEditedField(currentMode);
        }
    });

    window.addEventListener('focus', () => {
        if (currentMode !== 'config') {
            focusLastEditedField(currentMode);
        }
    });
});

function getLabelForMode(field, mode = currentMode) {
    if (typeof field.label === 'string') {
        return field.label;
    }

    return field.label[mode] || field.label.simple || field.label.complex || 'Campo';
}

function isVisibleInOutput(key, mode, output) {
    const field = fieldPool[key];
    if (!field) return false;
    return Boolean(field[mode] && field[output]);
}

function loadSettings() {
    const savedConfig = localStorage.getItem('os_generator_config');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        Object.keys(fieldPool).forEach((key) => {
            if (config[key]) {
                if (typeof config[key].simple === 'boolean') fieldPool[key].simple = config[key].simple;
                if (typeof config[key].complex === 'boolean') fieldPool[key].complex = config[key].complex;
                if (typeof config[key].os === 'boolean') fieldPool[key].os = config[key].os;
                if (typeof config[key].tel === 'boolean') fieldPool[key].tel = config[key].tel;
            }
        });
    }

    const savedValues = localStorage.getItem('os_generator_values');
    if (savedValues) {
        values = JSON.parse(savedValues);
    }

    const savedLastField = localStorage.getItem('os_generator_last_active_field');
    if (savedLastField) {
        const parsedLastField = JSON.parse(savedLastField);
        if (parsedLastField && typeof parsedLastField === 'object') {
            if (typeof parsedLastField.simple === 'string' || parsedLastField.simple === null) {
                lastActiveFieldByMode.simple = parsedLastField.simple;
            }
            if (typeof parsedLastField.complex === 'string' || parsedLastField.complex === null) {
                lastActiveFieldByMode.complex = parsedLastField.complex;
            }
        }
    }

    const savedOrder = localStorage.getItem('os_generator_field_order');
    if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder.simple)) fieldOrder.simple = parsedOrder.simple;
        if (Array.isArray(parsedOrder.complex)) fieldOrder.complex = parsedOrder.complex;
    }

    normalizeFieldOrder();
}

function saveLastActiveField() {
    localStorage.setItem('os_generator_last_active_field', JSON.stringify(lastActiveFieldByMode));
}

function setLastEditedField(key) {
    if (!fieldPool[key] || !fieldPool[key][currentMode]) return;
    lastActiveFieldByMode[currentMode] = key;
    saveLastActiveField();
}

function focusLastEditedField(mode) {
    const key = lastActiveFieldByMode[mode];
    if (!key || !fieldPool[key] || !fieldPool[key][mode]) return false;

    const input = document.getElementById(`input-${key}`);
    if (input) {
        input.focus({ preventScroll: true });
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
    }

    const button = document.querySelector(`[data-field-key="${key}"]`);
    if (button) {
        button.focus({ preventScroll: true });
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
    }

    return false;
}

function normalizeFieldOrder() {
    ['simple', 'complex'].forEach((mode) => {
        const seen = new Set();
        const normalized = [];

        (fieldOrder[mode] || []).forEach((key) => {
            if (!seen.has(key) && fieldPool[key] && fieldPool[key][mode]) {
                normalized.push(key);
                seen.add(key);
            }
        });

        Object.keys(fieldPool).forEach((key) => {
            if (fieldPool[key][mode] && !seen.has(key)) {
                normalized.push(key);
                seen.add(key);
            }
        });

        fieldOrder[mode] = normalized;
    });
}

function getOrderedVisibleKeys(mode) {
    normalizeFieldOrder();
    return fieldOrder[mode].filter((key) => fieldPool[key] && fieldPool[key][mode]);
}

function migrateLegacyValues() {
    let hasChanges = false;

    Object.keys(legacyFieldMap).forEach((legacyKey) => {
        const canonicalKey = legacyFieldMap[legacyKey];
        if (values[legacyKey] !== undefined && values[legacyKey] !== '' && (values[canonicalKey] === undefined || values[canonicalKey] === '')) {
            values[canonicalKey] = values[legacyKey];
            hasChanges = true;
        }

        if (legacyKey !== canonicalKey && values[legacyKey] !== undefined) {
            delete values[legacyKey];
            hasChanges = true;
        }
    });

    if (hasChanges) {
        saveValues();
    }
}

function saveSettings() {
    const config = {};
    Object.keys(fieldPool).forEach((key) => {
        config[key] = {
            simple: fieldPool[key].simple,
            complex: fieldPool[key].complex,
            os: fieldPool[key].os,
            tel: fieldPool[key].tel
        };
    });
    localStorage.setItem('os_generator_config', JSON.stringify(config));
    localStorage.setItem('os_generator_field_order', JSON.stringify(fieldOrder));
}

function saveValues() {
    localStorage.setItem('os_generator_values', JSON.stringify(values));
}

function resetForm() {
    if (confirm('Deseja limpar todos os campos?')) {
        values = {};
        Object.keys(fieldPool).forEach((key) => {
            values[key] = '';
        });
        saveValues();
        renderForm();
        updatePreviews();
    }
}

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');

    const formContainer = document.getElementById('form-container');
    const configPanel = document.getElementById('config-container');
    const modeTitle = document.getElementById('mode-title');
    const resetBtn = document.getElementById('btn-reset');
    const previewSection = document.querySelector('.preview-section');

    if (mode === 'config') {
        formContainer.classList.add('hidden');
        configPanel.classList.remove('hidden');
        resetBtn.classList.add('hidden');
        previewSection.classList.add('hidden');
        modeTitle.parentElement.classList.add('hidden');
        renderConfig();
    } else {
        formContainer.classList.remove('hidden');
        configPanel.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        previewSection.classList.remove('hidden');
        modeTitle.parentElement.classList.remove('hidden');
        modeTitle.innerText = mode === 'simple' ? 'Ordem de Serviço Simples' : 'Ordem de Serviço Complexa';
        renderForm();
        updatePreviews();
        if (!focusLastEditedField(mode)) {
            const firstInput = formContainer.querySelector('input, textarea, select, button.choice-btn');
            if (firstInput) firstInput.focus();
        }
    }
}

function renderForm() {
    const container = document.getElementById('form-container');
    container.innerHTML = '';

    getOrderedVisibleKeys(currentMode).forEach((key) => {
        const field = fieldPool[key];
        const div = document.createElement('div');
        div.className = `form-group ${field.fullWidth ? 'full-width' : ''}`;

        const label = document.createElement('label');
        label.innerText = getLabelForMode(field, currentMode);

        if (field.type === 'binary') {
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'choice-group';

            binaryOptions.forEach((option) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `choice-btn ${values[key] === option ? 'active' : ''}`;
                button.textContent = option;
                button.setAttribute('data-field-key', key);
                button.setAttribute('aria-pressed', values[key] === option ? 'true' : 'false');
                button.onclick = () => {
                    setLastEditedField(key);
                    values[key] = option;
                    saveValues();
                    renderForm();
                    updatePreviews();
                };
                button.onfocus = () => setLastEditedField(key);
                buttonGroup.appendChild(button);
            });

            div.appendChild(label);
            div.appendChild(buttonGroup);
        } else if (field.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.placeholder = getLabelForMode(field, currentMode);
            textarea.value = values[key] !== undefined ? values[key] : '';
            textarea.id = `input-${key}`;
            textarea.rows = 4;
            textarea.oninput = (e) => {
                setLastEditedField(key);
                values[key] = e.target.value;
                saveValues();
                updatePreviews();
            };
            textarea.onfocus = () => setLastEditedField(key);

            div.appendChild(label);
            div.appendChild(textarea);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = getLabelForMode(field, currentMode);
            input.value = values[key] !== undefined ? values[key] : '';
            input.id = `input-${key}`;
            input.oninput = (e) => {
                setLastEditedField(key);
                values[key] = e.target.value;
                saveValues();
                updatePreviews();
            };
            input.onfocus = () => setLastEditedField(key);

            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const inputs = Array.from(container.querySelectorAll('input, textarea, button.choice-btn'));
                    const index = inputs.indexOf(e.target);
                    if (index > -1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                }
            };

            div.appendChild(label);
            div.appendChild(input);
        }

        container.appendChild(div);
    });
}

function renderConfig() {
    const list = document.getElementById('fields-list');
    list.innerHTML = '';

    const orderSimpleMap = Object.fromEntries(getOrderedVisibleKeys('simple').map((key, index) => [key, index + 1]));
    const orderComplexMap = Object.fromEntries(getOrderedVisibleKeys('complex').map((key, index) => [key, index + 1]));

    Object.keys(fieldPool).forEach((key) => {
        const field = fieldPool[key];
        const simpleLabel = getLabelForMode(field, 'simple');
        const complexLabel = getLabelForMode(field, 'complex');
        const mergedLabel = simpleLabel === complexLabel ? simpleLabel : `${simpleLabel} ↔ ${complexLabel}`;

        const item = document.createElement('div');
        item.className = 'config-item glass';
        item.innerHTML = `
            <div class="config-label-row">
                <span class="field-name">${mergedLabel}</span>
                <span class="field-origin">${field.simple ? 'Simples' : ''}${field.simple && field.complex ? ' | ' : ''}${field.complex ? 'Complexa' : ''}</span>
            </div>
            <div class="toggle-group">
                <button class="toggle-btn ${field.simple ? 'active' : ''}" onclick="toggleFieldFlag('${key}', 'simple', this)">
                    <i class="fas fa-bolt"></i> Simples
                </button>
                <button class="toggle-btn ${field.complex ? 'active' : ''}" onclick="toggleFieldFlag('${key}', 'complex', this)">
                    <i class="fas fa-layer-group"></i> Complexa
                </button>
            </div>
            <div class="toggle-group" style="margin-top: 0.5rem;">
                <button class="toggle-btn ${field.os ? 'active' : ''}" onclick="toggleFieldFlag('${key}', 'os', this)">
                    <i class="fas fa-file-contract"></i> Ficha Técnica
                </button>
                <button class="toggle-btn ${field.tel ? 'active' : ''}" onclick="toggleFieldFlag('${key}', 'tel', this)">
                    <i class="fab fa-telegram"></i> Telegram
                </button>
            </div>
            <div class="order-row">
                <span class="order-badge">S: ${orderSimpleMap[key] || '-'}</span>
                <button class="order-btn" onclick="moveField('${key}', 'simple', -1)" ${field.simple ? '' : 'disabled'} title="Subir no Simples">↑ Simples</button>
                <button class="order-btn" onclick="moveField('${key}', 'simple', 1)" ${field.simple ? '' : 'disabled'} title="Descer no Simples">↓ Simples</button>
                <span class="order-badge">C: ${orderComplexMap[key] || '-'}</span>
                <button class="order-btn" onclick="moveField('${key}', 'complex', -1)" ${field.complex ? '' : 'disabled'} title="Subir na Complexa">↑ Complexa</button>
                <button class="order-btn" onclick="moveField('${key}', 'complex', 1)" ${field.complex ? '' : 'disabled'} title="Descer na Complexa">↓ Complexa</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function toggleFieldFlag(key, flag, btn) {
    const isActive = fieldPool[key][flag];
    fieldPool[key][flag] = !isActive;
    if (fieldPool[key][flag]) btn.classList.add('active');
    else btn.classList.remove('active');

    if ((flag === 'simple' || flag === 'complex') && fieldPool[key][flag] && !fieldOrder[flag].includes(key)) {
        fieldOrder[flag].push(key);
    }

    saveSettings();
    renderConfig();
    renderForm();
    updatePreviews();
}

function moveField(key, mode, direction) {
    if (!fieldPool[key] || !fieldPool[key][mode]) return;

    const ordered = getOrderedVisibleKeys(mode);
    const index = ordered.indexOf(key);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    const temp = ordered[targetIndex];
    ordered[targetIndex] = ordered[index];
    ordered[index] = temp;

    fieldOrder[mode] = ordered;
    saveSettings();
    renderConfig();
    renderForm();
    updatePreviews();
}

function resetSettingsToDefault() {
    if (!confirm('Deseja voltar ao padrão definido no sistema?')) return;

    Object.keys(fieldPool).forEach((key) => {
        fieldPool[key].simple = defaultFieldPool[key].simple;
        fieldPool[key].complex = defaultFieldPool[key].complex;
        fieldPool[key].os = defaultFieldPool[key].os;
        fieldPool[key].tel = defaultFieldPool[key].tel;
    });

    fieldOrder = JSON.parse(JSON.stringify(defaultFieldOrder));
    normalizeFieldOrder();
    saveSettings();
    renderConfig();
    renderForm();
    updatePreviews();
    showToast('Configurações padrão restauradas.');
}

function updatePreviews() {
    const osPreview = document.getElementById('os-preview');
    const telPreview = document.getElementById('telegram-preview');

    const d = (key) => (values[key] !== undefined && values[key] !== '' ? values[key] : (fieldPool[key]?.default || 'N/A'));

    const addLineIfVisible = (lines, cfg) => {
        if (!isVisibleInOutput(cfg.key, cfg.mode, cfg.output)) return;
        const rawLabel = cfg.label || getLabelForMode(fieldPool[cfg.key], cfg.mode);
        const fullLabel = cfg.icon ? `${cfg.icon} ${rawLabel}` : rawLabel;
        lines.push(`${fullLabel}: ${d(cfg.key)}`);
    };

    if (currentMode === 'simple') {
        const simpleOsLines = [];
        [
            { mode: 'simple', output: 'os', key: 'reason', icon: '⚠️' },
            { mode: 'simple', output: 'os', key: 'priority', icon: '🔴' },
            { mode: 'simple', output: 'os', key: 'plan', icon: '📦' },
            { mode: 'simple', output: 'os', key: 'nap', icon: '📍' },
            { mode: 'simple', output: 'os', key: 'pop', icon: '🏢' },
            { mode: 'simple', output: 'os', key: 'reference', icon: '📝' },
            { mode: 'simple', output: 'os', key: 'contact', icon: '☎' },
            { mode: 'simple', output: 'os', key: 'location', icon: '🏠' },
            { mode: 'simple', output: 'os', key: 'outras_obs', icon: '🗒️' }
        ].forEach((cfg) => addLineIfVisible(simpleOsLines, cfg));

        const simpleTelLines = [];
        [
            { mode: 'simple', output: 'tel', key: 'customer', icon: '👤' },
            { mode: 'simple', output: 'tel', key: 'location', icon: '🏠' },
            { mode: 'simple', output: 'tel', key: 'priority', icon: '🛠', label: 'OS / Prioridade' },
            { mode: 'simple', output: 'tel', key: 'visit_date', icon: '⏰' },
            { mode: 'simple', output: 'tel', key: 'outras_obs', icon: '🗒️', label: 'Observações' }
        ].forEach((cfg) => addLineIfVisible(simpleTelLines, cfg));

        const msgOS = `📌 *Ficha Técnica* 📌\n\n${simpleOsLines.length ? simpleOsLines.join('\n') : 'Nenhum campo configurado para Ficha Técnica.'}`;
        const msgTel = simpleTelLines.length ? simpleTelLines.join('\n') : 'Nenhum campo configurado para Telegram.';

        osPreview.value = msgOS;
        telPreview.value = msgTel;
    } else {
        const complexLines = [];

        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'priority', label: 'O.S.' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'visit_date', label: 'Data da Visita' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'reason', label: 'Motivo' });

        complexLines.push('=====================');

        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'alarme_onu', label: 'Alarmes da ONU' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'sinal_onu', label: 'Sinal da ONU' });

        const obsTech = [];
        if (isVisibleInOutput('caixa_ok', 'complex', 'os')) {
            obsTech.push(d('caixa_ok') === 'Sim' ? 'Caixa ok' : 'Caixa fora');
        }
        if (isVisibleInOutput('cabos_rompidos', 'complex', 'os')) {
            obsTech.push(d('cabos_rompidos') === 'Sim' ? 'Nota cabos rompidos ou soltos' : 'Não nota cabos rompidos ou soltos');
        }
        if (isVisibleInOutput('estrutura_ok', 'complex', 'os')) {
            obsTech.push(d('estrutura_ok') === 'Sim' ? 'Estrutura conferida, sem efeito' : 'Estrutura com anomalias encontradas');
        }
        if (isVisibleInOutput('reboot_ok', 'complex', 'os')) {
            obsTech.push(d('reboot_ok') === 'Sim' ? 'Reboot físico realizado, sem efeito' : 'Reboot físico não realizado ou com efeito');
        }

        if (obsTech.length) {
            complexLines.push('');
            complexLines.push(`Observações Técnicas: ${obsTech.join('. ')}.`);
        }

        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'outras_obs', label: 'Outras observações gerais' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'os_recente', label: 'Ult. O.S.' });

        complexLines.push('=====================');

        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'plan', label: 'Pacote' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'nap', label: 'NAP' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'pop', label: 'POP' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'location', label: 'Local' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'reference', label: 'Referência' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'contact', label: 'Contato' });
        addLineIfVisible(complexLines, { mode: 'complex', output: 'os', key: 'restricao', label: 'Restrição' });

        const complexTelLines = [];
        [
            { mode: 'complex', output: 'tel', key: 'customer', label: 'Cliente' },
            { mode: 'complex', output: 'tel', key: 'priority', label: 'O.S.' },
            { mode: 'complex', output: 'tel', key: 'reason', label: 'Motivo' },
            { mode: 'complex', output: 'tel', key: 'os_recente', label: 'Ult. O.S.' },
            { mode: 'complex', output: 'tel', key: 'visit_date', label: 'Data' },
            { mode: 'complex', output: 'tel', key: 'contact', label: 'Telefone' },
            { mode: 'complex', output: 'tel', key: 'location', label: 'Local' },
            { mode: 'complex', output: 'tel', key: 'outras_obs', label: 'Observações' }
        ].forEach((cfg) => addLineIfVisible(complexTelLines, cfg));

        const msgOS = complexLines.filter((line, idx, arr) => !(line === '' && arr[idx - 1] === '')).join('\n');
        const msgTel = complexTelLines.length ? complexTelLines.join('\n') : 'Nenhum campo configurado para Telegram.';

        osPreview.value = msgOS;
        telPreview.value = msgTel;
    }
}

function copyContent(id) {
    const textarea = document.getElementById(id);
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        showToast();
    });
}

function showToast(message = 'Copiado com sucesso!') {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

function startTimeUpdate() {
    const timeEl = document.getElementById('current-time');
    setInterval(() => {
        timeEl.innerText = new Date().toLocaleString('pt-BR');
    }, 1000);
}
