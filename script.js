// State Management
let currentMode = 'simple';
const fieldPool = {

    prioridade_s: { label: 'Nível de prioridade', type: 'text', default: 'P1', simple: true, complex: false },
    plano: { label: 'Plano contratado', type: 'text', default: '', simple: true, complex: false },
    caixa_porta: { label: 'Caixa e Porta', type: 'text', default: '', simple: true, complex: false },
    pop_setor_s: { label: 'POP e setor', type: 'text', default: '', simple: true, complex: false },
    sintomas: { label: 'Sintomas', type: 'text', default: '', simple: true, complex: false },
    referencia_s: { label: 'Ponto de referência', type: 'text', default: '', simple: true, complex: false },
    contato_local: { label: 'Contato no local', type: 'text', default: '', simple: true, complex: false },
    endereco_s: { label: 'Endereço', type: 'text', default: '', simple: true, complex: false },
    nome: { label: 'Nome', type: 'text', default: '', simple: true, complex: false },
    horario: { label: 'HORÁRIO', type: 'text', default: '', simple: true, complex: false },


    cliente: { label: 'Cliente', type: 'text', default: '', simple: false, complex: true },
    os_recente: { label: 'Houve O.S. recente?', type: 'text', default: 'Não', simple: false, complex: true },
    tipo: { label: 'Tipo (P0/P1/P2)', type: 'text', default: 'P1', simple: false, complex: true },
    motivo: { label: 'Motivo', type: 'text', default: '', simple: false, complex: true },
    alarme_onu: { label: 'Alarmes da ONU', type: 'text', default: 'Nenhum', simple: false, complex: true },
    sinal_onu: { label: 'Sinal da ONU (dBm)', type: 'text', default: '', simple: false, complex: true },
    pacote: { label: 'Pacote (Mbps)', type: 'text', default: '', simple: false, complex: true },
    nap: { label: 'NAP', type: 'text', default: '', simple: false, complex: true },
    pop: { label: 'POP', type: 'text', default: '', simple: false, complex: true },
    contato: { label: 'Contato/Telefone', type: 'text', default: '', simple: false, complex: true },
    referencia: { label: 'Referência', type: 'text', default: '', simple: false, complex: true },
    local: { label: 'Local', type: 'text', default: '', simple: false, complex: true },
    restricao: { label: 'Restrição', type: 'text', default: 'Nenhuma', simple: false, complex: true },

    caixa_ok: { label: 'Caixa ok?', type: 'binary', simple: false, complex: true },
    cabos_rompidos: { label: 'Nota cabos rompidos ou soltos?', type: 'binary', simple: false, complex: true },
    estrutura_ok: { label: 'Estrutura conferida, sem efeito?', type: 'binary', simple: false, complex: true },
    reboot_ok: { label: 'Reboot físico, sem efeito?', type: 'binary', simple: false, complex: true },
    outras_obs: { label: 'Outras observações gerais', type: 'text', default: 'Nenhuma observação adicional.', simple: false, complex: true, fullWidth: true }
};

const binaryOptions = ['Sim', 'Não'];

let values = {};

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    renderForm();
    updatePreviews();
    startTimeUpdate();
});

function loadSettings() {
    const savedConfig = localStorage.getItem('os_generator_config');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        Object.keys(fieldPool).forEach(key => {
            if (config[key]) {
                fieldPool[key].simple = config[key].simple;
                fieldPool[key].complex = config[key].complex;
            }
        });
    }

    const savedValues = localStorage.getItem('os_generator_values');
    if (savedValues) {
        values = JSON.parse(savedValues);
    }
}

function saveSettings() {
    const config = {};
    Object.keys(fieldPool).forEach(key => {
        config[key] = { simple: fieldPool[key].simple, complex: fieldPool[key].complex };
    });
    localStorage.setItem('os_generator_config', JSON.stringify(config));
}

function saveValues() {
    localStorage.setItem('os_generator_values', JSON.stringify(values));
}

function resetForm() {
    if (confirm('Deseja limpar todos os campos?')) {
        values = {};
        Object.keys(fieldPool).forEach(key => {
            values[key] = '';
        });
        saveValues();
        renderForm();
        updatePreviews();
    }
}

function switchMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
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
        const firstInput = formContainer.querySelector('input, select');
        if (firstInput) firstInput.focus();
    }
}

function renderForm() {
    const container = document.getElementById('form-container');
    container.innerHTML = '';

    Object.keys(fieldPool).forEach(key => {
        const field = fieldPool[key];
        if (field[currentMode]) {
            const div = document.createElement('div');
            div.className = `form-group ${field.fullWidth ? 'full-width' : ''}`;
            
            const label = document.createElement('label');
            label.innerText = field.label;
            
            if (field.type === 'binary') {
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'choice-group';

                binaryOptions.forEach(option => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = `choice-btn ${values[key] === option ? 'active' : ''}`;
                    button.textContent = option;
                    button.setAttribute('aria-pressed', values[key] === option ? 'true' : 'false');
                    button.onclick = () => {
                        values[key] = option;
                        saveValues();
                        renderForm();
                        updatePreviews();
                    };
                    buttonGroup.appendChild(button);
                });

                div.appendChild(label);
                div.appendChild(buttonGroup);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = field.label;
                input.value = values[key] !== undefined ? values[key] : '';
                input.id = `input-${key}`;
                input.oninput = (e) => {
                    values[key] = e.target.value;
                    saveValues();
                    updatePreviews();
                };
                
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        const inputs = Array.from(container.querySelectorAll('input, button.choice-btn'));
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
        }
    });
}

function renderConfig() {
    const list = document.getElementById('fields-list');
    list.innerHTML = '';

    Object.keys(fieldPool).forEach(key => {
        const field = fieldPool[key];
        
        const item = document.createElement('div');
        item.className = 'config-item glass';
        item.innerHTML = `
            <div class="config-label-row">
                <span class="field-name">${field.label}</span>
                <span class="field-origin">${field.simple ? 'Simples' : ''}${field.simple && field.complex ? ' | ' : ''}${field.complex ? 'Complexa' : ''}</span>
            </div>
            <div class="toggle-group">
                <button class="toggle-btn ${field.simple ? 'active' : ''}" onclick="toggleFieldUI('${key}', 'simple', this)">
                    <i class="fas fa-bolt"></i> Simples
                </button>
                <button class="toggle-btn ${field.complex ? 'active' : ''}" onclick="toggleFieldUI('${key}', 'complex', this)">
                    <i class="fas fa-layer-group"></i> Complexa
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function toggleFieldUI(key, mode, btn) {
    const isActive = fieldPool[key][mode];
    fieldPool[key][mode] = !isActive;
    if (fieldPool[key][mode]) btn.classList.add('active');
    else btn.classList.remove('active');
    saveSettings();
}

function updatePreviews() {
    const osPreview = document.getElementById('os-preview');
    const telPreview = document.getElementById('telegram-preview');

    const d = (key) => values[key] !== undefined && values[key] !== "" ? values[key] : (fieldPool[key]?.default || "N/A");

    if (currentMode === 'simple') {
        const msgOS = `📌 *Ficha Técnica* 📌

⚠️ Sintomas: ${d('sintomas')}
🔴 Prioridade: ${d('prioridade_s')}
📦 Plano: ${d('plano')}
📍 Caixa/Porta: ${d('caixa_porta')}
🏢 POP/Setor: ${d('pop_setor_s')}
📝 Referência: ${d('referencia_s')}
☎  Contato no local: ${d('contato_local')}
🏠 Endereço: ${d('endereco_s')}`;

        const msgTel = `👤 Nome: ${d('nome')}
🏠 Endereço: ${d('endereco_s')}
🛠 OS / Prioridade: ${d('prioridade_s')}
⏰ Horário: ${d('horario')}`;

        osPreview.value = msgOS;
        telPreview.value = msgTel;
    } else {
        const now = new Date();
        const dateTime = now.toLocaleString('pt-BR');
        
        let obsTech = [];
        if (d('caixa_ok') === 'Sim') obsTech.push("Caixa ok"); else obsTech.push("Caixa fora");
        if (d('cabos_rompidos') === 'Sim') obsTech.push("Nota cabos rompidos ou soltos"); else obsTech.push("Não nota cabos rompidos ou soltos");
        if (d('estrutura_ok') === 'Sim') obsTech.push("Estrutura conferida, sem efeito"); else obsTech.push("Estrutura com anomalias encontradas");
        if (d('reboot_ok') === 'Sim') obsTech.push("Reboot físico realizado, sem efeito"); else obsTech.push("Reboot físico não realizado ou com efeito");
        
        const obsFormatadas = obsTech.join('. ') + '.';

        const msgOS = `O.S.: ${d('tipo')}

Motivo: ${d('motivo')}
=====================

Alarmes da ONU: ${d('alarme_onu')}

=====================
Observações Técnicas: ${obsFormatadas}
Ult. O.S.: ${d('os_recente')}
=====================

Pacote: ${d('pacote')}
NAP: ${d('nap')} 
POP: ${d('pop')}
Local: ${d('local')}
Referência: ${d('referencia')}
Contato: ${d('contato')}`;

        const msgTel = `Cliente: ${d('cliente')}
O.S.: ${d('tipo')}
Motivo: ${d('motivo')}
Ult. O.S.: ${d('os_recente')}
Data: ${dateTime.split(' ')[0]}
Telefone: ${d('contato')}
Local: ${d('local')}`;

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

function showToast() {
    const toast = document.getElementById('toast');
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
