# Meu Controle — versão 1.0

Aplicativo web instalável (PWA) para controle financeiro pessoal. Não utiliza conta, backend, API ou biblioteca externa de JavaScript. Os registros ficam no IndexedDB do navegador/aparelho.

## Recursos
- Cadastro, edição e exclusão de despesas.
- Crédito, débito, PIX, dinheiro e transferência.
- Parcelamento de compras no crédito (1 a 24 parcelas).
- Resumo mensal, categorias, orçamentos e projeção de seis meses.
- Histórico mensal.
- Backup JSON e restauração.
- Interface dark responsiva e suporte offline via service worker.

## Como testar no computador
É necessário servir os arquivos por HTTP (não abrir `index.html` diretamente). Com Python instalado:
```bash
python -m http.server 8000
```
Abra `http://localhost:8000`.

## Como instalar no iPhone sem pagar
Para instalação PWA no iPhone, publique estes arquivos em um endereço HTTPS. Uma opção é GitHub Pages, que oferece hospedagem estática gratuita:
1. Crie um repositório no GitHub e envie todos os arquivos desta pasta para a raiz.
2. Em Settings → Pages, habilite a publicação a partir da branch principal (`main`, `/root`).
3. Abra o endereço HTTPS gerado no Safari do iPhone.
4. Toque em Compartilhar → Adicionar à Tela de Início.

A publicação hospeda apenas os arquivos do aplicativo. Os gastos não são enviados ao GitHub nem a um servidor: permanecem no armazenamento local do Safari/PWA daquele iPhone.

## Importante sobre privacidade e backup
- O armazenamento local pode ser apagado se os dados do site forem removidos, se o navegador for redefinido ou em certas situações de limpeza de armazenamento. Exporte backups regularmente.
- O backup contém dados financeiros em texto JSON. Guarde-o em local privado.
- A restauração substitui os registros e orçamentos locais atuais.
- Nesta versão, os dados não são sincronizados entre aparelhos.
- O primeiro carregamento exige internet para abrir o endereço publicado; depois que o service worker armazenar os arquivos, o app pode abrir offline.
- A fonte DM Sans é carregada do Google Fonts quando há internet; o aplicativo usa fontes do sistema como alternativa.

## Modelo de cálculo
Cada compra é salva uma única vez. Para compras no crédito, o valor é dividido em parcelas mensais iguais em centavos, distribuindo eventual diferença de centavos nas primeiras parcelas. A projeção inclui as parcelas futuras. O primeiro vencimento é considerado no mês da compra. Esta primeira versão não modela dia de fechamento/vencimento de fatura, juros ou estornos.
