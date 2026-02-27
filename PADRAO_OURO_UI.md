# 🌟 Manual de UI/UX do Studio 57 (O "Padrão Ouro")

Este documento serve como um **Guia Definitivo e Orgânico** de Design System do projeto Elo57 Lab SaaS / Studio 57.
Sempre que uma nova tela for criada ou um componente refatorado, as regras deste documento devem ser lidas, aplicadas e **atualizadas** caso novas soluções visuais elegantes sejam adotadas.

---

## 💎 Identidade Central
O sistema não deve ter cara de "painel genérico antigo", mas sim de um **Studio de Gestão Sóbrio, Sólido e Elegante**.
A paleta base foca em:
- **Azul Corporativo Moderno** (`bg-blue-600` ou `bg-blue-700` padrão do sistema) *EXCLUSIVAMENTE* em cores sólidas.
- **Branco Puro** para cartões e áreas de leitura visando alto contraste.
- **Cinza Leves e Frios** (`gray-50`, `gray-100`) para fundos e divisórias.
- **Micro-interações:** Toda ação ou hover deve ter uma reposta do sistema, mas sem exageros visíveis como bordas brilhantes. Um simples `hover:bg-blue-700` é o ideal.

---

## 🏗️ Estrutura de Componentes

### 1. Cabeçalhos VIPs (Headers Destaque) - USE COM MODERAÇÃO!
Telas principais de módulos de conteúdo podem usar um Header Card Sólido para guiar a tela, mas **SEM NENHUM DEGRADÊ OU EFEITO DE LUZ (BLUR)**.
**🚨 REGRA DE OURO DA MODERAÇÃO**:
- **NUNCA** use "Mega Headers" em páginas que servem apenas como "Menu", "Índice" ou "Dashboard principal" (ex: a página raiz de `/configuracoes` com listas de cards).
- **PADRÃO EXIGIDO**: Fundo limpo `bg-blue-600` ou `bg-blue-700`, texto branco forte, ícone sutil, sombra clean. Nada flutuante ou espalhafatoso.

```jsx
{/* EXEMPLO CORRETO - SÓLIDO E LIMPO: */}
<div className="bg-blue-700 p-8 md:p-10 rounded-3xl shadow-md border border-blue-800 relative overflow-hidden">
    <div className="relative z-10 flex items-center gap-6">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
           <Icone Aqui className="text-white" />
        </div>
        <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Título</h1>
            <p className="text-blue-100 font-medium">Subtítulo explicativo</p>
        </div>
    </div>
</div>
```

### 2. Cards (Mini Boards)
Para envolver conteúdo ou itens de grid, use `rounded-3xl` ou `rounded-2xl` e adicione Sombras Naturais e Secas (`shadow-sm` ou `shadow`).
- **Barra Lateral Viva:** Um detalhe ótimo para listagens é uma lateral que acende no hover com cor sólida: `<div className="absolute top-0 left-0 w-2 h-0 bg-blue-500 group-hover:h-full transition-all duration-300 rounded-l-3xl"></div>`.

### 3. Inputs e Formulários
Estilo elegante porém funcional:
```css
className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm placeholder-gray-400"
```

### 4. Botões de Ação
**🚨 PROIBIDO O USO DE `bg-gradient-to-...`**
Botões devem ser blocos utilitários de cor sólida com um hover claro que altera o tom. Sem brilhos excessivos.
- Estilo do Botão Principal:
```css
className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-extrabold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
```

### 5. Tipografia
Nos títulos, use `font-bold` ou `font-extrabold`. Em tabelas e dados, prefira `text-sm font-semibold`.

### 6. Empty States
Um `div` clean, respeitoso e explicativo, sem firulas exageradas:
```jsx
<div className="bg-white rounded-3xl p-12 text-center border border-gray-200 w-full">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex mx-auto items-center justify-center mb-4 text-gray-400">
        <FontAwesomeIcon icon={faBoxOpen} className="text-xl" />
    </div>
    <h3 className="text-sm font-bold text-gray-800 mb-1">Nenhum Exemplo Encontrado</h3>
    <p className="text-xs font-medium text-gray-500 max-w-sm mx-auto">Sua organização ainda não...</p>
</div>
```

---

## 🛠️ Regra de Ouro da Implementação Visual (Sustentabilidade)
A UI/UX nunca deve quebrar a usabilidade:
1. **Sóbrio e Sólido**: Menos é Mais. Apenas Branco, Cinza e Azul primário. Nada de misturas intergaláticas (Roxos, Indigos berrantes misturados).
2. "Menos é Mais" em Menus: Telas compostas apenas por `Cards` agrupados devem seguir a lei do design escandinavo: Fundo limpo, card branco, ícone sutil de cor sólida.
3. "Deixe respirar": Abuse do `space-y-6`, `p-6`, `p-8` e `gap-4`. A interface deve dar sensação de amplitude, não de "espremedura".

*(Este manual deve ser atualizado periodicamente caso novas soluções elegantes entrem em voga.)*
