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
        // Configuration for Modern Design
        const config = {
            startX: 60,
            startY: 200,
            strandWidth: 40,
            strandHeight: 120,
            spacing: 70,
            colors: {
                strand: { start: '#3b82f6', end: '#2563eb' }, // Blue gradient
                helix: { start: '#f59e0b', end: '#d97706' },  // Amber gradient
                loop: '#cbd5e1',
                text: '#ffffff',
                highlight: '#ec4899'
            }
        };

        // Define the 8 beta strands with accurate direction
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

        // Add definitions for gradients and filters
        this.addDefs(config);

        // Draw loops (background layer)
        this.drawModernLoops(strands, config);

        // Draw beta strands (middle layer)
        strands.forEach(strand => {
            this.drawModernStrand(strand, config);
        });

        // Draw helices (top layer)
        this.drawModernHelices(config);

        // Draw binding site annotations with glow effect
        this.drawModernBindingSites(config);
    }

    addDefs(config) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Drop Shadow Filter
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'dropShadow');
        filter.innerHTML = `
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        defs.appendChild(filter);

        // Strand Gradient
        const strandGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        strandGrad.setAttribute('id', 'strandGradient');
        strandGrad.setAttribute('x1', '0%');
        strandGrad.setAttribute('y1', '0%');
        strandGrad.setAttribute('x2', '0%');
        strandGrad.setAttribute('y2', '100%');
        strandGrad.innerHTML = `
            <stop offset="0%" style="stop-color:${config.colors.strand.start};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${config.colors.strand.end};stop-opacity:1" />
        `;
        defs.appendChild(strandGrad);

        // Helix Gradient
        const helixGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        helixGrad.setAttribute('id', 'helixGradient');
        helixGrad.setAttribute('x1', '0%');
        helixGrad.setAttribute('y1', '0%');
        helixGrad.setAttribute('x2', '100%');
        helixGrad.setAttribute('y2', '0%');
        helixGrad.innerHTML = `
            <stop offset="0%" style="stop-color:${config.colors.helix.start};stop-opacity:1" />
            <stop offset="50%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:${config.colors.helix.end};stop-opacity:1" />
        `;
        defs.appendChild(helixGrad);

        this.svg.appendChild(defs);
    }

    drawModernLoops(strands, config) {
        let pathD = '';

        for (let i = 0; i < strands.length - 1; i++) {
            const current = strands[i];
            const next = strands[i + 1];

            const x1 = current.x + config.strandWidth / 2;
            const x2 = next.x + config.strandWidth / 2;

            let y1, y2, cp1x, cp1y, cp2x, cp2y;

            // Calculate start and end points based on direction
            // UP strand: Starts bottom (startY), Ends top (startY - strandHeight).
            // DOWN strand: Starts top (startY - strandHeight), Ends bottom (startY).

            const startY = current.direction === 'up' ? config.startY - config.strandHeight : config.startY;
            const endY = next.direction === 'up' ? config.startY : config.startY - config.strandHeight;

            // Control points for smooth Bezier
            const dist = x2 - x1;
            cp1x = x1 + dist * 0.3; // Adjusted control point x for smoother curve
            cp2x = x2 - dist * 0.3; // Adjusted control point x for smoother curve

            // Curvature depends on whether we are connecting top-top, bottom-bottom, or crossing
            const isTopConnection = startY < config.startY && endY < config.startY;
            const isBottomConnection = startY >= config.startY && endY >= config.startY;

            if (isTopConnection) {
                cp1y = startY - 30; // Pull control points further out for more pronounced curve
                cp2y = endY - 30;
            } else if (isBottomConnection) {
                cp1y = startY + 30;
                cp2y = endY + 30;
            } else {
                // Crossing (e.g. Top to Bottom)
                // Adjust control points to create a gentle S-curve or direct connection
                cp1y = startY + (endY > startY ? 20 : -20); // Slight curve towards the middle
                cp2y = endY + (startY > endY ? 20 : -20);
            }

            // Draw individual path for each loop to allow interaction
            const loopPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            loopPath.setAttribute('d', `M ${x1},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${endY}`);
            loopPath.setAttribute('stroke', config.colors.loop);
            loopPath.setAttribute('stroke-width', '4');
            loopPath.setAttribute('fill', 'none');
            loopPath.setAttribute('stroke-linecap', 'round');
            loopPath.setAttribute('class', 'loop-connector interactive');
            loopPath.setAttribute('data-type', 'loop');
            loopPath.setAttribute('data-name', `Loop ${i + 1}`);
            loopPath.style.transition = 'stroke 0.3s ease, transform 0.3s ease';

            // Hover effect logic
            loopPath.addEventListener('mouseenter', () => {
                loopPath.style.stroke = config.colors.highlight;
                loopPath.style.transform = 'scale(1.02)';
                this.showTooltip(`Loop ${i + 1}`, (x1 + x2) / 2, (startY + endY) / 2);
            });
            loopPath.addEventListener('mouseleave', () => {
                if (this.selectedElement !== loopPath) {
                    loopPath.style.stroke = config.colors.loop;
                    loopPath.style.transform = 'scale(1)';
                }
                this.hideTooltip();
            });

            this.svg.appendChild(loopPath);
        }
    }

    drawModernStrand(strand, config) {
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
            // Upward Arrow
            d = `
                M ${x},${yBase} 
                L ${x},${yBase - h + arrowH} 
                L ${x - 5},${yBase - h + arrowH} 
                L ${x + w / 2},${yBase - h - 5} 
                L ${x + w + 5},${yBase - h + arrowH} 
                L ${x + w},${yBase - h + arrowH} 
                L ${x + w},${yBase} 
                Q ${x + w / 2},${yBase + 5} ${x},${yBase}
                Z
            `;
        } else {
            // Downward Arrow
            d = `
                M ${x},${yBase - h} 
                L ${x},${yBase - arrowH} 
                L ${x - 5},${yBase - arrowH} 
                L ${x + w / 2},${yBase + 5} 
                L ${x + w + 5},${yBase - arrowH} 
                L ${x + w},${yBase - arrowH} 
                L ${x + w},${yBase - h} 
                Q ${x + w / 2},${yBase - h - 5} ${x},${yBase - h}
                Z
            `;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'url(#strandGradient)');
        path.setAttribute('filter', 'url(#dropShadow)');
        path.style.transition = 'transform 0.3s ease, filter 0.3s ease';

        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + w / 2);
        text.setAttribute('y', yBase - h / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-size', '14');
        text.textContent = `β${strand.id}`;
        text.style.pointerEvents = 'none';

        g.appendChild(path);
        g.appendChild(text);

        // Hover effect logic
        g.addEventListener('mouseenter', () => {
            path.style.transform = 'scale(1.1)';
            path.style.filter = 'drop-shadow(0 6px 8px rgba(59, 130, 246, 0.4))';
            this.showTooltip(`Beta Strand ${strand.id}`, x + w, yBase - h / 2);
        });
        g.addEventListener('mouseleave', () => {
            if (this.selectedElement !== g) {
                path.style.transform = 'scale(1)';
                path.style.filter = 'url(#dropShadow)';
            }
            this.hideTooltip();
        });

        this.svg.appendChild(g);
    }

    drawModernHelices(config) {
        // Helices placed strategically to look good
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

            // Cylinder shape (Rectangle with rounded corners)
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', helix.x);
            rect.setAttribute('y', helix.y);
            rect.setAttribute('width', helix.width);
            rect.setAttribute('height', 26);
            rect.setAttribute('rx', 13);
            rect.setAttribute('fill', 'url(#helixGradient)');
            rect.setAttribute('filter', 'url(#dropShadow)');
            rect.style.transition = 'transform 0.3s ease';

            // Stylized coil lines
            const coilGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const numCoils = Math.floor(helix.width / 10);
            for (let i = 1; i < numCoils; i++) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const lx = helix.x + (i * 10);
                line.setAttribute('d', `M ${lx},${helix.y} Q ${lx + 5},${helix.y + 13} ${lx},${helix.y + 26}`);
                line.setAttribute('stroke', 'rgba(255,255,255,0.3)');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('fill', 'none');
                coilGroup.appendChild(line);
            }

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', helix.x + helix.width / 2);
            text.setAttribute('y', helix.y + 13);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-size', '13');
            text.setAttribute('style', 'text-shadow: 0 1px 2px rgba(0,0,0,0.3)');
            text.textContent = helix.label;
            text.style.pointerEvents = 'none';

            g.appendChild(rect);
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
            if(element !== this.selectedElement) {
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
