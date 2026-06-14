// Button Animation Effects
document.addEventListener('DOMContentLoaded', function() {
    // Ripple Effect
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        button.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, 600);
    }

    // Add ripple effect to all buttons
    const buttons = document.querySelectorAll('.spectre-btn');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // Button press animation
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });

        button.addEventListener('mouseup', function() {
            this.style.transform = '';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Add touch feedback for mobile
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });

        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });

    // Loading state helper
    window.setButtonLoading = function(button, isLoading) {
        if (isLoading) {
            button.classList.add('spectre-btn--loading');
            button.disabled = true;
        } else {
            button.classList.remove('spectre-btn--loading');
            button.disabled = false;
        }
    };

    // Button shake animation for errors
    window.shakeButton = function(button) {
        button.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            button.style.animation = '';
        }, 500);
    };

    // Add shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setButtonLoading: window.setButtonLoading,
        shakeButton: window.shakeButton
    };
}
