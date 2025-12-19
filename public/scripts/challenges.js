const cards = document.querySelectorAll(".track-card");

cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    cards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
  });
});

const outlineButtons = document.querySelectorAll(".outline-btn");
outlineButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    window.alert("This preview will show sample hints soon. Stay tuned!");
  });
});
