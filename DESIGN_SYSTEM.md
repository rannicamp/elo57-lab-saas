# 🎨 Studio 57 — Design System Oficial
> Versão 1.0 — Fevereiro 2026  
> **REGRA SUPREMA:** Este arquivo é a lei. Antes de criar qualquer botão, ícone, tabela ou input, consulte aqui o código exato a ser copiado. Nenhuma improvisação é permitida.

---

## 📋 ÍNDICE
1. [Ícones Padronizados](#1-ícones-padronizados)
2. [Botões de Ação](#2-botões-de-ação)
3. [Inputs e Formulários](#3-inputs-e-formulários)
4. [Tabelas e Listas](#4-tabelas-e-listas)
5. [Status Badges](#5-status-badges)
6. [Modais](#6-modais)
7. [Cards e Painéis](#7-cards-e-painéis)
8. [Cabeçalhos de Página](#8-cabeçalhos-de-página)
9. [Empty States](#9-empty-states)
10. [KPI Cards](#10-kpi-cards)
11. [Paleta de Cores](#11-paleta-de-cores)
12. [Tipografia](#12-tipografia)

---

## 1. ÍCONES PADRONIZADOS

> **REGRA:** Cada ação tem UM único ícone em todo o sistema. Nunca use variações.

### Import obrigatório (copie sempre desta lista):
```javascript
import {
    // AÇÕES CRUD
    faEdit,         // ← EDITAR (único, em todo o sistema — padrão do módulo Contatos)
    faTrash,        // ← EXCLUIR (único, em todo o sistema)
    faPlus,         // ← ADICIONAR / CRIAR
    faSave,         // ← SALVAR
    faCheck,        // ← CONFIRMAR / CONCLUIR
    faTimes,        // ← CANCELAR / FECHAR (X)
    faCopy,         // ← DUPLICAR / COPIAR

    // VISUALIZAÇÃO
    faEye,          // ← VER DETALHES
    faEyeSlash,     // ← OCULTAR
    faSearch,       // ← BUSCAR / PESQUISAR
    faFilter,       // ← FILTRAR
    faChevronDown,  // ← EXPANDIR / DROPDOWN
    faChevronUp,    // ← RECOLHER
    faChevronLeft,  // ← VOLTAR / ANTERIOR
    faChevronRight, // ← AVANÇAR / PRÓXIMO

    // ESTADO / FEEDBACK
    faSpinner,           // ← CARREGANDO (sempre com spin={true})
    faExclamationTriangle, // ← ALERTA / ATENÇÃO
    faCheckCircle,       // ← SUCESSO
    faTimesCircle,       // ← ERRO

    // NAVEGAÇÃO E LAYOUT
    faBars,         // ← MENU HAMBÚRGUER
    faArrowLeft,    // ← BOTÃO VOLTAR
    faEllipsisV,    // ← MAIS OPÇÕES (kebab menu)

    // ITENS ESPECÍFICOS DO DOMÍNIO (use conforme necessário)
    faUser,         // ← CONTATO / PESSOA
    faBuilding,     // ← EMPRESA / EMPREENDIMENTO
    faFileSignature,// ← CONTRATO / DOCUMENTO
    faHandshake,    // ← VENDA / NEGÓCIO
    faCalendarAlt,  // ← DATA / CALENDÁRIO
    faMoneyBillWave,// ← FINANCEIRO / DINHEIRO
    faChartLine,    // ← KPI / CRESCIMENTO
    faPrint,        // ← IMPRIMIR

} from '@fortawesome/free-solid-svg-icons';
```

### Mapeamento de ícones proibidos e seus substitutos:

| ❌ PROIBIDO | ✅ SUBSTITUTO | MOTIVO |
|-------------|---------------|--------|
| `faPen` | `faEdit` | Padrão é faEdit (Módulo Contatos) |
| `faPenToSquare` | `faEdit` | Padrão é faEdit (Módulo Contatos) |
| `faPencilAlt` | `faEdit` | Duplicado desnecessário |
| `faTrashAlt` | `faTrash` | Duplicado desnecessário |
| `faXmark` | `faTimes` | Padronizar fechar/cancelar |

---

## 2. BOTÕES DE AÇÃO

> **PRINCÍPIO FUNDAMENTAL:** Existem 2 famílias de botões de ação em tabelas. Escolha a certa para o contexto.

---

### 🔵 FAMÍLIA A — Ícones Simples Coloridos (PADRÃO OURO — use na maioria dos módulos)
> Referência: `ContatoList.js` e `ContratoList.js`
> **Quando usar:** Listagens principais onde as ações são a identidade do botão.
> Os ícones ficam **visíveis apenas no hover** da linha (classe `opacity-0 group-hover:opacity-100`).

```jsx
// A linha da tabela DEVE ter a classe "group"
<tr className="hover:bg-blue-50/20 transition-colors group cursor-pointer">
  {/* ... colunas ... */}
  <td className="px-4 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

      {/* VER / ABRIR — AZUL */}
      <button onClick={() => handleView(item)} title="Ver detalhes"
        className="text-blue-500 hover:text-blue-700 p-2 transition-colors">
        <FontAwesomeIcon icon={faEye} />
      </button>

      {/* EDITAR — AZUL */}
      <button onClick={() => handleEdit(item)} title="Editar"
        className="text-blue-500 hover:text-blue-700 p-2 transition-colors">
        <FontAwesomeIcon icon={faEdit} />
      </button>

      {/* DUPLICAR / COPIAR — VERDE */}
      <button onClick={() => handleDuplicate(item)} title="Duplicar"
        className="text-green-500 hover:text-green-700 p-2 transition-colors">
        <FontAwesomeIcon icon={faCopy} />
      </button>

      {/* EXCLUIR — VERMELHO */}
      <button onClick={() => handleDelete(item.id)} title="Excluir" disabled={isDeleting}
        className="text-red-500 hover:text-red-700 p-2 transition-colors disabled:opacity-40">
        <FontAwesomeIcon icon={faTrash} />
      </button>

    </div>
  </td>
</tr>
```

### Tabela de cores da Família A:
| Ação | Cor Normal | Cor Hover | Classe completa |
|------|-----------|-----------|------------------|
| Ver/Abrir | `text-blue-500` | `text-blue-700` | `text-blue-500 hover:text-blue-700 p-2 transition-colors` |
| Editar | `text-blue-500` | `text-blue-700` | `text-blue-500 hover:text-blue-700 p-2 transition-colors` |
| Duplicar | `text-green-500` | `text-green-700` | `text-green-500 hover:text-green-700 p-2 transition-colors` |
| Excluir | `text-red-500` | `text-red-700` | `text-red-500 hover:text-red-700 p-2 transition-colors` |
| Imprimir | `text-purple-500` | `text-purple-700` | `text-purple-500 hover:text-purple-700 p-2 transition-colors` |
| Download | `text-teal-500` | `text-teal-700` | `text-teal-500 hover:text-teal-700 p-2 transition-colors` |

---

### ⬜ FAMÍLIA B — Botões com Caixinha (bordas e fundo)
> Referência: `CronogramaFinanceiro.js`
> **Quando usar:** Dentro de painéis de detalhe, drawers, formulários — onde os botões precisam de mais peso visual.

```jsx
<div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">

  {/* EDITAR — caixinha azul no hover */}
  <button title="Editar"
    className="w-7 h-7 inline-flex items-center justify-center rounded-md
               bg-white border border-gray-200 text-gray-400
               hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50
               transition-all shadow-sm">
    <FontAwesomeIcon icon={faEdit} size="xs" />
  </button>

  {/* DUPLICAR — caixinha verde no hover */}
  <button title="Duplicar"
    className="w-7 h-7 inline-flex items-center justify-center rounded-md
               bg-white border border-gray-200 text-gray-400
               hover:text-green-600 hover:border-green-300 hover:bg-green-50
               transition-all shadow-sm">
    <FontAwesomeIcon icon={faCopy} size="xs" />
  </button>

  {/* EXCLUIR — caixinha vermelha no hover */}
  <button title="Excluir"
    className="w-7 h-7 inline-flex items-center justify-center rounded-md
               bg-white border border-gray-200 text-gray-400
               hover:text-red-600 hover:border-red-300 hover:bg-red-50
               transition-all shadow-sm">
    <FontAwesomeIcon icon={faTrash} size="xs" />
  </button>

</div>
```

---

### 2.1 — Botão Primário (Ação Principal da Página)
```jsx
// USO: "+ Novo", "Salvar", "Criar" — sempre no canto superior direito da página
<button
  onClick={handleAction}
  disabled={isLoading}
  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold
             hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-400
             disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
>
  <FontAwesomeIcon icon={isLoading ? faSpinner : faPlus} spin={isLoading} />
  Novo Registro
</button>
```

### 2.2 — Botão Secundário (Filtros, Exportar, Cancelar)
```jsx
// USO: ao lado do botão primário, ou como alternativa
<button
  onClick={handleSecondaryAction}
  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md
             text-sm font-bold hover:bg-gray-50 transition-colors flex items-center
             gap-2 shadow-sm"
>
  <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
  Filtros
</button>

// VARIANTE ATIVO (quando filtros estão ligados):
className="bg-blue-50 border border-blue-300 text-blue-600 px-4 py-2 rounded-md
           text-sm font-bold hover:bg-blue-100 transition-colors flex items-center
           gap-2 shadow-sm"
```

### 2.3 — Botão de Perigo (Exclusão com Confirmação)
```jsx
<button
  onClick={handleDangerAction}
  disabled={isLoading}
  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold
             hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed
             transition-colors flex items-center gap-2"
>
  <FontAwesomeIcon icon={faTrash} />
  Excluir Permanentemente
</button>
```

### 2.4 — Botão de Fechar Modal (X)
```jsx
// USO: canto superior direito de TODOS os modais
<button
  onClick={onClose}
  title="Fechar"
  className="text-white/70 hover:text-white transition-colors p-1 rounded-md
             hover:bg-white/10"
>
  <FontAwesomeIcon icon={faTimes} size="lg" />
</button>
```

---

## 3. INPUTS E FORMULÁRIOS

### 3.1 — Input de Texto Padrão
```jsx
<div>
  <label
    htmlFor="campo_id"
    className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5"
  >
    Nome do Campo
  </label>
  <input
    id="campo_id"
    type="text"
    placeholder="Digite aqui..."
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm
               font-medium text-gray-700 focus:outline-none focus:ring-1
               focus:ring-blue-500 focus:border-blue-500 transition-colors
               placeholder-gray-400"
  />
</div>
```

### 3.2 — Select (Dropdown)
```jsx
<div>
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
    Status
  </label>
  <select
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm
               font-medium text-gray-700 focus:outline-none focus:ring-1
               focus:ring-blue-500 transition-colors"
  >
    <option value="">— Selecione —</option>
    <option value="ativo">Ativo</option>
  </select>
</div>
```

### 3.3 — Busca Global (com ícone)
```jsx
<div className="relative flex-grow min-w-[260px]">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm" />
  </div>
  <input
    type="text"
    placeholder="Buscar..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md
               text-sm font-medium text-gray-700 focus:outline-none focus:ring-1
               focus:ring-blue-500 transition-colors"
  />
  {searchTerm && (
    <button
      onClick={() => setSearchTerm('')}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400
                 hover:text-red-500 transition-colors"
    >
      <FontAwesomeIcon icon={faTimes} size="xs" />
    </button>
  )}
</div>
```

### 3.4 — Textarea
```jsx
<div>
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
    Observações
  </label>
  <textarea
    rows={4}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Escreva aqui..."
    className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm
               font-medium text-gray-700 focus:outline-none focus:ring-1
               focus:ring-blue-500 transition-colors resize-none"
  />
</div>
```

---

## 4. TABELAS E LISTAS

### 4.1 — Tabela Padrão Completa
```jsx
<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-100 text-sm">
      {/* CABEÇALHO */}
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Nome
          </th>
          <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Valor
          </th>
          <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider w-24">
            Ações
          </th>
        </tr>
      </thead>

      {/* CORPO */}
      <tbody className="bg-white divide-y divide-gray-100">
        {items.map((item) => (
          <tr
            key={item.id}
            className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
            onClick={() => handleRowClick(item)}
          >
            <td className="px-4 py-3 font-semibold text-gray-700">
              {item.nome}
            </td>
            <td className="px-4 py-3 text-gray-500 font-medium">
              {/* Badge de status — ver seção 5 */}
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-800">
              {formatCurrency(item.valor)}
            </td>
            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
              {/* Grupo de ações — copie do item 2.4 */}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 📐 Referência Rápida — Classes de Tabela (Padrão Ouro)

> **Referência:** `ContatoList.js` e `ContratoList.js`

| Elemento | Padrão Correto |
|----------|----------------|
| Container da tabela | `bg-white border border-gray-200 rounded-md overflow-hidden` |
| Padding das colunas | `px-6` |
| Cabeçalho `<th>` | `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider` |
| Hover do cabeçalho | `hover:text-gray-900` |
| Hover da linha `<tr>` | `hover:bg-gray-50` |
| Divisor de linhas | `divide-gray-200` |
| Fonte do nome/texto principal | `font-medium text-gray-900` |
| Texto secundário (CPF, data) | `text-sm text-gray-500` |
| Valor monetário | `text-sm font-medium text-gray-900` |
| Badge de status | `px-2.5 py-1 text-xs font-medium rounded-full border` |
| Empty state ícone | `rounded-full bg-gray-50 border border-gray-100` |
| Empty state texto | `font-medium text-gray-500` |

---

### 4.2 — Cabeçalho de Coluna com Ordenação
```jsx
// A coluna deve mostrar o ícone de ordenação ao passar o mouse
<th
  onClick={() => requestSort('campo')}
  className="px-6 py-3 text-left text-xs font-medium uppercase
             tracking-wider cursor-pointer hover:text-gray-900"
>
  <div className="flex items-center gap-2">
    Nome do Campo
    {sortConfig.key === 'campo' ? (
      <FontAwesomeIcon
        icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown}
        className="text-blue-500"
      />
    ) : (
      <FontAwesomeIcon icon={faSort} className="text-gray-300" />
    )}
  </div>
</th>
```

### 4.3 — Lista Simples (sem tabela)
```jsx
<ul className="divide-y divide-gray-100">
  {items.map((item) => (
    <li
      key={item.id}
      className="flex items-center justify-between p-4 hover:bg-gray-50
                 transition-colors group"
    >
      <div>
        <p className="text-sm font-semibold text-gray-800">{item.nome}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{item.descricao}</p>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Botões de ação — ver seção 2.3 */}
      </div>
    </li>
  ))}
</ul>
```

---

## 5. STATUS BADGES

### Variações disponíveis (copie a que se aplica):
```jsx
// ATIVO / APROVADO / ASSINADO
<span className="px-2.5 py-1 text-[10px] font-bold rounded-full
                 bg-green-50 text-green-700 border border-green-200">
  Ativo
</span>

// PENDENTE / EM ANÁLISE / AGUARDANDO
<span className="px-2.5 py-1 text-[10px] font-bold rounded-full
                 bg-amber-50 text-amber-700 border border-amber-200">
  Pendente
</span>

// ATRASADO / CANCELADO / INADIMPLENTE
<span className="px-2.5 py-1 text-[10px] font-bold rounded-full
                 bg-red-50 text-red-700 border border-red-200">
  Atrasado
</span>

// INFORMATIVO / NEUTRO
<span className="px-2.5 py-1 text-[10px] font-bold rounded-full
                 bg-blue-50 text-blue-700 border border-blue-200">
  Informação
</span>

// INATIVO / RASCUNHO / ARQUIVADO
<span className="px-2.5 py-1 text-[10px] font-bold rounded-full
                 bg-gray-100 text-gray-600 border border-gray-200">
  Inativo
</span>
```

---

## 6. MODAIS

### 6.1 — Modal Padrão (lateral ou centralizado)
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center
                  items-center p-4">
    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden
                    transform transition-all">

      {/* HEADER SÓLIDO AZUL */}
      <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
        <h3 className="text-base font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faFileSignature} />
          Título do Modal
        </h3>
        <button
          onClick={onClose}
          title="Fechar"
          className="text-white/70 hover:text-white transition-colors p-1 rounded-md
                     hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* CONTEÚDO */}
      <div className="p-6 space-y-5">
        {/* Campos do formulário */}
      </div>

      {/* RODAPÉ */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-md
                     hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-bold
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     flex items-center gap-2 transition-colors"
        >
          <FontAwesomeIcon icon={isLoading ? faSpinner : faSave} spin={isLoading} />
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  </div>
)}
```

### 6.2 — Drawer / Sidebar (painel lateral)
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose}>
    <div
      className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl
                 flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-10 bg-blue-600 px-6 py-4 flex justify-between
                      items-center text-white flex-shrink-0">
        <h2 className="text-base font-bold">Título do Painel</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* CONTEÚDO SCROLLÁVEL */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Conteúdo */}
      </div>
    </div>
  </div>
)}
```

---

## 7. CARDS E PAINÉIS

### 7.1 — Card de Seção (dentro de formulários ou painéis)
```jsx
// Com faixa colorida lateral indicando o tipo de seção
<div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm
                relative overflow-hidden">
  {/* Faixa lateral: use a cor que representa a seção */}
  {/* AZUL = financeiro principal | VERDE = entrada/sucesso | AMARELO = atenção/desconto */}
  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
    Título da Seção
  </h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Campos */}
  </div>
</div>
```

### 7.2 — Card de Grade (Grid Cards, ex: configurações)
```jsx
<div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md
                hover:border-blue-200 transition-all cursor-pointer group">
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center
                    justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
      <FontAwesomeIcon icon={faUser} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800">Título do Card</h3>
      <p className="text-xs text-gray-500 font-medium mt-0.5">Descrição curta</p>
    </div>
  </div>
</div>
```

---

## 8. CABEÇALHOS DE PÁGINA

### 8.1 — Cabeçalho de Módulo (Listagem Principal)
```jsx
// USO: Primeira div dentro de cada página de módulo
<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Nome do Módulo</h1>
    <p className="text-sm text-gray-500 font-medium mt-0.5">
      Descrição curta do módulo
    </p>
  </div>
  <div className="flex flex-wrap gap-2 items-center">
    {/* Busca + Botões */}
  </div>
</div>
```

### 8.2 — Cabeçalho VIP de Destaque (apenas em páginas importantes)
```jsx
// USO: Páginas de detalhe ou módulos principais (Contratos, Painel)
<div className="bg-blue-700 p-8 rounded-lg shadow-md border border-blue-800 relative overflow-hidden">
  <div className="relative z-10 flex items-center gap-5">
    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
      <FontAwesomeIcon icon={faFileSignature} className="text-white text-xl" />
    </div>
    <div>
      <h1 className="text-2xl font-bold text-white">Título Principal</h1>
      <p className="text-blue-200 font-medium text-sm">Subtítulo explicativo</p>
    </div>
  </div>
</div>
```

---

## 9. EMPTY STATES

### 9.1 — Empty State de Tabela/Lista
```jsx
// USO: Quando uma listagem não tem resultados
<div className="py-16 flex flex-col items-center text-center">
  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center
                  mb-4 text-gray-400">
    <FontAwesomeIcon icon={faSearch} className="text-2xl" />
  </div>
  <h3 className="text-sm font-bold text-gray-700 mb-1">Nenhum resultado encontrado</h3>
  <p className="text-xs text-gray-500 font-medium max-w-xs">
    Tente ajustar os filtros ou realize uma nova busca.
  </p>
</div>
```

### 9.2 — Empty State com Ação
```jsx
// USO: Quando a lista está vazia e o usuário pode criar o primeiro item
<div className="py-16 flex flex-col items-center text-center">
  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center
                  mb-4 text-blue-400">
    <FontAwesomeIcon icon={faPlus} className="text-2xl" />
  </div>
  <h3 className="text-sm font-bold text-gray-700 mb-1">Nenhum item cadastrado</h3>
  <p className="text-xs text-gray-500 font-medium max-w-xs mb-4">
    Crie o primeiro item para começar.
  </p>
  <button
    onClick={handleCreate}
    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold
               hover:bg-blue-700 transition-colors flex items-center gap-2"
  >
    <FontAwesomeIcon icon={faPlus} /> Criar Primeiro Item
  </button>
</div>
```

---

## 10. KPI CARDS

```jsx
// Componente reutilizável para KPIs — copie esta estrutura
<div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
  <div className="flex items-center justify-between mb-2">
    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {title}
    </p>
    <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center text-blue-600">
      <FontAwesomeIcon icon={icon} size="sm" />
    </div>
  </div>
  <p className="text-xl font-bold text-gray-800">{value}</p>
  {subtitle && (
    <p className="text-xs text-gray-500 font-medium mt-1">{subtitle}</p>
  )}
</div>
```

---

## 11. PALETA DE CORES

### Cores Principais:
| Uso | Classe Tailwind | Hex |
|-----|----------------|-----|
| Ação Principal / CTA | `bg-blue-600` | `#2563EB` |
| Hover de Ação Principal | `bg-blue-700` | `#1D4ED8` |
| Cabeçalho VIP / Drawers | `bg-blue-700` | `#1D4ED8` |
| Fundo de Página | `bg-gray-50` | `#F9FAFB` |
| Cards e Painéis | `bg-white` | `#FFFFFF` |
| Bordas Padrão | `border-gray-200` | `#E5E7EB` |
| Texto Principal | `text-gray-800` | `#1F2937` |
| Texto Secundário | `text-gray-500` | `#6B7280` |
| Labels de Formulário | `text-gray-500 uppercase tracking-wider` | `#6B7280` |
| Sucesso | `bg-green-600` | `#16A34A` |
| Alerta/Atenção | `bg-amber-500` | `#F59E0B` |
| Perigo/Erro | `bg-red-600` | `#DC2626` |

### Cores dos Ícones de Ação (Família A — Padrão Ouro):
| Ação | Cor normal | Hex | Cor hover | Hex |
|------|-----------|-----|-----------|-----|
| Ver / Abrir | `text-blue-500` | `#3B82F6` | `text-blue-700` | `#1D4ED8` |
| Editar | `text-blue-500` | `#3B82F6` | `text-blue-700` | `#1D4ED8` |
| Duplicar | `text-green-500` | `#22C55E` | `text-green-700` | `#15803D` |
| Excluir | `text-red-500` | `#EF4444` | `text-red-700` | `#B91C1C` |
| Imprimir/PDF | `text-purple-500` | `#A855F7` | `text-purple-700` | `#7E22CE` |
| Download | `text-teal-500` | `#14B8A6` | `text-teal-700` | `#0F766E` |

### ❌ CORES PROIBIDAS:
- **Nenhum gradiente** (`bg-gradient-to-*`) em botões ou cards principais
- **Nenhum roxo, índigo ou teal** como cor primária de fundo ou header
- **Nenhum `shadow-lg` ou `shadow-2xl`** em cards simples (use apenas `shadow-sm`)
- **Nenhum `text-indigo-*`** — use `text-blue-*` no lugar

---

## 12. TIPOGRAFIA

| Elemento | Classes |
|----------|---------|
| Título de Página | `text-2xl font-bold text-gray-800` |
| Título de Seção | `text-lg font-bold text-gray-800` |
| Subtítulo / Descrição | `text-sm font-medium text-gray-500` |
| Label de Input | `text-[11px] font-bold text-gray-500 uppercase tracking-wider` |
| Texto de Célula (destaque) | `text-sm font-semibold text-gray-700` |
| Texto de Célula (secundário) | `text-sm font-medium text-gray-500` |
| Valor Monetário / Número | `text-sm font-bold text-gray-800` |
| Cabeçalho de Coluna | `text-[11px] font-bold text-gray-500 uppercase tracking-wider` |
| Badge / Tag | `text-[10px] font-bold uppercase` |

### ❌ TIPOGRAFIA PROIBIDA:
- **`font-extrabold`** — use `font-bold` no máximo
- **`tracking-widest`** — use `tracking-wider` no máximo
- **`text-[10px]`** em textos corridos (apenas em badges/labels)
- **`uppercase`** em textos corridos (apenas em labels e badges)

---

## 🚀 GUIA RÁPIDO DE CONSULTA

**Botão de editar em tabela?** → Seção 2, Família A — `faEdit`, cor `text-blue-500 hover:text-blue-700 p-2`  
**Botão de excluir em tabela?** → Seção 2, Família A — `faTrash`, cor `text-red-500 hover:text-red-700 p-2`  
**Botão de duplicar em tabela?** → Seção 2, Família A — `faCopy`, cor `text-green-500 hover:text-green-700 p-2`  
**Botão de ver/abrir em tabela?** → Seção 2, Família A — `faEye`, cor `text-blue-500 hover:text-blue-700 p-2`  
**Botão principal (+ Novo)?** → Seção 2.1 — `bg-blue-600` com `rounded-md`  
**Botão de filtros?** → Seção 2.2 — `bg-white border border-gray-300`  
**Botão de fechar modal?** → Seção 2.4 — `text-white/70 hover:text-white`  
**Tabela completa?** → Seção 4.1  
**Modal?** → Seção 6.1  
**Input de texto?** → Seção 3.1  
**Badge de status?** → Seção 5  
**Lista vazia?** → Seção 9.1 ou 9.2  
**KPI Card?** → Seção 10  
**Dúvida sobre ícone?** → Seção 1 — tabela de proibidos e substitutos  
**Dúvida sobre cor?** → Seção 11 — tabela completa com hex

---

*Última atualização: Fevereiro 2026. Atualizar sempre que um novo padrão for adotado.*
