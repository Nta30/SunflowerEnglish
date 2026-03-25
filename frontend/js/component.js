export async function loadAllComponent() {
    const elements = document.querySelectorAll("[data-component]");
    const promises = Array.from(elements).map(async (el) => {
        const name = el.getAttribute("data-component");
        const response = await fetch(`./components/${name}.html`);
        if (response.ok) {
            el.innerHTML = await response.text();
        }
    });
    await Promise.all(promises)
}
