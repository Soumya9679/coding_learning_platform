const cards = Array.from(document.querySelectorAll(".game-card"));
const playAllButton = document.querySelector("[data-play-all]");

const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.style.opacity = "1";
				entry.target.style.transform = "translateY(0)";
				observer.unobserve(entry.target);
			}
		});
	},
	{ threshold: 0.3 }
);

cards.forEach((card, index) => {
	card.style.transitionDelay = `${index * 60}ms`;
	observer.observe(card);

	const button = card.querySelector("[data-play]");
	button?.addEventListener("click", () => {
		const target = button.getAttribute("data-target");
		if (target) {
			button.classList.add("is-armed");
			setTimeout(() => (window.location.href = target), 120);
		}
	});
});

playAllButton?.addEventListener("click", () => {
	cards.forEach((card, idx) => {
		setTimeout(() => card.classList.add("pulse"), idx * 120);
		setTimeout(() => card.classList.remove("pulse"), idx * 120 + 600);
	});

	const firstTarget = cards[0]?.querySelector("[data-play]")?.getAttribute("data-target");
	if (firstTarget) {
		setTimeout(() => (window.location.href = firstTarget), 420);
	}
});
