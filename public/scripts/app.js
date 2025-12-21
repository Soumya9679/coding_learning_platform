const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const heroPrimaryCta = document.querySelector(".cta-row .solid-btn");
const heroSecondaryCta = document.querySelector(".cta-row .outline-btn");

function wireNavigation(button, targetHref) {
	if (!button || !targetHref) return;
	button.addEventListener("click", () => {
		window.location.href = targetHref;
	});
}

wireNavigation(loginBtn, "login.html");
wireNavigation(signupBtn, "signup.html");
wireNavigation(heroPrimaryCta, "signup.html");
wireNavigation(heroSecondaryCta, "https://www.youtube.com/watch?v=ysz5S6PUM-U");