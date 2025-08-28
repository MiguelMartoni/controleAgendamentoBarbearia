// URL base da API
const API_URL = 'http://localhost:3001';

// Elementos DOM
const historicoContainer = document.getElementById('historico-container');
const futurosContainer = document.getElementById('futuros-container');
const loadingElement = document.querySelector('.loading');
const dataInicioInput = document.getElementById('dataInicio');
const dataFimInput = document.getElementById('dataFim');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnLimparFiltros = document.getElementById('btnLimparFiltros');
const periodoIndicador = document.getElementById('periodo-indicador');

// Elementos de estatísticas
const totalAgendamentos = document.getElementById('totalAgendamentos');
const totalFinalizados = document.getElementById('totalFinalizados');
const totalCancelados = document.getElementById('totalCancelados');
const totalPendentes = document.getElementById('totalPendentes');

// Cache para serviços e status
let servicos = [];
let status = [];

// Função para carregar serviços do banco
async function carregarServicos() {
    try {
        const response = await fetch(`${API_URL}/servicos`);
        if (!response.ok) throw new Error('Erro ao carregar serviços');
        
        servicos = await response.json();
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
    } catch (error) {
        console.error('Erro ao carregar status:', error);
        mostrarMensagem('Erro ao carregar status. Tente novamente.', 'error');
    }
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

// Função para mostrar/ocultar loading
function toggleLoading(show) {
    if (show) {
        loadingElement.style.display = 'block';
        historicoContainer.innerHTML = '';
    } else {
        loadingElement.style.display = 'none';
    }
}

// Função para formatar data (yyyy-mm-dd para dd/mm/yyyy)
function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para obter data atual em formato YYYY-MM-DD
function getDataAtual() {
    return new Date().toISOString().split('T')[0];
}

// Função para filtrar agendamentos por data
function filtrarAgendamentosPorData(agendamentos, dataInicio, dataFim) {
    if (!dataInicio && !dataFim) {
        // Se não há filtros, retorna apenas agendamentos anteriores ao dia atual
        const hoje = getDataAtual();
        return agendamentos.filter(agendamento => agendamento.data < hoje);
    }

    return agendamentos.filter(agendamento => {
        const dataAgendamento = agendamento.data;
        
        if (dataInicio && dataFim) {
            return dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
        } else if (dataInicio) {
            return dataAgendamento >= dataInicio;
        } else if (dataFim) {
            return dataAgendamento <= dataFim;
        }
        
        return true;
    });
}

// Função para obter agendamentos futuros
function obterAgendamentosFuturos(agendamentos) {
    const hoje = getDataAtual();
    return agendamentos.filter(agendamento => agendamento.data > hoje);
}

// Função para calcular estatísticas
function calcularEstatisticas(agendamentos) {
    const estatisticas = {
        total: agendamentos.length,
        finalizados: 0,
        cancelados: 0,
        pendentes: 0
    };

    agendamentos.forEach(agendamento => {
        switch (agendamento.statusId) {
            case '1': // Pendente
                estatisticas.pendentes++;
                break;
            case '2': // Finalizado
                estatisticas.finalizados++;
                break;
            case '3': // Cancelado
                estatisticas.cancelados++;
                break;
        }
    });

    return estatisticas;
}

// Função para atualizar estatísticas na tela
function atualizarEstatisticas(estatisticas) {
    totalAgendamentos.textContent = estatisticas.total;
    totalFinalizados.textContent = estatisticas.finalizados;
    totalCancelados.textContent = estatisticas.cancelados;
    totalPendentes.textContent = estatisticas.pendentes;
}

// Função para atualizar indicador de período
function atualizarIndicadorPeriodo(dataInicio, dataFim) {
    if (dataInicio || dataFim) {
        let texto = 'Período: ';
        if (dataInicio && dataFim) {
            texto += `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
        } else if (dataInicio) {
            texto += `A partir de ${formatarData(dataInicio)}`;
        } else if (dataFim) {
            texto += `Até ${formatarData(dataFim)}`;
        }
        periodoIndicador.textContent = texto;
        periodoIndicador.style.display = 'inline-block';
    } else {
        periodoIndicador.style.display = 'none';
    }
}

// Função para carregar histórico
async function carregarHistorico() {
    toggleLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/agendamentos`);
        if (!response.ok) throw new Error('Erro ao carregar agendamentos');
        
        const agendamentos = await response.json();
        
        // Aplicar filtros
        const dataInicio = dataInicioInput.value;
        const dataFim = dataFimInput.value;
        const agendamentosFiltrados = filtrarAgendamentosPorData(agendamentos, dataInicio, dataFim);
        
        // Obter agendamentos futuros
        const agendamentosFuturos = obterAgendamentosFuturos(agendamentos);
        
        // Calcular e exibir estatísticas
        const estatisticas = calcularEstatisticas(agendamentosFiltrados);
        atualizarEstatisticas(estatisticas);
        
        // Atualizar indicador de período
        atualizarIndicadorPeriodo(dataInicio, dataFim);
        
        // Exibir agendamentos
        exibirHistorico(agendamentosFiltrados);
        exibirAgendamentosFuturos(agendamentosFuturos);
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historicoContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Erro ao carregar histórico. Verifique se o servidor está rodando na porta 3001.
            </div>
        `;
    } finally {
        toggleLoading(false);
    }
}

// Função para exibir histórico na tela
function exibirHistorico(agendamentos) {
    if (agendamentos.length === 0) {
        historicoContainer.innerHTML = `
            <div class="alert alert-info" role="alert">
                Nenhum agendamento encontrado no período selecionado.
            </div>
        `;
        return;
    }

    // Ordenar agendamentos por data e horário (mais recentes primeiro)
    agendamentos.sort((a, b) => {
        const dataA = new Date(`${a.data}T${a.horario}`);
        const dataB = new Date(`${b.data}T${b.horario}`);
        return dataB - dataA;
    });

    historicoContainer.innerHTML = agendamentos.map(agendamento => {
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
                                <strong>Data:</strong> ${formatarData(agendamento.data)} - <strong>Horário:</strong> ${agendamento.horario}
                            </p>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="status-badge me-3" style="background-color: ${statusCor}20; color: ${statusCor};">${statusNome}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Função para exibir agendamentos futuros
function exibirAgendamentosFuturos(agendamentos) {
    if (agendamentos.length === 0) {
        futurosContainer.innerHTML = `
            <div class="alert alert-info" role="alert">
                Nenhum agendamento futuro encontrado.
            </div>
        `;
        return;
    }

    // Ordenar agendamentos por data e horário (mais próximos primeiro)
    agendamentos.sort((a, b) => {
        const dataA = new Date(`${a.data}T${a.horario}`);
        const dataB = new Date(`${b.data}T${b.horario}`);
        return dataA - dataB;
    });

    futurosContainer.innerHTML = agendamentos.map(agendamento => {
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
                                <strong>Data:</strong> ${formatarData(agendamento.data)} - <strong>Horário:</strong> ${agendamento.horario}
                            </p>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="status-badge me-3" style="background-color: ${statusCor}20; color: ${statusCor};">${statusNome}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
btnFiltrar.addEventListener('click', carregarHistorico);

btnLimparFiltros.addEventListener('click', () => {
    dataInicioInput.value = '';
    dataFimInput.value = '';
    carregarHistorico();
});

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', async () => {
    // Carregar serviços e status primeiro
    await Promise.all([carregarServicos(), carregarStatus()]);
    
    // Carregar histórico inicial
    carregarHistorico();
}); 