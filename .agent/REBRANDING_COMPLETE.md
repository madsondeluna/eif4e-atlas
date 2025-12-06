# 🌿 Rebranding Botânico Completo - Plant eIF4E Atlas

## ✅ Atualização Completa Implementada

### 📁 Todos os Arquivos CSS Atualizados

#### 1. **style.css** (Global)
- ✅ Paleta de cores verde completa
- ✅ Navegação com gradientes verdes
- ✅ Hero section com elementos decorativos
- ✅ Cards com animações de hover
- ✅ Responsividade em 4 breakpoints

#### 2. **home.css**
- ✅ Hero verde floresta com elemento decorativo
- ✅ Fact box verde
- ✅ Ícones com gradientes verdes
- ✅ Cards de exploração com cores botânicas
- ✅ Padrão de fundo com círculos verdes

#### 3. **search.css**
- ✅ Hero verde folha com elemento decorativo
- ✅ Background com padrão sutil verde
- ✅ Chart wrappers com hover responsivo
- ✅ Sombras verdes elegantes

#### 4. **phylogeny.css**
- ✅ Hero verde botânico escuro
- ✅ Cores dos reinos focadas em plantas
- ✅ Nós da árvore com stroke verde
- ✅ Hover effects com glow verde
- ✅ Stats com animação de escala

#### 5. **structural.css**
- ✅ Hero verde primavera
- ✅ Architecture cards com borda animada
- ✅ Elementos estruturais com gradientes verdes
- ✅ Info card verde floresta
- ✅ Comparison header verde escuro
- ✅ Todos os cards com hover elegante

#### 6. **msa.css**
- ✅ Hero verde spring bud
- ✅ Botões com hover verde mint
- ✅ Primary button com glow verde

#### 7. **virus.css**
- ✅ Hero com tons terrosos (contraste)
- ✅ Mechanism cards com hover verde
- ✅ Publication cards com slide effect
- ✅ Todos os elementos com sombra verde

---

## 🎨 Paleta de Cores Botânica

### Cores Principais
```css
--primary-color: #1a3a2e        /* Deep Forest Green */
--secondary-color: #2d5a4a      /* Rich Moss Green */
--accent-color: #4a9d5f         /* Vibrant Leaf Green */
--accent-hover: #3d8350         /* Deep Leaf Green */
--accent-light: #6fbf73         /* Light Spring Green */
```

### Cores Complementares
```css
--botanical-green: #2d6a4f      /* Botanical Green */
--sage-green: #52796f           /* Sage */
--mint-cream: #e8f5e9           /* Mint Cream */
--forest-shadow: #1b4332        /* Forest Shadow */
--spring-bud: #95d5b2           /* Spring Bud */
```

### Backgrounds
```css
--background-color: #f5f9f7     /* Soft Mint Background */
--surface-color: #ffffff        /* White */
```

---

## ✨ Efeitos de Hover Responsivos Implementados

### 1. **Cards com Borda Superior Animada**
```css
.card::before {
    content: '';
    height: 3px;
    background: linear-gradient(90deg, var(--accent-color), var(--spring-bud));
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.card:hover::before {
    transform: scaleX(1);
}
```

### 2. **Sombras com Glow Verde**
```css
.element:hover {
    box-shadow: var(--shadow-lg), var(--shadow-glow);
    /* shadow-glow: 0 0 20px rgba(74, 157, 95, 0.15) */
}
```

### 3. **Transform com Elevação**
```css
.card:hover {
    transform: translateY(-4px);
    border-color: var(--accent-light);
}
```

### 4. **Nós da Árvore com Drop Shadow**
```css
.node circle:hover {
    stroke: var(--accent-color);
    filter: drop-shadow(0 0 6px rgba(74, 157, 95, 0.4));
}
```

### 5. **Stats com Escala**
```css
.stat-item:hover .stat-value {
    color: var(--accent-color);
    transform: scale(1.05);
}
```

### 6. **Publication Cards com Slide**
```css
.publication-card:hover {
    transform: translateX(4px);
    box-shadow: var(--shadow-lg), var(--shadow-glow);
}
```

---

## 🎯 Elementos Decorativos

### Hero Sections
Todos os hero sections agora têm:
- Gradientes verdes elegantes
- Elementos circulares decorativos com `radial-gradient`
- Overflow controlado
- Posicionamento relativo para z-index

### Backgrounds
Seções escuras têm padrões sutis:
```css
background-image: 
    radial-gradient(circle at 20% 30%, rgba(74, 157, 95, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(149, 213, 178, 0.04) 0%, transparent 50%);
```

---

## 📱 Responsividade Aprimorada

### Breakpoints
- **1440px+**: Elementos expandidos
- **1024px**: Tablets
- **768px**: Mobile
- **480px**: Small mobile

### Elementos Responsivos
- Tipografia com `clamp()`
- Padding com `clamp()`
- Grids adaptativos
- Hero sections escaláveis
- Cards com padding fluido

---

## 🎨 Gradientes por Página

| Página | Gradiente Hero | Tema |
|--------|----------------|------|
| Home | `#2d6a4f → #1b4332` | Verde Floresta |
| Search | `#4a9d5f → #2d6a4f` | Verde Folha |
| Structure | `#6fbf73 → #4a9d5f` | Verde Primavera |
| MSA | `#95d5b2 → #52796f` | Verde Spring Bud |
| Phylogeny | `#2d6a4f → #1b4332` | Verde Botânico |
| Viruses | `#d4a574 → #b8860b` | Tons Terrosos |

---

## 🚀 Como Visualizar

1. **Abra qualquer página** do site no navegador
2. **Pressione F5** (Windows/Linux) ou **Cmd+R** (Mac)
3. **Teste os hovers** passando o mouse sobre:
   - Cards de resultado
   - Botões de navegação
   - Charts e gráficos
   - Nós da árvore filogenética
   - Publication cards
   - Resource cards
4. **Redimensione** a janela para ver a responsividade

---

## 🎯 Características Principais

### ✅ Tema Botânico Completo
- Todas as páginas usam tons de verde
- Paleta coesa e elegante
- Contraste adequado para legibilidade

### ✅ Hover Effects Sofisticados
- Sombras com glow verde
- Transformações suaves
- Animações de borda
- Drop shadows em SVG
- Escalas e slides

### ✅ Responsividade Total
- 4 breakpoints principais
- Tipografia fluida
- Layouts adaptativos
- Elementos escaláveis

### ✅ Elementos Decorativos
- Círculos com gradientes radiais
- Padrões de fundo sutis
- Bordas animadas
- Overlays elegantes

---

## 💡 Detalhes Técnicos

### Transições
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Sombras Verdes
```css
--shadow-sm: 0 1px 2px 0 rgba(26, 58, 46, 0.05);
--shadow-md: 0 4px 6px -1px rgba(26, 58, 46, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(26, 58, 46, 0.1);
--shadow-glow: 0 0 20px rgba(74, 157, 95, 0.15);
```

### Z-Index Hierarchy
- Decorative elements: `z-index: 0`
- Content: `z-index: 1`
- Sticky controls: `z-index: 100`
- Modals/Panels: `z-index: 200`

---

## 🌱 Resultado Final

O site agora apresenta:
- **Identidade visual coesa** com tema botânico
- **Interatividade elegante** com hovers responsivos
- **Design moderno** com gradientes e sombras
- **Responsividade completa** em todos os dispositivos
- **Foco em plantas** refletido em toda a paleta de cores

Todas as páginas foram atualizadas e estão prontas para uso! 🎉
