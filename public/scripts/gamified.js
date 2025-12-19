const toneButtons = document.querySelectorAll(".style-switcher button");
const toneOutput = document.getElementById("toneOutput");

const toneCopy = {
  calm: "Calm Coach: " +
    "Let's breathe and trace the code line by line. You're in control.",
  spark: "Spark Hype: " + "That bug is scared of you. Drop the fix and flex!",
  retro: "Retro Bot: " +
    "0101 wisdom: add a variable, gain 100 confidence points."
};

toneButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tone = btn.dataset.tone;
    toneOutput.textContent = toneCopy[tone];
  });
});
