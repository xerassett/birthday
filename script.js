// Star configuration constants
const NUMBER_OF_STARS = 50;
const MIN_STAR_SIZE = 10;
const MAX_STAR_SIZE = 30;

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('stars-container');
    
    if (!container) return;
    
    for (let i = 0; i < NUMBER_OF_STARS; i++) {
        createStar(container);
    }
});

function createStar(container) {
    const star = document.createElement('div');
    star.className = 'star';
    
    // Random position (percentage of viewport)
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random size between MIN_STAR_SIZE and MAX_STAR_SIZE pixels
    const size = Math.random() * (MAX_STAR_SIZE - MIN_STAR_SIZE) + MIN_STAR_SIZE;
    
    // Random animation delay for twinkling effect
    const delay = Math.random() * 2;
    
    star.style.left = x + '%';
    star.style.top = y + '%';
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.animationDelay = delay + 's';
    
    // Create star shape using SVG
    star.innerHTML = `
        <svg viewBox="0 0 24 24" fill="#ffd700" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.09 8.26L20.18 8.63L15.54 12.14L16.82 18.02L12 14.77L7.18 18.02L8.46 12.14L3.82 8.63L9.91 8.26L12 2Z"/>
        </svg>
    `;
    
    // Click event to open the star page
    star.addEventListener('click', function() {
        window.location.href = 'star-page.html';
    });
    
    container.appendChild(star);
}
