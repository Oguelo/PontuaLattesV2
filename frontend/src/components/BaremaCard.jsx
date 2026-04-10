import React from 'react';

// --- Funções Auxiliares (trazidas do seu app.js antigo) ---
const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const getMaximumAllowedLabel = (title, titulacao) => {
    if (title === 'I - Titulação') {
        const nivelMaximo = titulacao?.nivel_maximo || 'Não identificado';
        if (nivelMaximo === 'Doutorado') return '12';
        if (nivelMaximo === 'Mestrado') return '8';
        return '12 (Doutorado) ou 8 (Mestrado)';
    }
    if (title === 'II - Produção') return '30';
    if (title === 'III - Formação de recursos humanos') return '12';
    if (title === 'IV - Participação em eventos/comitê') return '6';
    return '-';
};

const buildTitulationSection = (titulacao) => {
    const nivelMaximo = titulacao?.nivel_maximo || 'Não identificado';
    const isDoutorado = nivelMaximo === 'Doutorado';
    const isMestrado = nivelMaximo === 'Mestrado';
    return {
        itens: {
            Doutorado: { quantidade: isDoutorado ? 1 : 0, peso: 12, pontos: isDoutorado ? 12 : 0 },
            Mestrado: { quantidade: isMestrado ? 1 : 0, peso: 8, pontos: isMestrado ? 8 : 0 },
        },
        subtotal_bruto: titulacao?.subtotal_bruto || 0,
        subtotal_limitado: titulacao?.subtotal_limitado || 0,
    };
};

// --- Sub-componente: Renderiza uma tabela individual ---
const BaremaSection = ({ title, section, maxLabel }) => {
    const itens = Object.entries(section?.itens || {});
    
    return (
        <div className="barema-card">
            <div className="barema-card-header">
                <h3>{title}</h3>
                <div className="barema-card-total">
                    <span>Pontuação encontrada: {formatNumber(section?.subtotal_bruto)}</span>
                    <span>Máximo permitido: {maxLabel}</span>
                </div>
            </div>
            {itens.length > 0 ? (
                <div className="barema-table-wrapper">
                    <table className="barema-table">
                        <thead>
                            <tr>
                                <th>Critério</th>
                                <th>Qtd.</th>
                                <th>Peso</th>
                                <th>Pontos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map(([label, item]) => (
                                <tr key={label}>
                                    <td>{label}</td>
                                    <td>{formatNumber(item.quantidade)}</td>
                                    <td>{formatNumber(item.peso)}</td>
                                    <td>{formatNumber(item.pontos)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="barema-empty">Sem itens detalhados.</p>
            )}
        </div>
    );
};

// --- Componente Principal ---
export default function BaremaCard({ barema }) {
    if (!barema) return null;

    const observacoes = barema.observacoes || [];

    return (
        <article className="panel details-card">
            <h2>Barema docente</h2>
            
            {/* Grid de Destaques Superiores */}
            <div className="barema-highlight-grid">
                <div className="barema-highlight-item">
                    <span className="barema-highlight-label">Titulação</span>
                    <strong>{formatNumber(barema.titulacao?.subtotal_limitado)}</strong>
                </div>
                <div className="barema-highlight-item">
                    <span className="barema-highlight-label">Produção</span>
                    <strong>{formatNumber(barema.producao?.subtotal_limitado)}</strong>
                </div>
                <div className="barema-highlight-item">
                    <span className="barema-highlight-label">Formação RH</span>
                    <strong>{formatNumber(barema.formacao_recursos_humanos?.subtotal_limitado)}</strong>
                </div>
                <div className="barema-highlight-item">
                    <span className="barema-highlight-label">Eventos/comitê</span>
                    <strong>{formatNumber(barema.participacao_eventos_comite?.subtotal_limitado)}</strong>
                </div>
                <div className="barema-highlight-item barema-highlight-total">
                    <span className="barema-highlight-label">Total final</span>
                    <strong>{formatNumber(barema.total_limitado)}</strong>
                </div>
            </div>

            {/* As 4 Tabelas */}
            <div className="barema-sections">
                <BaremaSection 
                    title="I - Titulação" 
                    section={buildTitulationSection(barema.titulacao || {})} 
                    maxLabel={getMaximumAllowedLabel('I - Titulação', barema.titulacao || {})} 
                />
                <BaremaSection 
                    title="II - Produção" 
                    section={barema.producao || {}} 
                    maxLabel={getMaximumAllowedLabel('II - Produção', barema.titulacao || {})} 
                />
                <BaremaSection 
                    title="III - Formação de recursos humanos" 
                    section={barema.formacao_recursos_humanos || {}} 
                    maxLabel={getMaximumAllowedLabel('III - Formação de recursos humanos', barema.titulacao || {})} 
                />
                <BaremaSection 
                    title="IV - Participação em eventos/comitê" 
                    section={barema.participacao_eventos_comite || {}} 
                    maxLabel={getMaximumAllowedLabel('IV - Participação em eventos/comitê', barema.titulacao || {})} 
                />
            </div>

            {/* Lista de Observações (se houver) */}
            {observacoes.length > 0 && (
                <div className="barema-observations">
                    <h3>Observações</h3>
                    <ul className="details-list">
                        {observacoes.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}