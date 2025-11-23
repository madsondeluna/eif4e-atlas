/**
 * Diagrama de Topologia 2D Limpo para eIF4E - Baseado no estilo de topologia de fita
 */

class EIF4ETopologyDiagram {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = 900;
        this.height = 400;
        this.selectedElement = null;
        this.init();
    }

    init() {
        this.createSVG();
        this.createTooltip();
        this.drawTopology();
        this.addInteractivity();
    }

    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('class', 'topology-diagram');
        this.container.appendChild(this.svg);
    }

    drawTopology() {
        // Configuração para Estilo PSIPRED
        const config = {
            startX: 60,
            startY: 200,
            strandWidth: 40,
            strandHeight: 120,
            spacing: 70,
            colors: {
                strand: '#ffff00', // Amarelo (padrão PSIPRED)
                helix: '#ff9999',  // Rosa (padrão PSIPRED)
                loop: '#000000',   // Linhas pretas
                text: '#000000',   // Texto preto
                stroke: '#000000'  // Bordas pretas
            }
        };

        // Define as 8 fitas beta
        const strands = [
            { id: 1, direction: 'up', x: config.startX },
            { id: 2, direction: 'down', x: config.startX + config.spacing },
            { id: 3, direction: 'up', x: config.startX + config.spacing * 2 },
            { id: 4, direction: 'down', x: config.startX + config.spacing * 3 },
            { id: 5, direction: 'up', x: config.startX + config.spacing * 4 },
            { id: 6, direction: 'down', x: config.startX + config.spacing * 5 },
            { id: 7, direction: 'up', x: config.startX + config.spacing * 6 },
            { id: 8, direction: 'down', x: config.startX + config.spacing * 7 }
        ];

        // Desenha loops (camada de fundo)
        this.drawPsipredLoops(strands, config);

        // Desenha fitas beta (camada do meio)
        strands.forEach(strand => {
            this.drawPsipredStrand(strand, config);
        });

        // Desenha hélices (camada superior)
        this.drawPsipredHelices(config);

        // Desenha anotações de sítios de ligação
        this.drawPsipredBindingSites(config);
    }

    drawPsipredLoops(strands, config) {
        for (let i = 0; i < strands.length - 1; i++) {
            const current = strands[i];
            const next = strands[i + 1];

            const x1 = current.x + config.strandWidth / 2;
            const x2 = next.x + config.strandWidth / 2;

            const startY = current.direction === 'up' ? config.startY - config.strandHeight : config.startY;
            const endY = next.direction === 'up' ? config.startY : config.startY - config.strandHeight;

            // Pontos de controle para Bezier suave
            const dist = x2 - x1;
            const cp1x = x1 + dist * 0.3;
            const cp2x = x2 - dist * 0.3;

            const isTopConnection = startY < config.startY && endY < config.startY;
            const isBottomConnection = startY >= config.startY && endY >= config.startY;

            let cp1y, cp2y;
            if (isTopConnection) {
                cp1y = startY - 30;
                cp2y = endY - 30;
            } else if (isBottomConnection) {
                cp1y = startY + 30;
                cp2y = endY + 30;
            } else {
                cp1y = startY + (endY > startY ? 20 : -20);
                cp2y = endY + (startY > endY ? 20 : -20);
            }

            const loopPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            loopPath.setAttribute('d', `M ${x1},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${endY}`);
            loopPath.setAttribute('stroke', config.colors.loop);
            loopPath.setAttribute('stroke-width', '2');
            loopPath.setAttribute('fill', 'none');
            loopPath.setAttribute('class', 'loop-connector interactive'); // Mantém interativo para seleção
            loopPath.setAttribute('data-type', 'loop');
            loopPath.setAttribute('data-name', `Loop ${i + 1}`);

            // Efeito hover simples para loops
            loopPath.addEventListener('mouseenter', () => {
                loopPath.setAttribute('stroke-width', '3');
                this.showTooltip(`Loop ${i + 1}`, (x1 + x2) / 2, (startY + endY) / 2);
            });
            loopPath.addEventListener('mouseleave', () => {
                if (this.selectedElement !== loopPath) {
                    loopPath.setAttribute('stroke-width', '2');
                }
                this.hideTooltip();
            });

            this.svg.appendChild(loopPath);
        }
    }

    drawPsipredStrand(strand, config) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'structure-element interactive');
        g.setAttribute('data-type', 'beta');
        g.setAttribute('data-id', strand.id);
        g.setAttribute('data-name', `β${strand.id}`);
        g.style.cursor = 'pointer';

        const x = strand.x;
        const w = config.strandWidth;
        const h = config.strandHeight;
        const yBase = config.startY;
        const arrowH = 20;

        let d;
        if (strand.direction === 'up') {
            d = `M ${x},${yBase} L ${x},${yBase - h + arrowH} L ${x + w / 2},${yBase - h} L ${x + w},${yBase - h + arrowH} L ${x + w},${yBase} Z`;
        } else {
            d = `M ${x},${yBase - h} L ${x},${yBase - arrowH} L ${x + w / 2},${yBase} L ${x + w},${yBase - arrowH} L ${x + w},${yBase - h} Z`;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', config.colors.strand);
        path.setAttribute('stroke', config.colors.stroke);
        path.setAttribute('stroke-width', '1.5');

        // Rótulo
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + w / 2);
        text.setAttribute('y', yBase - h / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', config.colors.text);
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-size', '14');
        text.textContent = `β${strand.id}`;
        text.style.pointerEvents = 'none';

        g.appendChild(path);
        g.appendChild(text);

        // Hover simples
        g.addEventListener('mouseenter', () => {
            path.setAttribute('fill', '#ffff99'); // Amarelo mais claro
            this.showTooltip(`Fita Beta ${strand.id}`, x + w, yBase - h / 2);
        });
        g.addEventListener('mouseleave', () => {
            if (this.selectedElement !== g) {
                path.setAttribute('fill', config.colors.strand);
            }
            this.hideTooltip();
        });

        this.svg.appendChild(g);
    }

    drawPsipredHelices(config) {
        const helices = [
            { label: 'α1', x: 100, y: 80, width: 60 },
            { label: 'α2', x: 310, y: 60, width: 80 },
            { label: 'α3', x: 520, y: 80, width: 70 }
        ];

        helices.forEach(helix => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'structure-element interactive');
            g.setAttribute('data-type', 'helix');
            g.setAttribute('data-name', helix.label);
            g.style.cursor = 'pointer';

            // Forma de cilindro (Retângulo)
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', helix.x);
            rect.setAttribute('y', helix.y);
            rect.setAttribute('width', helix.width);
            rect.setAttribute('height', 26);
            rect.setAttribute('rx', 0); // Cantos vivos para estilo PSIPRED
            rect.setAttribute('fill', config.colors.helix);
            rect.setAttribute('stroke', config.colors.stroke);
            rect.setAttribute('stroke-width', '1.5');

            // Rótulo
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', helix.x + helix.width / 2);
            text.setAttribute('y', helix.y + 13);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', config.colors.text);
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-size', '13');
            text.textContent = helix.label;
            text.style.pointerEvents = 'none';

            g.appendChild(rect);
            g.appendChild(text);

            g.addEventListener('mouseenter', () => {
                rect.setAttribute('fill', '#ffcccc'); // Rosa mais claro
                this.showTooltip(`Hélice Alfa ${helix.label}`, helix.x + helix.width, helix.y + 13);
            });
            g.addEventListener('mouseleave', () => {
                if (this.selectedElement !== g) {
                    rect.setAttribute('fill', config.colors.helix);
                }
                this.hideTooltip();
            });

            this.svg.appendChild(g);
        });
    }

    drawPsipredBindingSites(config) {
        // Cap m7G (perto dos loops S1/S2)
        this.drawSimpleMarker(95, 290, 'Ligação ao Cap', '#ff0000');

        // eIF4G (perto de S4/S5)
        this.drawSimpleMarker(375, 290, 'eIF4G', '#00cc00');

        // VPg (perto de S7/S8)
        this.drawSimpleMarker(585, 290, 'VPg', '#0000ff');
    }

    drawSimpleMarker(cx, cy, label, color) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'binding-annotation interactive');
        g.setAttribute('data-type', 'binding');
        g.setAttribute('data-name', label);
        g.style.cursor = 'pointer';

        // Ponto simples
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        dot.setAttribute('r', 6);
        dot.setAttribute('fill', color);
        dot.setAttribute('stroke', 'black');
        dot.setAttribute('stroke-width', '1');

        // Texto do rótulo
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'black');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = label;
        text.style.pointerEvents = 'none';

        g.appendChild(dot);
        g.appendChild(text);

        g.addEventListener('mouseenter', () => {
            dot.setAttribute('r', 8);
            this.showTooltip(`Sítio de Ligação: ${label}`, cx, cy);
        });
        g.addEventListener('mouseleave', () => {
            if (this.selectedElement !== g) {
                dot.setAttribute('r', 6);
            }
            this.hideTooltip();
        });

        this.svg.appendChild(g);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'structure-tooltip';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        this.tooltip.style.color = 'white';
        this.tooltip.style.padding = '8px 12px';
        this.tooltip.style.borderRadius = '4px';
        this.tooltip.style.fontSize = '14px';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.zIndex = '1000';
        this.tooltip.style.display = 'none';
        this.tooltip.style.transition = 'opacity 0.2s';
        document.body.appendChild(this.tooltip);
    }

    showTooltip(text, svgX, svgY) {
        if (!this.tooltip) return;

        // Converte coordenadas SVG para coordenadas de tela
        const point = this.svg.createSVGPoint();
        point.x = svgX;
        point.y = svgY;

        const screenPoint = point.matrixTransform(this.svg.getScreenCTM());

        this.tooltip.textContent = text;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${screenPoint.x}px`;
        this.tooltip.style.top = `${screenPoint.y - 40}px`; // Posiciona acima
        this.tooltip.style.transform = 'translateX(-50%)';
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    addLabels() {
        // Rótulos terminais N' e C'
        const nTerm = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nTerm.setAttribute('x', '50');
        nTerm.setAttribute('y', '330');
        nTerm.setAttribute('font-size', '16');
        nTerm.setAttribute('font-weight', 'bold');
        nTerm.setAttribute('fill', '#475569');
        nTerm.textContent = "N'";

        const cTerm = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cTerm.setAttribute('x', '850');
        cTerm.setAttribute('y', '330');
        cTerm.setAttribute('font-size', '16');
        cTerm.setAttribute('font-weight', 'bold');
        cTerm.setAttribute('fill', '#475569');
        cTerm.textContent = "C'";

        this.svg.appendChild(nTerm);
        this.svg.appendChild(cTerm);
    }

    addInteractivity() {
        const elements = this.svg.querySelectorAll('.beta-strand-element, .helix-element, .loop-connector, .binding-annotation');

        elements.forEach(el => {
            el.style.cursor = 'pointer';

            el.addEventListener('mouseenter', (e) => this.highlightElement(e.currentTarget));
            el.addEventListener('mouseleave', (e) => this.unhighlightElement(e.currentTarget));
            el.addEventListener('click', (e) => this.selectElement(e.currentTarget));

            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectElement(e.currentTarget);
            });
        });
    }

    highlightElement(element) {
        element.style.opacity = '0.7';
        element.style.filter = 'brightness(1.2)';
    }

    unhighlightElement(element) {
        if (element !== this.selectedElement) {
            element.style.opacity = '1';
            element.style.filter = 'none';
        }
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.style.filter = 'none';
            this.selectedElement.style.opacity = '1';
        }

        this.selectedElement = element;
        element.style.filter = 'brightness(1.3) drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))';

        const type = element.getAttribute('data-type');
        const name = element.getAttribute('data-name');
        this.showInfo(name, this.getDescription(type, name));
    }

    getDescription(type, name) {
        const descriptions = {
            'beta': {
                'β1': 'Primeira fita beta - Parte da folha β antiparalela curva formando o núcleo estrutural',
                'β2': 'Segunda fita beta - Contribui para a superfície côncava de ligação ao cap',
                'β3': 'Terceira fita beta - Fita central no esqueleto da folha β',
                'β4': 'Quarta fita beta - Envolvida na manutenção da curvatura da folha',
                'β5': 'Quinta fita beta - Parte da região do bolso de ligação ao cap',
                'β6': 'Sexta fita beta - Contribui para a estabilidade geral do dobramento',
                'β7': 'Sétima fita beta - Perto da região C-terminal',
                'β8': 'Oitava fita beta - Fita terminal completando a folha'
            },
            'helix': {
                'α1': 'Hélice alfa 1 - Hélice N-terminal contatando a folha β, fornece suporte estrutural',
                'α2': 'Hélice alfa 2 - Hélice central no lado convexo, crítica para interações de ligação com eIF4G',
                'α3': 'Hélice alfa 3 - Hélice C-terminal estabilizando a arquitetura geral da proteína'
            },
            'loop': 'Região de loop flexível conectando fitas β - alguns loops são críticos para a ligação da proteína viral VPg',
            'binding': {
                'Ligação ao Cap': 'Bolso de ligação ao cap m⁷G - Resíduos conservados Trp56 e Trp102 sanduícham a guanina metilada através de empilhamento π-π',
                'eIF4G': 'Superfície de ligação eIF4G - Região lateral onde eIF4G se liga via motivo YXXXXLΦ para formar o complexo eIF4F',
                'VPg': 'Superfície de ligação VPg - Superfície dorsal onde proteínas virais VPg interagem; mutações aqui conferem resistência ao vírus'
            }
        };

        if (type === 'beta') return descriptions.beta[name] || 'Fita Beta';
        if (type === 'helix') return descriptions.helix[name] || 'Hélice Alfa';
        if (type === 'loop') return descriptions.loop;
        if (type === 'binding') return descriptions.binding[name] || 'Sítio de Ligação';

        return 'Elemento estrutural de eIF4E';
    }

    showInfo(title, description) {
        const infoTitle = document.getElementById('structure-info-title');
        const infoDesc = document.getElementById('structure-info-description');

        if (infoTitle && infoDesc) {
            infoTitle.textContent = title;
            infoDesc.textContent = description;
        }
    }
}

// Inicializa diagrama
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('eif4e-structure-diagram')) {
        new EIF4ETopologyDiagram('eif4e-structure-diagram');
    }
});
