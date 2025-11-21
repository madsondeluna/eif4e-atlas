/**
 * Clean 2D Topology Diagram for eIF4E - Based on ribbon topology style
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
        const startX = 80;
        const startY = 320;
        const strandWidth = 40;
        const strandHeight = 140;
        const strandSpacing = 75;

        // Define the 8 beta strands
        const strands = [
            { id: 1, direction: 'up', x: startX },
            { id: 2, direction: 'down', x: startX + strandSpacing },
            { id: 3, direction: 'up', x: startX + strandSpacing * 2 },
            { id: 4, direction: 'down', x: startX + strandSpacing * 3 },
            { id: 5, direction: 'up', x: startX + strandSpacing * 4 },
            { id: 6, direction: 'down', x: startX + strandSpacing * 5 },
            { id: 7, direction: 'up', x: startX + strandSpacing * 6 },
            { id: 8, direction: 'down', x: startX + strandSpacing * 7 }
        ];

        // Draw loops first (so they appear behind strands)
        this.drawLoops(strands, strandWidth, strandHeight, startY);

        // Draw beta strands
        strands.forEach(strand => {
            this.drawBetaStrand(strand, strandWidth, strandHeight, startY);
        });

        // Draw helices
        this.drawHelices();

        // Draw binding site annotations
        this.drawBindingSites();

        // Add labels
        this.addLabels();
    }

    drawLoops(strands, width, height, baseY) {
        // Loop connecting strands (hairpin loops on top/bottom)
        for (let i = 0; i < strands.length - 1; i++) {
            const current = strands[i];
            const next = strands[i + 1];

            const x1 = current.x + width / 2;
            const x2 = next.x + width / 2;

            let y1, y2, controlY;

            if (current.direction === 'up') {
                y1 = baseY - height;
                y2 = next.direction === 'down' ? baseY - height : baseY;
                controlY = baseY - height - 30;
            } else {
                y1 = baseY;
                y2 = next.direction === 'up' ? baseY - height : baseY;
                controlY = baseY + 30;
            }

            const midX = (x1 + x2) / 2;
            const path = `M ${x1},${y1} Q ${midX},${controlY} ${x2},${y2}`;

            const loopPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            loopPath.setAttribute('d', path);
            loopPath.setAttribute('stroke', '#94a3b8');
            loopPath.setAttribute('stroke-width', '3');
            loopPath.setAttribute('fill', 'none');
            loopPath.setAttribute('class', 'loop-connector');
            loopPath.setAttribute('data-type', 'loop');
            loopPath.setAttribute('data-name', `Loop ${i + 1}`);

            this.svg.appendChild(loopPath);
        }
    }

    drawBetaStrand(strand, width, height, baseY) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'beta-strand-element');
        g.setAttribute('data-type', 'beta');
        g.setAttribute('data-id', strand.id);
        g.setAttribute('data-name', `β${strand.id}`);

        const x = strand.x;
        let y1, y2;

        if (strand.direction === 'up') {
            y1 = baseY;
            y2 = baseY - height;
        } else {
            y1 = baseY - height;
            y2 = baseY;
        }

        // Draw arrow shape
        const arrowSize = 15;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        if (strand.direction === 'up') {
            // Arrow pointing up
            const d = `
                M ${x + width / 2 - width / 4},${y1}
                L ${x + width / 2 - width / 4},${y2 + arrowSize}
                L ${x},${y2 + arrowSize}
                L ${x + width / 2},${y2}
                L ${x + width},${y2 + arrowSize}
                L ${x + width / 2 + width / 4},${y2 + arrowSize}
                L ${x + width / 2 + width / 4},${y1}
                Z
            `;
            path.setAttribute('d', d);
        } else {
            // Arrow pointing down
            const d = `
                M ${x + width / 2 - width / 4},${y1}
                L ${x + width / 2 - width / 4},${y2 - arrowSize}
                L ${x},${y2 - arrowSize}
                L ${x + width / 2},${y2}
                L ${x + width},${y2 - arrowSize}
                L ${x + width / 2 + width / 4},${y2 - arrowSize}
                L ${x + width / 2 + width / 4},${y1}
                Z
            `;
            path.setAttribute('d', d);
        }

        path.setAttribute('fill', '#3b82f6');
        path.setAttribute('stroke', '#1d4ed8');
        path.setAttribute('stroke-width', '2');

        // Add label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', (y1 + y2) / 2 + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `β${strand.id}`;

        g.appendChild(path);
        g.appendChild(text);
        this.svg.appendChild(g);
    }

    drawHelices() {
        const helices = [
            { label: 'α1', x: 150, y: 80, length: 60, color: '#f59e0b' },
            { label: 'α2', x: 400, y: 60, length: 80, color: '#f59e0b' },
            { label: 'α3', x: 650, y: 90, length: 70, color: '#f59e0b' }
        ];

        helices.forEach(helix => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'helix-element');
            g.setAttribute('data-type', 'helix');
            g.setAttribute('data-name', helix.label);

            // Draw helix as rounded rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', helix.x);
            rect.setAttribute('y', helix.y);
            rect.setAttribute('width', helix.length);
            rect.setAttribute('height', 16);
            rect.setAttribute('rx', 8);
            rect.setAttribute('fill', helix.color);
            rect.setAttribute('stroke', '#d97706');
            rect.setAttribute('stroke-width', '2');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', helix.x + helix.length / 2);
            text.setAttribute('y', helix.y + 12);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.textContent = helix.label;

            g.appendChild(rect);
            g.appendChild(text);
            this.svg.appendChild(g);
        });
    }

    drawBindingSites() {
        const sites = [
            { label: 'Cap binding', x: 350, y: 260, color: '#ef4444', width: 120 },
            { label: 'eIF4G', x: 550, y: 240, color: '#10b981', width: 80 },
            { label: 'VPg', x: 220, y: 200, color: '#8b5cf6', width: 60 }
        ];

        sites.forEach(site => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'binding-annotation');
            g.setAttribute('data-type', 'binding');
            g.setAttribute('data-name', site.label);

            // Dashed line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', site.x);
            line.setAttribute('y1', site.y);
            line.setAttribute('x2', site.x + site.width / 2);
            line.setAttribute('y2', site.y + 40);
            line.setAttribute('stroke', site.color);
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '4,3');

            // Label box
            const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            textBg.setAttribute('x', site.x - 5);
            textBg.setAttribute('y', site.y - 18);
            textBg.setAttribute('width', site.width + 10);
            textBg.setAttribute('height', 20);
            textBg.setAttribute('fill', site.color);
            textBg.setAttribute('opacity', '0.9');
            textBg.setAttribute('rx', 4);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', site.x + site.width / 2);
            text.setAttribute('y', site.y - 4);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', 'bold');
            text.textContent = site.label;

            g.appendChild(line);
            g.appendChild(textBg);
            g.appendChild(text);
            this.svg.appendChild(g);
        });
    }

    addLabels() {
        // N' and C' terminal labels
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
                'β1': 'First beta strand - Part of the curved antiparallel β-sheet forming the structural core',
                'β2': 'Second beta strand - Contributes to the concave cap-binding surface',
                'β3': 'Third beta strand - Central strand in the β-sheet scaffold',
                'β4': 'Fourth beta strand - Involved in maintaining sheet curvature',
                'β5': 'Fifth beta strand - Part of the cap-binding pocket region',
                'β6': 'Sixth beta strand - Contributes to overall fold stability',
                'β7': 'Seventh beta strand - Near the C-terminal region',
                'β8': 'Eighth beta strand - Terminal strand completing the sheet'
            },
            'helix': {
                'α1': 'Alpha helix 1 - N-terminal helix contacting the β-sheet, provides structural support',
                'α2': 'Alpha helix 2 - Central helix on convex side, critical for eIF4G binding interactions',
                'α3': 'Alpha helix 3 - C-terminal helix stabilizing the overall protein architecture'
            },
            'loop': 'Flexible loop region connecting β-strands - some loops are critical for VPg viral protein binding',
            'binding': {
                'Cap binding': 'm⁷G cap-binding pocket - Conserved Trp56 and Trp102 residues sandwich the methylated guanine through π-π stacking',
                'eIF4G': 'eIF4G binding surface - Lateral region where eIF4G binds via YXXXXLΦ motif to form eIF4F complex',
                'VPg': 'VPg binding surface - Dorsal surface where viral VPg proteins interact; mutations here confer virus resistance'
            }
        };

        if (type === 'beta') return descriptions.beta[name] || 'Beta strand';
        if (type === 'helix') return descriptions.helix[name] || 'Alpha helix';
        if (type === 'loop') return descriptions.loop;
        if (type === 'binding') return descriptions.binding[name] || 'Binding site';

        return 'Structural element of eIF4E';
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

// Initialize diagram
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('eif4e-structure-diagram')) {
        new EIF4ETopologyDiagram('eif4e-structure-diagram');
    }
});
