// URL base da API
const API_URL = 'http://localhost:3001';

// Elementos DOM
const agendamentosContainer = document.getElementById('agendamentos-container');
const loadingElement = document.querySelector('.loading');
const formAgendamento = document.getElementById('formAgendamento');
const btnSalvarAgendamento = document.getElementById('btnSalvarAgendamento');
const modalAgendamento = new bootstrap.Modal(document.getElementById('modalAgendamento'));

// Modais de confirmação
const modalConfirmarFinalizar = new bootstrap.Modal(document.getElementById('modalConfirmarFinalizar'));
const modalConfirmarCancelar = new bootstrap.Modal(document.getElementById('modalConfirmarCancelar'));
const modalConfirmarExcluir = new bootstrap.Modal(document.getElementById('modalConfirmarExcluir'));

// Variáveis para controle de ações
let agendamentoParaFinalizar = null;
let agendamentoParaCancelar = null;
let agendamentoParaExcluir = null;

// Variável para controle de edição
let editandoAgendamentoId = null;

// Cache para serviços e status
let servicos = [];
let status = [];

// Função para carregar serviços do banco
async function carregarServicos() {
    try {
        const response = await fetch(`${API_URL}/servicos`);
        if (!response.ok) throw new Error('Erro ao carregar serviços');
        
        servicos = await response.json();
        preencherSelectServicos();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        mostrarMensagem('Erro ao carregar serviços. Tente novamente.', 'error');
    }
}

// Função para carregar status do banco
async function carregarStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        if (!response.ok) throw new Error('Erro ao carregar status');
        
        status = await response.json();
        preencherSelectStatus();
    } catch (error) {
        console.error('Erro ao carregar status:', error);
        mostrarMensagem('Erro ao carregar status. Tente novamente.', 'error');
    }
}

// Função para preencher select de serviços
function preencherSelectServicos() {
    const selectServico = document.getElementById('servico');
    selectServico.innerHTML = '<option value="" selected disabled>Selecione um serviço</option>';
    
    servicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.textContent = `${servico.nome} - R$ ${servico.preco.toFixed(2)}`;
        selectServico.appendChild(option);
    });
}

// Função para preencher select de status
function preencherSelectStatus() {
    const selectStatus = document.getElementById('status');
    selectStatus.innerHTML = '<option value="" selected disabled>Selecione um status</option>';
    
    status.forEach(st => {
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = st.nome;
        selectStatus.appendChild(option);
    });
}

// Função para obter nome do serviço por ID
function getServicoNome(servicoId) {
    const servico = servicos.find(s => s.id === servicoId);
    return servico ? servico.nome : 'Serviço não encontrado';
}

// Função para obter preço do serviço por ID
function getServicoPreco(servicoId) {
    const servico = servicos.find(s => s.id === servicoId);
    return servico ? servico.preco : 0;
}

// Função para obter nome do status por ID
function getStatusNome(statusId) {
    const st = status.find(s => s.id === statusId);
    return st ? st.nome : 'Status não encontrado';
}

// Função para obter cor do status por ID
function getStatusCor(statusId) {
    const st = status.find(s => s.id === statusId);
    return st ? st.cor : '#666';
}

// Função para validar se a data/hora não é anterior à atual
function validarDataHora(data, horario) {
    const dataHoraAgendamento = new Date(`${data}T${horario}`);
    const agora = new Date();
    
    // Adicionar 1 hora de margem para agendamentos
    agora.setHours(agora.getHours() + 1);
    
    return dataHoraAgendamento >= agora;
}

// Função para formatar telefone (apenas números)
function formatarTelefone(telefone) {
    return telefone.replace(/\D/g, '');
}

// Função para aplicar máscara de telefone
function aplicarMascaraTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    
    if (numeros.length <= 2) {
        return numeros;
    } else if (numeros.length <= 6) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else if (numeros.length <= 10) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    } else {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
}

// Função para validar telefone
function validarTelefone(telefone) {
    const telefoneLimpo = formatarTelefone(telefone);
    return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
}

// Função para obter data atual em formato YYYY-MM-DD
function getDataAtual() {
    return new Date().toISOString().split('T')[0];
}

// Função para mostrar/ocultar loading
function toggleLoading(show) {
    if (show) {
        loadingElement.style.display = 'block';
        agendamentosContainer.innerHTML = '';
    } else {
        loadingElement.style.display = 'none';
    }
}

// Função para carregar agendamentos
async function carregarAgendamentos() {
    toggleLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/agendamentos`);
        if (!response.ok) throw new Error('Erro ao carregar agendamentos');
        
        const agendamentos = await response.json();
        
        // Filtrar apenas agendamentos do dia atual
        const hoje = getDataAtual();
        const agendamentosDoDia = agendamentos.filter(agendamento => agendamento.data === hoje);
        
        exibirAgendamentos(agendamentosDoDia);
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        agendamentosContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Erro ao carregar agendamentos. Verifique se o servidor está rodando na porta 3001.
            </div>
        `;
    } finally {
        toggleLoading(false);
    }
}

// Função para exibir agendamentos na tela
function exibirAgendamentos(agendamentos) {
    if (agendamentos.length === 0) {
        agendamentosContainer.innerHTML = `
            <div class="alert alert-info" role="alert">
                Nenhum agendamento para hoje. Clique em "Novo Agendamento" para criar o primeiro.
            </div>
        `;
        return;
    }

    // Ordenar agendamentos por horário (mais cedo primeiro)
    agendamentos.sort((a, b) => {
        return a.horario.localeCompare(b.horario);
    });

    agendamentosContainer.innerHTML = agendamentos.map(agendamento => {
        const statusNome = getStatusNome(agendamento.statusId);
        const statusCor = getStatusCor(agendamento.statusId);
        const servicoNome = getServicoNome(agendamento.servicoId);
        const servicoPreco = getServicoPreco(agendamento.servicoId);
        const telefoneFormatado = agendamento.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        
        // Definir cor do preço baseada no status
        let precoClass = 'text-success'; // Verde para finalizado (padrão)
        if (agendamento.statusId === '3') { // Cancelado
            precoClass = 'text-danger-cancelado';
        } else if (agendamento.statusId === '1') { // Pendente
            precoClass = 'text-dark';
        }
        
        return `
            <div class="card card-agendamento">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="card-title">${agendamento.cliente}</h5>
                            ${agendamento.telefone ? `<p class="card-text mb-1"><strong>Telefone:</strong> ${telefoneFormatado}</p>` : ''}
                            <p class="card-text mb-1">
                                <strong>Serviço:</strong> ${servicoNome} - <strong class="${precoClass}">R$ ${servicoPreco.toFixed(2)}</strong>
                            </p>
                            <p class="card-text mb-1">
                                <strong>Horário:</strong> ${agendamento.horario}
                            </p>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="status-badge me-3" style="background-color: ${statusCor}20; color: ${statusCor};">${statusNome}</span>
                            <div class="d-flex">
                                ${agendamento.statusId === '1' ? `
                                <button class="btn btn-icon btn-icon-success" onclick="finalizarAgendamento('${agendamento.id}')" title="Finalizar">
                                    <i class="bi bi-check-circle"></i>
                                </button>
                                <button class="btn btn-icon btn-icon-danger" onclick="cancelarAgendamento('${agendamento.id}')" title="Cancelar">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                                ` : ''}
                                <button class="btn btn-icon btn-icon-primary" onclick="editarAgendamento('${agendamento.id}')" title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                ${agendamento.statusId === '1' ? `
                                <button class="btn btn-icon btn-icon-danger" onclick="excluirAgendamento('${agendamento.id}')" title="Excluir">
                                    <i class="bi bi-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Função para formatar data (yyyy-mm-dd para dd/mm/yyyy)
function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para criar um novo agendamento
async function criarAgendamento(agendamento) {
    try {
        const response = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agendamento)
        });
        
        if (!response.ok) throw new Error('Erro ao criar agendamento');
        
        modalAgendamento.hide();
        formAgendamento.reset();
        carregarAgendamentos();
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('Agendamento criado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        mostrarMensagem('Erro ao criar agendamento. Tente novamente.', 'error');
    }
}

// Função para atualizar um agendamento existente
async function atualizarAgendamento(id, agendamento) {
    try {
        const response = await fetch(`${API_URL}/agendamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agendamento)
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar agendamento');
        
        modalAgendamento.hide();
        formAgendamento.reset();
        editandoAgendamentoId = null;
        carregarAgendamentos();
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('Agendamento atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        mostrarMensagem('Erro ao atualizar agendamento. Tente novamente.', 'error');
    }
}

// Função para finalizar um agendamento
async function finalizarAgendamento(id) {
    agendamentoParaFinalizar = id;
    modalConfirmarFinalizar.show();
}

// Função para executar a finalização após confirmação
async function executarFinalizacao() {
    if (!agendamentoParaFinalizar) return;
    
    try {
        // Primeiro, buscar o agendamento atual
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoParaFinalizar}`);
        if (!response.ok) throw new Error('Erro ao buscar agendamento');
        
        const agendamento = await response.json();
        
        // Atualizar apenas o status
        agendamento.statusId = '2'; // Finalizado
        
        const updateResponse = await fetch(`${API_URL}/agendamentos/${agendamentoParaFinalizar}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agendamento)
        });
        
        if (!updateResponse.ok) throw new Error('Erro ao finalizar agendamento');
        
        modalConfirmarFinalizar.hide();
        agendamentoParaFinalizar = null;
        carregarAgendamentos();
        mostrarMensagem('Agendamento finalizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao finalizar agendamento:', error);
        modalConfirmarFinalizar.hide();
        agendamentoParaFinalizar = null;
        mostrarMensagem('Erro ao finalizar agendamento. Tente novamente.', 'error');
    }
}

// Função para cancelar um agendamento
async function cancelarAgendamento(id) {
    agendamentoParaCancelar = id;
    modalConfirmarCancelar.show();
}

// Função para executar o cancelamento após confirmação
async function executarCancelamento() {
    if (!agendamentoParaCancelar) return;
    
    try {
        // Primeiro, buscar o agendamento atual
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoParaCancelar}`);
        if (!response.ok) throw new Error('Erro ao buscar agendamento');
        
        const agendamento = await response.json();
        
        // Atualizar apenas o status
        agendamento.statusId = '3'; // Cancelado
        
        const updateResponse = await fetch(`${API_URL}/agendamentos/${agendamentoParaCancelar}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agendamento)
        });
        
        if (!updateResponse.ok) throw new Error('Erro ao cancelar agendamento');
        
        modalConfirmarCancelar.hide();
        agendamentoParaCancelar = null;
        carregarAgendamentos();
        mostrarMensagem('Agendamento cancelado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        modalConfirmarCancelar.hide();
        agendamentoParaCancelar = null;
        mostrarMensagem('Erro ao cancelar agendamento. Tente novamente.', 'error');
    }
}

// Função para excluir um agendamento
async function excluirAgendamento(id) {
    agendamentoParaExcluir = id;
    modalConfirmarExcluir.show();
}

// Função para executar a exclusão após confirmação
async function executarExclusao() {
    if (!agendamentoParaExcluir) return;
    
    try {
        // Verificar se o agendamento pode ser excluído
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoParaExcluir}`);
        if (!response.ok) throw new Error('Erro ao buscar agendamento');
        
        const agendamento = await response.json();
        
        // Não permitir exclusão de agendamentos finalizados ou cancelados
        if (agendamento.statusId !== '1') {
            modalConfirmarExcluir.hide();
            agendamentoParaExcluir = null;
            mostrarMensagem('Não é possível excluir agendamentos finalizados ou cancelados.', 'error');
            return;
        }
        
        const deleteResponse = await fetch(`${API_URL}/agendamentos/${agendamentoParaExcluir}`, {
            method: 'DELETE'
        });
        
        if (!deleteResponse.ok) throw new Error('Erro ao excluir agendamento');
        
        modalConfirmarExcluir.hide();
        agendamentoParaExcluir = null;
        carregarAgendamentos();
        mostrarMensagem('Agendamento excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        modalConfirmarExcluir.hide();
        agendamentoParaExcluir = null;
        mostrarMensagem('Erro ao excluir agendamento. Tente novamente.', 'error');
    }
}

// Função para editar um agendamento
async function editarAgendamento(id) {
    try {
        const response = await fetch(`${API_URL}/agendamentos/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar agendamento');
        
        const agendamento = await response.json();
        
        // Preencher o formulário com os dados do agendamento
        document.getElementById('clienteNome').value = agendamento.cliente;
        document.getElementById('telefone').value = agendamento.telefone || '';
        document.getElementById('servico').value = agendamento.servicoId;
        document.getElementById('data').value = agendamento.data;
        document.getElementById('horario').value = agendamento.horario;
        document.getElementById('status').value = agendamento.statusId;
        
        // Configurar modo de edição
        editandoAgendamentoId = id;
        document.getElementById('modalAgendamentoLabel').textContent = 'Editar Agendamento';
        document.getElementById('btnSalvarAgendamento').textContent = 'Atualizar Agendamento';
        
        // Mostrar campo de status apenas na edição
        document.getElementById('statusContainer').style.display = 'block';
        
        // Verificar se o agendamento está finalizado ou cancelado
        const isFinalizadoOuCancelado = agendamento.statusId === '2' || agendamento.statusId === '3';
        
        // Desabilitar campos de data e hora se finalizado/cancelado
        const dataInput = document.getElementById('data');
        const horarioInput = document.getElementById('horario');
        
        if (isFinalizadoOuCancelado) {
            dataInput.disabled = true;
            horarioInput.disabled = true;
            
            // Adicionar classes visuais para indicar que está desabilitado
            dataInput.classList.add('form-control-disabled');
            horarioInput.classList.add('form-control-disabled');
            
            // Adicionar tooltip ou indicador visual
            const dataLabel = dataInput.parentElement.querySelector('label');
            const horarioLabel = horarioInput.parentElement.querySelector('label');
            
            if (dataLabel && horarioLabel) {
                dataLabel.innerHTML = '<strong>Data</strong> <small class="text-muted">(não pode ser alterada)</small>';
                horarioLabel.innerHTML = '<strong>Horário</strong> <small class="text-muted">(não pode ser alterado)</small>';
            }
        } else {
            dataInput.disabled = false;
            horarioInput.disabled = false;
            
            // Remover classes visuais
            dataInput.classList.remove('form-control-disabled');
            horarioInput.classList.remove('form-control-disabled');
            
            // Restaurar labels originais
            const dataLabel = dataInput.parentElement.querySelector('label');
            const horarioLabel = horarioInput.parentElement.querySelector('label');
            
            if (dataLabel && horarioLabel) {
                dataLabel.innerHTML = '<strong>Data</strong>';
                horarioLabel.innerHTML = '<strong>Horário</strong>';
            }
        }
        
        // Abrir o modal
        modalAgendamento.show();
    } catch (error) {
        console.error('Erro ao carregar agendamento para edição:', error);
        mostrarMensagem('Erro ao carregar agendamento. Tente novamente.', 'error');
    }
}

// Função para mostrar mensagens para o usuário
function mostrarMensagem(mensagem, tipo) {
    // Remover mensagens anteriores
    const mensagensAntigas = document.querySelectorAll('.alert-toast');
    mensagensAntigas.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const toast = document.createElement('div');
    toast.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-toast position-fixed`;
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '1060';
    toast.style.minWidth = '300px';
    toast.textContent = mensagem;
    
    document.body.appendChild(toast);
    
    // Remover automaticamente após 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Event Listeners
btnSalvarAgendamento.addEventListener('click', async () => {
    const cliente = document.getElementById('clienteNome').value.trim();
    const telefone = formatarTelefone(document.getElementById('telefone').value);
    const servicoId = document.getElementById('servico').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const statusId = document.getElementById('status').value;
    
    // Validações
    if (!cliente || !servicoId || !data || !horario) {
        mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (!validarTelefone(telefone)) {
        mostrarMensagem('Por favor, insira um telefone válido (10 ou 11 dígitos).', 'error');
        return;
    }
    
    if (!validarDataHora(data, horario)) {
        mostrarMensagem('Não é possível agendar para uma data/hora anterior à atual.', 'error');
        return;
    }
    
    const agendamento = {
        cliente,
        telefone,
        servicoId,
        data,
        horario,
        statusId: editandoAgendamentoId ? statusId : '1' // Sempre pendente para novos agendamentos
    };
    
    if (editandoAgendamentoId) {
        // Validação adicional para edição: não permitir voltar para pendente se já foi finalizado/cancelado
        const agendamentoAtual = await fetch(`${API_URL}/agendamentos/${editandoAgendamentoId}`).then(r => r.json());
        if (agendamentoAtual && agendamentoAtual.statusId !== '1' && statusId === '1') {
            mostrarMensagem('Não é possível alterar o status para pendente após ser finalizado ou cancelado.', 'error');
            return;
        }
        
        atualizarAgendamento(editandoAgendamentoId, agendamento);
    } else {
        criarAgendamento(agendamento);
    }
});

// Event Listeners para os modais de confirmação
document.getElementById('btnConfirmarFinalizar').addEventListener('click', executarFinalizacao);
document.getElementById('btnConfirmarCancelar').addEventListener('click', executarCancelamento);
document.getElementById('btnConfirmarExcluir').addEventListener('click', executarExclusao);

// Resetar o modal quando for fechado
document.getElementById('modalAgendamento').addEventListener('hidden.bs.modal', () => {
    formAgendamento.reset();
    editandoAgendamentoId = null;
    document.getElementById('modalAgendamentoLabel').textContent = 'Novo Agendamento';
    document.getElementById('btnSalvarAgendamento').textContent = 'Salvar Agendamento';
    document.getElementById('statusContainer').style.display = 'none';
    
    // Reabilitar campos de data e hora
    const dataInput = document.getElementById('data');
    const horarioInput = document.getElementById('horario');
    
    dataInput.disabled = false;
    horarioInput.disabled = false;
    
    // Remover classes visuais
    dataInput.classList.remove('form-control-disabled');
    horarioInput.classList.remove('form-control-disabled');
    
    // Restaurar labels originais
    const dataLabel = dataInput.parentElement.querySelector('label');
    const horarioLabel = horarioInput.parentElement.querySelector('label');
    
    if (dataLabel && horarioLabel) {
        dataLabel.innerHTML = '<strong>Data</strong>';
        horarioLabel.innerHTML = '<strong>Horário</strong>';
    }
});

// Máscara para telefone com formatação automática
document.getElementById('telefone').addEventListener('input', function(e) {
    let value = e.target.value;
    
    // Remover todos os caracteres não numéricos
    const numeros = value.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    const numerosLimitados = numeros.slice(0, 11);
    
    // Aplicar máscara
    const telefoneFormatado = aplicarMascaraTelefone(numerosLimitados);
    
    // Atualizar o valor do campo
    e.target.value = telefoneFormatado;
});

// Event listener para colar telefone
document.getElementById('telefone').addEventListener('paste', function(e) {
    // Aguardar um pouco para o valor ser colado
    setTimeout(() => {
        let value = e.target.value;
        
        // Remover todos os caracteres não numéricos
        const numeros = value.replace(/\D/g, '');
        
        // Limitar a 11 dígitos
        const numerosLimitados = numeros.slice(0, 11);
        
        // Aplicar máscara
        const telefoneFormatado = aplicarMascaraTelefone(numerosLimitados);
        
        // Atualizar o valor do campo
        e.target.value = telefoneFormatado;
    }, 10);
});

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', async () => {
    // Carregar serviços e status primeiro
    await Promise.all([carregarServicos(), carregarStatus()]);
    
    // Depois carregar agendamentos
    carregarAgendamentos();
    
    // Configurar data mínima para hoje
    const dataInput = document.getElementById('data');
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.min = hoje;
    
    // Configurar horário mínimo para o horário atual (apenas para hoje)
    const horarioInput = document.getElementById('horario');
    dataInput.addEventListener('change', () => {
        if (dataInput.value === hoje) {
            const agora = new Date();
            const horas = agora.getHours().toString().padStart(2, '0');
            const minutos = agora.getMinutes().toString().padStart(2, '0');
            horarioInput.min = `${horas}:${minutos}`;
        } else {
            horarioInput.min = '00:00';
        }
    });
});