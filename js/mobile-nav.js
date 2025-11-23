/**
 * Mobile Navigation Toggle
 * Adiciona funcionalidade de menu hambúrguer para navegação mobile
 */

document.addEventListener('DOMContentLoaded', () => {
    // Cria botão hamburger se não existir
    const nav = document.querySelector('.main-nav');
    const navContainer = document.querySelector('.nav-container');

    if (!nav || !navContainer) return;

    // Cria botão hamburger
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Toggle navigation');
    hamburger.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    // Insere antes da navegação
    navContainer.insertBefore(hamburger, nav);

    // Toggle menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('mobile-open');
        document.body.classList.toggle('nav-open');
    });

    // Fecha menu ao clicar em link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('mobile-open');
            document.body.classList.remove('nav-open');
        });
    });

    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            nav.classList.remove('mobile-open');
            document.body.classList.remove('nav-open');
        }
    });
});
