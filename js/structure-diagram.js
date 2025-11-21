/**
 * Interactive 2D Structure Diagram for eIF4E
 */

class EIF4EStructureDiagram {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = 800;
        this.height = 600;
        this.selectedRegion = null;
        this.init();
    }

    init() {
        this.createSVG();
        this.drawStructure();
        this.addInteractivity();
    }

    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('class', 'structure-diagram');
        this.container.appendChild(this.svg);
    }

    drawStructure() {
        // Draw beta sheet (curved arrangement of 8 strands)
        this.drawBetaSheet();

        // Draw alpha helices
        this.drawAlphaHelices();

        // Draw loops
        this.drawLoops();

        // Draw binding sites
        this.drawBindingSites();

        // Add labels
        this.addLabels();
    }

    drawBetaSheet() {
        const centerX = 400;
        const centerY = 300;
        const radius = 150;
        const strandCount = 8;
        const strandWidth = 25;
        const strandHeight = 100;

        for (let i = 0; i < strandCount; i++) {
            const angle = (i * Math.PI * 2) / strandCount - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const strand = this.createBetaStrand(x, y, angle, i + 1);
            this.svg.appendChild(strand);
        }
    }

    createBetaStrand(x, y, angle, number) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'beta-strand');
        g.setAttribute('data-type', 'beta');
        g.setAttribute('data-name', `β${number}`);
        g.setAttribute('transform', `translate(${x},${y}) rotate(${angle * 180 / Math.PI})`);

        // Arrow shape for beta strand
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M -12,-40 L -12,30 L -18,30 L 0,45 L 18,30 L 12,30 L 12,-40 Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', '#3b82f6');
        path.setAttribute('stroke', '#1d4ed8');
        path.setAttribute('stroke-width', '2');

        // Text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '5');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `β${number}`;

        g.appendChild(path);
        g.appendChild(text);
        return g;
    }

    drawAlphaHelices() {
        const helices = [
            { x: 250, y: 150, length: 80, angle: 45, label: 'α1' },
            { x: 550, y: 300, length: 90, angle: -30, label: 'α2' },
            { x: 320, y: 480, length: 70, angle: 15, label: 'α3' }
        ];

        helices.forEach(helix => {
            const g = this.createAlphaHelix(helix.x, helix.y, helix.length, helix.angle, helix.label);
            this.svg.appendChild(g);
        });
    }

    createAlphaHelix(x, y, length, angle, label) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'alpha-helix');
        g.setAttribute('data-type', 'helix');
        g.setAttribute('data-name', label);
        g.setAttribute('transform', `translate(${x},${y}) rotate(${angle})`);

        // Cylinder shape for helix
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', -length / 2);
        rect.setAttribute('y', -10);
        rect.setAttribute('width', length);
        rect.setAttribute('height', 20);
        rect.setAttribute('rx', 10);
        rect.setAttribute('fill', '#f59e0b');
        rect.setAttribute('stroke', '#d97706');
        rect.setAttribute('stroke-width', '2');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '5');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.textContent = label;

        g.appendChild(rect);
        g.appendChild(text);
        return g;
    }

    drawLoops() {
        // Connecting loops between structural elements
        const loops = [
            { path: 'M 300,200 Q 280,180 260,170', label: 'Loop 1' },
            { path: 'M 500,250 Q 520,240 540,250', label: 'Loop 2' },
            { path: 'M 400,450 Q 380,460 360,470', label: 'Loop 3' }
        ];

        loops.forEach((loop, i) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', loop.path);
            path.setAttribute('stroke', '#8b5cf6');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('fill', 'none');
            path.setAttribute('class', 'loop');
            path.setAttribute('data-type', 'loop');
            path.setAttribute('data-name', loop.label);
            this.svg.appendChild(path);
        });
    }

    drawBindingSites() {
        const sites = [
            {
                x: 400, y: 300, radius: 50, color: '#ef4444', label: 'm⁷G Cap', type: 'cap',
                description: 'Cap-binding pocket with Trp56 and Trp102'
            },
            {
                x: 520, y: 280, radius: 35, color: '#10b981', label: 'eIF4G', type: 'eif4g',
                description: 'Lateral surface binding eIF4G via YXXXXLΦ motif'
            },
            {
                x: 350, y: 200, radius: 40, color: '#8b5cf6', label: 'VPg', type: 'vpg',
                description: 'Dorsal surface for viral VPg interaction'
            }
        ];

        sites.forEach(site => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'binding-site');
            g.setAttribute('data-type', site.type);
            g.setAttribute('data-description', site.description);

            // Circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', site.x);
            circle.setAttribute('cy', site.y);
            circle.setAttribute('r', site.radius);
            circle.setAttribute('fill', site.color);
            circle.setAttribute('opacity', '0.3');
            circle.setAttribute('stroke', site.color);
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('stroke-dasharray', '5,5');

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', site.x);
            text.setAttribute('y', site.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', site.color);
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.textContent = site.label;

            g.appendChild(circle);
            g.appendChild(text);
            this.svg.appendChild(g);
        });
    }

    addLabels() {
        // Title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', '400');
        title.setAttribute('y', '40');
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('font-size', '24');
        title.setAttribute('font-weight', 'bold');
        title.setAttribute('fill', '#1e293b');
        title.textContent = 'eIF4E Secondary Structure (2D Topology)';
        this.svg.appendChild(title);

        // Legend
        this.createLegend();
    }

    createLegend() {
        const legendData = [
            { color: '#3b82f6', label: 'β-Sheets (8 strands)', x: 50, y: 50 },
            { color: '#f59e0b', label: 'α-Helices (3)', x: 50, y: 80 },
            { color: '#8b5cf6', label: 'Loops & Turns', x: 50, y: 110 }
        ];

        legendData.forEach(item => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', item.x);
            rect.setAttribute('y', item.y);
            rect.setAttribute('width', '20');
            rect.setAttribute('height', '20');
            rect.setAttribute('fill', item.color);
            rect.setAttribute('stroke', '#334155');
            rect.setAttribute('stroke-width', '1');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', item.x + 30);
            text.setAttribute('y', item.y + 15);
            text.setAttribute('font-size', '14');
            text.setAttribute('fill', '#334155');
            text.textContent = item.label;

            this.svg.appendChild(rect);
            this.svg.appendChild(text);
        });
    }

    addInteractivity() {
        // Add hover/touch effects
        const elements = this.svg.querySelectorAll('.beta-strand, .alpha-helix, .loop, .binding-site');

        elements.forEach(el => {
            el.style.cursor = 'pointer';

            el.addEventListener('mouseenter', (e) => this.highlightElement(e.currentTarget));
            el.addEventListener('mouseleave', (e) => this.unhighlightElement(e.currentTarget));
            el.addEventListener('click', (e) => this.selectElement(e.currentTarget));

            // Touch support
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectElement(e.currentTarget);
            });
        });
    }

    highlightElement(element) {
        element.style.opacity = '0.8';
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'all 0.3s ease';
    }

    unhighlightElement(element) {
        if (element !== this.selectedRegion) {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        }
    }

    selectElement(element) {
        // Clear previous selection
        if (this.selectedRegion) {
            this.selectedRegion.style.transform = 'scale(1)';
        }

        this.selectedRegion = element;
        element.style.transform = 'scale(1.1)';

        // Show info
        const type = element.getAttribute('data-type');
        const name = element.getAttribute('data-name');
        const description = element.getAttribute('data-description');

        if (description || name) {
            this.showInfo(name || type, description || this.getDefaultDescription(type, name));
        }
    }

    getDefaultDescription(type, name) {
        const descriptions = {
            'beta': `Beta strand ${name} - Part of the curved antiparallel β-sheet that forms the structural scaffold and cap-binding groove`,
            'helix': `${name} helix - Alpha helix positioned on the convex side, involved in structural stability and protein interactions`,
            'loop': `Flexible loop region connecting structural elements, some involved in VPg binding`
        };
        return descriptions[type] || 'Structural element of eIF4E';
    }

    showInfo(title, description) {
        // Update info panel
        const infoTitle = document.getElementById('structure-info-title');
        const infoDesc = document.getElementById('structure-info-description');

        if (infoTitle && infoDesc) {
            infoTitle.textContent = title;
            infoDesc.textContent = description;
        }
    }
}

// Initialize diagram when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('eif4e-structure-diagram')) {
        new EIF4EStructureDiagram('eif4e-structure-diagram');
    }
});
