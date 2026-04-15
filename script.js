// State Management
const DEFAULT_MODE = 'simple';
const CUSTOM_FIELDS_STORAGE_KEY = 'os_generator_custom_fields';
let currentMode = DEFAULT_MODE;
const fieldPool = {
    priority: {
        label: { simple: 'Nível de prioridade', complex: 'Tipo (P0/P1/P2)' },
        type: 'text',
        default: '',
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
let returnToLastFieldEnabled = true;
let customFields = {};
let toastTimer = null;

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
    loadCustomFields();
    loadSettings();
    migrateLegacyValues();
    switchMode(DEFAULT_MODE);
    startTimeUpdate();
    updateLastFieldPreferenceButton();

    document.addEventListener('visibilitychange', () => {
        if (returnToLastFieldEnabled && document.visibilityState === 'visible' && currentMode !== 'config') {
            focusLastEditedField(currentMode);
        }
    });

    window.addEventListener('focus', () => {
        if (returnToLastFieldEnabled && currentMode !== 'config') {
            focusLastEditedField(currentMode);
        }
    });

    window.addEventListener('resize', () => {
        if (currentMode === 'config') {
            switchMode('config');
        }
    });
});

function getLabelForMode(field, mode = currentMode) {
    if (typeof field.label === 'string') {
        return field.label;
    }

    return field.label[mode] || field.label.simple || field.label.complex || 'Campo';
}

function isCustomFieldKey(key) {
    return key.startsWith('custom_');
}

function saveCustomFields() {
    localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(customFields));
}

function loadCustomFields() {
    const savedCustomFields = localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY);
    if (!savedCustomFields) return;

    try {
        const parsed = JSON.parse(savedCustomFields);
        if (!parsed || typeof parsed !== 'object') return;

        Object.entries(parsed).forEach(([key, field]) => {
            if (!isCustomFieldKey(key) || !field || typeof field !== 'object') return;
            if (!field.label || !field.type) return;
            fieldPool[key] = field;
        });

        customFields = parsed;
    } catch {
        customFields = {};
    }
}

function generateCustomFieldKey(name) {
    const normalized = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    return `custom_${normalized || 'campo'}_${Date.now()}`;
}

function normalizeFieldName(name) {
    return String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getFieldAllLabels(field) {
    if (!field || !field.label) return [];
    if (typeof field.label === 'string') return [field.label];
    return [field.label.simple, field.label.complex].filter(Boolean);
}

function hasDuplicateFieldName(name) {
    const target = normalizeFieldName(name);
    if (!target) return false;

    return Object.values(fieldPool).some((field) =>
        getFieldAllLabels(field).some((label) => normalizeFieldName(label) === target)
    );
}

function showCustomFieldStatus(message, type) {
    const statusEl = document.getElementById('new-field-status');
    if (!statusEl) return;
    statusEl.innerText = message;
    statusEl.className = `new-field-status ${type}`;
}

function showConfigGlobalStatus(message, type) {
    const statusEl = document.getElementById('config-global-status');
    if (!statusEl) return;
    statusEl.innerText = message;
    statusEl.className = `new-field-status ${type}`;
}

function addCustomField() {
    const nameEl = document.getElementById('new-field-name');
    const typeEl = document.getElementById('new-field-type');
    const simpleEl = document.getElementById('new-field-simple');
    const complexEl = document.getElementById('new-field-complex');
    const osEl = document.getElementById('new-field-os');
    const telEl = document.getElementById('new-field-tel');

    if (!nameEl || !typeEl || !simpleEl || !complexEl || !osEl || !telEl) return;

    const name = nameEl.value.trim();
    if (!name) {
        showCustomFieldStatus('Preencha o nome do campo para criar.', 'error');
        showConfigGlobalStatus('Preencha o nome do campo para criar.', 'error');
        showToast('Informe o nome do campo.');
        nameEl.focus();
        return;
    }

    if (hasDuplicateFieldName(name)) {
        showCustomFieldStatus('Já existe um campo com esse nome. Use um nome diferente.', 'error');
        showConfigGlobalStatus('Este campo já foi criado. Use um nome diferente.', 'error');
        showToast('Não é permitido criar campo com nome duplicado.');
        nameEl.focus();
        return;
    }

    const simple = simpleEl.checked;
    const complex = complexEl.checked;
    if (!simple && !complex) {
        showCustomFieldStatus('Selecione pelo menos Simples ou Complexa.', 'error');
        showConfigGlobalStatus('Selecione pelo menos Simples ou Complexa.', 'error');
        showToast('Selecione Simples e/ou Complexa.');
        return;
    }

    const key = generateCustomFieldKey(name);
    const type = typeEl.value === 'textarea' ? 'textarea' : 'text';

    const newField = {
        label: { simple: name, complex: name },
        type,
        default: '',
        simple,
        complex,
        os: osEl.checked,
        tel: telEl.checked,
        fullWidth: type === 'textarea'
    };

    fieldPool[key] = newField;
    customFields[key] = newField;

    if (simple && !fieldOrder.simple.includes(key)) fieldOrder.simple.push(key);
    if (complex && !fieldOrder.complex.includes(key)) fieldOrder.complex.push(key);

    values[key] = '';
    saveCustomFields();
    saveSettings();
    saveValues();
    renderConfig();
    renderForm();
    updatePreviews();

    nameEl.value = '';
    typeEl.value = 'text';
    simpleEl.checked = true;
    complexEl.checked = true;
    osEl.checked = true;
    telEl.checked = false;
    showCustomFieldStatus(`OK: campo "${name}" criado com sucesso.`, 'success');
    showConfigGlobalStatus(`OK: campo "${name}" criado com sucesso.`, 'success');
    showToast(`OK: campo "${name}" criado.`);
}

function removeCustomField(key) {
    if (!isCustomFieldKey(key) || !fieldPool[key]) return;
    if (!confirm('Deseja remover este campo personalizado?')) return;

    const removedName = getLabelForMode(fieldPool[key], 'simple');

    delete fieldPool[key];
    delete customFields[key];
    delete values[key];

    fieldOrder.simple = fieldOrder.simple.filter((k) => k !== key);
    fieldOrder.complex = fieldOrder.complex.filter((k) => k !== key);

    if (lastActiveFieldByMode.simple === key) lastActiveFieldByMode.simple = null;
    if (lastActiveFieldByMode.complex === key) lastActiveFieldByMode.complex = null;

    saveCustomFields();
    saveSettings();
    saveValues();
    saveLastActiveField();
    renderConfig();
    renderForm();
    updatePreviews();
    showCustomFieldStatus(`OK: campo "${removedName}" removido com sucesso.`, 'success');
    showConfigGlobalStatus(`OK: campo "${removedName}" removido com sucesso.`, 'success');
    showToast(`OK: campo "${removedName}" removido.`);
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

    const savedReturnPreference = localStorage.getItem('os_generator_return_last_field');
    if (savedReturnPreference !== null) {
        returnToLastFieldEnabled = savedReturnPreference === 'true';
    }

    normalizeFieldOrder();
}

function saveReturnPreference() {
    localStorage.setItem('os_generator_return_last_field', String(returnToLastFieldEnabled));
}

function updateLastFieldPreferenceButton() {
    const btn = document.getElementById('btn-last-field-pref');
    if (!btn) return;

    btn.innerHTML = returnToLastFieldEnabled
        ? '<i class="fas fa-location-arrow"></i> Retorno ao último campo: Ativado'
        : '<i class="fas fa-location-arrow"></i> Retorno ao último campo: Desativado';
}

function toggleLastFieldReturnPreference() {
    returnToLastFieldEnabled = !returnToLastFieldEnabled;
    saveReturnPreference();
    updateLastFieldPreferenceButton();
    showToast(returnToLastFieldEnabled ? 'Retorno ao último campo ativado.' : 'Retorno ao último campo desativado.');
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
    const osCard = document.getElementById('os-card');
    const telegramCard = document.getElementById('telegram-card');
    const customFieldSide = document.getElementById('custom-field-side');
    const isLargeScreen = window.matchMedia('(min-width: 1366px)').matches;

    if (mode === 'config') {
        formContainer.classList.add('hidden');
        configPanel.classList.remove('hidden');
        resetBtn.classList.add('hidden');
        if (isLargeScreen) {
            previewSection.classList.remove('hidden');
            if (osCard) osCard.classList.add('hidden');
            if (telegramCard) telegramCard.classList.add('hidden');
            if (customFieldSide) customFieldSide.classList.remove('hidden');
        } else {
            previewSection.classList.add('hidden');
        }
        modeTitle.parentElement.classList.add('hidden');
        renderConfig();
        updateLastFieldPreferenceButton();
    } else {
        formContainer.classList.remove('hidden');
        configPanel.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        previewSection.classList.remove('hidden');
        if (osCard) osCard.classList.remove('hidden');
        if (telegramCard) telegramCard.classList.remove('hidden');
        if (customFieldSide) customFieldSide.classList.add('hidden');
        modeTitle.parentElement.classList.remove('hidden');
        modeTitle.innerText = mode === 'simple' ? 'Ordem de Serviço Simples' : 'Ordem de Serviço Complexa';
        renderForm();
        updatePreviews();
        if (!returnToLastFieldEnabled || !focusLastEditedField(mode)) {
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
        const customActions = isCustomFieldKey(key)
            ? `<div class="custom-actions"><button class="order-btn" onclick="removeCustomField('${key}')"><i class="fas fa-trash"></i> Remover campo</button></div>`
            : '';
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
            ${customActions}
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

    Object.keys(customFields).forEach((key) => {
        delete fieldPool[key];
        delete values[key];
    });
    customFields = {};
    localStorage.removeItem(CUSTOM_FIELDS_STORAGE_KEY);

    if (lastActiveFieldByMode.simple && !fieldPool[lastActiveFieldByMode.simple]) lastActiveFieldByMode.simple = null;
    if (lastActiveFieldByMode.complex && !fieldPool[lastActiveFieldByMode.complex]) lastActiveFieldByMode.complex = null;
    saveLastActiveField();

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

    const simpleEmojiMap = {
        os: {
            reason: '⚠️',
            priority: '🔴',
            plan: '📦',
            nap: '📍',
            pop: '🏢',
            reference: '📝',
            contact: '☎️',
            location: '🏠',
            customer: '👤',
            visit_date: '⏰',
            sinal_onu: '📶',
            os_recente: '🕘',
            outras_obs: '🗒️'
        },
        tel: {
            customer: '👤',
            location: '🏠',
            priority: '🛠️',
            visit_date: '⏰',
            contact: '☎️',
            reason: '⚠️',
            outras_obs: '🗒️'
        }
    };

    const simpleLabelOverride = {
        tel: {
            customer: 'Nome',
            location: 'Endereço',
            priority: 'OS / Prioridade',
            visit_date: 'Horário'
        }
    };

    const simpleTelegramPreferredOrder = ['customer', 'location', 'priority', 'visit_date'];

    const getSimpleTelegramKeys = () => {
        const visibleKeys = getOrderedVisibleKeys('simple').filter((key) => isVisibleInOutput(key, 'simple', 'tel'));
        const orderedKeys = simpleTelegramPreferredOrder.filter((key) => visibleKeys.includes(key));

        visibleKeys.forEach((key) => {
            if (!orderedKeys.includes(key)) orderedKeys.push(key);
        });

        return orderedKeys;
    };

    const buildSimplePreview = (output) => {
        const lines = [];
        const keys = output === 'tel' ? getSimpleTelegramKeys() : getOrderedVisibleKeys('simple');

        keys.forEach((key) => {
            if (!isVisibleInOutput(key, 'simple', output)) return;

            const icon = simpleEmojiMap[output]?.[key] || '📌';
            const label = simpleLabelOverride[output]?.[key] || getLabelForMode(fieldPool[key], 'simple');
            lines.push(`${icon} ${label}: ${d(key)}`);
        });

        return lines;
    };

    if (currentMode === 'simple') {
        const simpleOsLines = buildSimplePreview('os');
        const simpleTelLines = buildSimplePreview('tel');

        const msgOS = `📌 *Ficha Técnica* 📌\n\n${simpleOsLines.length ? simpleOsLines.join('\n') : 'Nenhum campo configurado para Ficha Técnica.'}`;
        const msgTel = simpleTelLines.length ? simpleTelLines.join('\n') : 'Nenhum campo configurado para Telegram.';

        osPreview.value = msgOS;
        telPreview.value = msgTel;
    } else {
        const now = new Date().toLocaleString('pt-BR');

        const buildTechnicalObservations = () => {
            const binaryFields = ['caixa_ok', 'cabos_rompidos', 'estrutura_ok', 'reboot_ok'];
            const parts = [];

            binaryFields.forEach((key) => {
                if (!isVisibleInOutput(key, 'complex', 'os')) return;
                parts.push(`${getLabelForMode(fieldPool[key], 'complex')}: ${d(key)}`);
            });

            return parts.length ? parts.join(' | ') : '.';
        };

        const buildComplexOsTemplate = () => {
            const technicalObservations = buildTechnicalObservations();
            const lines = [
                `O.S. Gerada: ${now}`,
                '',
                `Cliente: ${d('customer')}`,
                `O.S.: ${d('priority')}`,
                `Motivo: ${d('reason')}`,
                `Ult. O.S.: ${d('os_recente')}`,
                `Data: ${d('visit_date')}`,
                `Telefone: ${d('contact')}`,
                `Local: ${d('location')}`,
                '',
                'Janela de atendimento: (: - :)',
                '',
                '=====================',
                `*** ${d('restricao')} ***`,
                '',
                `O.S.: ${d('priority')}`,
                '',
                `Motivo: ${d('reason')}`,
                '',
                '=====================',
                '',
                `Alarmes da ONU: ${d('alarme_onu')}`,
                `Sinal da ONU: ${d('sinal_onu')} dBm`,
                '',
                '=====================',
                `Observações Técnicas: ${technicalObservations}`,
                '',
                `Outras Observações: ${d('outras_obs')}`,
                '',
                `Ult. O.S.: ${d('os_recente')}`,
                '',
                '=====================',
                '',
                `Pacote: ${d('plan')} Mbps`,
                `NAP: ${d('nap')}`,
                `POP: ${d('pop')}`,
                `Local: ${d('location')}`,
                `Referência: ${d('reference')}`,
                `Contato: ${d('contact')}`
            ];

            return lines.join('\n');
        };

        const buildComplexPreview = (output) => {
            const lines = [];

            getOrderedVisibleKeys('complex').forEach((key) => {
                if (!isVisibleInOutput(key, 'complex', output)) return;

                let label = getLabelForMode(fieldPool[key], 'complex');
                if (output === 'os' && key === 'priority') label = 'O.S.';
                if (output === 'tel' && key === 'priority') label = 'O.S.';
                if (output === 'tel' && key === 'visit_date') label = 'Data';
                if (output === 'tel' && key === 'contact') label = 'Telefone';

                lines.push(`${label}: ${d(key)}`);
            });

            return lines;
        };

        const complexTelLines = buildComplexPreview('tel');

        const msgOS = buildComplexOsTemplate();
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

function showToast(message = 'Copiado com sucesso!', duration = 2800) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.remove('hidden');

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
        toastTimer = null;
    }, duration);
}

function startTimeUpdate() {
    const timeEl = document.getElementById('current-time');
    setInterval(() => {
        timeEl.innerText = new Date().toLocaleString('pt-BR');
    }, 1000);
}
