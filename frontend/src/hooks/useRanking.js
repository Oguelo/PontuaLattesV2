import { useState, useEffect } from 'react';

export function useRanking() {
  const [topPesquisas, setTopPesquisas] = useState([]);

  useEffect(() => {
    const historicoSalvo = localStorage.getItem('rankingLattes');
    if (historicoSalvo) {
      setTopPesquisas(JSON.parse(historicoSalvo));
    }
  }, []);

  const atualizarRanking = (novoDado, termoPesquisado) => {
    const pedacosUrl = termoPesquisado.split('/');
    const idLimpo = pedacosUrl[pedacosUrl.length - 1].trim();

    setTopPesquisas((rankingAntigo) => {
      const novaPesquisa = {
        nome: novoDado.nome || 'Não identificado',
        pontuacao: novoDado.barema.total_limitado,
        id: idLimpo 
      };

      const listaSemDuplicata = rankingAntigo.filter(item => item.id !== novaPesquisa.id);

      const novaLista = [...listaSemDuplicata, novaPesquisa]
        .sort((a, b) => b.pontuacao - a.pontuacao)
        .slice(0, 5);

      localStorage.setItem('rankingLattes', JSON.stringify(novaLista));

      return novaLista;
    });
  };

  const limparHistorico = () => {
    localStorage.removeItem('rankingLattes');
    setTopPesquisas([]);
  };

  return { topPesquisas, atualizarRanking, limparHistorico };
}