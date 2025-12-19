const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const gradient = document.querySelector(".cosmic-gradient");

if (loginBtn)
  loginBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });

if (signupBtn)
  signupBtn.addEventListener("click", () => {
    window.location.href = "signup.html";
  });

let angle = 0;
function animateGradient() {
  angle += 0.0025;
  const x = 50 + Math.sin(angle) * 30;
  const y = 50 + Math.cos(angle) * 30;
  gradient.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255, 122, 195, 0.25), transparent 45%),
    radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(108, 99, 255, 0.25), transparent 50%)`;
  requestAnimationFrame(animateGradient);
}

if (gradient) {
  animateGradient();
}
