export function animateCSS(element: HTMLElement, animation: string, prefix = 'animate__'): Promise<string> {
    // We create a Promise and return it
    return new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        element.classList.add(`${prefix}animated`, animationName);
        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event: any) {
            event.stopPropagation();
            element.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        element.addEventListener('animationend', handleAnimationEnd, { once: true });
    })
};