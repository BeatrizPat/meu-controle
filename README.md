# Meu Controle — versão 4.0

Aplicativo PWA de controle financeiro pessoal. Não utiliza backend, conta ou API. Os registros ficam no IndexedDB do navegador/aparelho.

## Recursos
- Cadastro, edição e exclusão de despesas.
- Crédito, débito, PIX, dinheiro e transferência.
- Cadastro de vários cartões com limite, dia de fechamento, dia de vencimento e cor.
- Compras no crédito vinculadas a um cartão.
- Cálculo da fatura conforme o fechamento do cartão.
- Compras parceladas distribuídas nas faturas correspondentes, inclusive quando cadastradas retroativamente.
- Projeção de seis meses sempre a partir do mês atual; meses anteriores permanecem no histórico.
- Gastos recorrentes mensais, com data inicial e data final opcional.
- Resumo mensal, gastos por categoria, orçamentos e projeção.
- Gráfico dos últimos seis meses e comparação com o mês anterior.
- Detalhamento de fatura por cartão e histórico mensal.
- Backup JSON e restauração, incluindo os gastos recorrentes.
- Interface dark, responsiva e suporte offline via service worker.

## Histórico e projeção
Uma despesa cadastrada com data passada é alocada nos meses correspondentes à data da compra e às parcelas. A área de previsão, porém, sempre começa no mês atual e mostra os próximos seis meses. Assim, parcelas que ainda vencem no mês atual ou nos meses seguintes continuam na previsão; parcelas já encerradas ficam apenas no histórico.

## Gastos recorrentes
Ao cadastrar uma despesa, marque “Repetir mensalmente”. Informe a data inicial e, se desejar, uma data final. Se deixar a data final vazia, a recorrência permanece ativa até ser excluída. Cada ocorrência é gerada mensalmente com base no dia da data inicial; em meses mais curtos, usa-se o último dia disponível. Para despesas no crédito, cada ocorrência respeita o fechamento do cartão e aparece na fatura correspondente. A recorrência é armazenada como uma regra, não como cópias duplicadas dos gastos.

## Como calcular a fatura
A compra entra na fatura do mês do fechamento se for realizada até o dia de fechamento (inclusive). Compras realizadas depois do fechamento entram na próxima fatura. Por exemplo, para um cartão que fecha dia 10, uma compra no dia 8 entra na fatura daquele ciclo e uma compra no dia 11 entra na próxima. Cada parcela subsequente é alocada nos meses seguintes.
O vencimento é calculado usando o dia configurado: se o dia de vencimento for igual ou anterior ao fechamento, considera-se o mês seguinte ao fechamento; caso contrário, considera-se o mesmo mês. Bancos podem ter regras específicas para compras exatamente no dia de fechamento; confira a regra do emissor do cartão.
O modelo não inclui pagamento/baixa de fatura, juros, estornos ou compras internacionais.

## Como testar
É necessário servir os arquivos por HTTP. Com Python:
```bash
python -m http.server 8000
```
Abra `http://localhost:8000`.

## Instalar no iPhone sem custo
1. Crie um repositório no GitHub e envie todos os arquivos desta pasta para a raiz.
2. Em Settings → Pages, habilite publicação a partir da branch `main`, pasta `/root`.
3. Abra o endereço HTTPS gerado no Safari do iPhone.
4. Toque em Compartilhar → Adicionar à Tela de Início.

O primeiro carregamento exige internet. Depois de armazenados pelo service worker, os arquivos do app podem abrir offline. Os dados financeiros permanecem no armazenamento local do iPhone e não são enviados ao GitHub ou a servidor.

## Backup e privacidade
- Exporte backups regularmente. Apagar dados do site/navegador pode apagar os registros locais.
- O backup JSON contém dados financeiros em texto legível; guarde-o em local privado.
- Restaurar substitui os dados atuais.
- Backups anteriores à V4 continuam aceitos; serão importados sem recorrências.
- Não há sincronização automática entre aparelhos.
- Compras antigas de crédito criadas antes do cadastro de cartões permanecem sem cartão associado; edite-as para vinculá-las a um cartão e calcular a fatura conforme o fechamento.
