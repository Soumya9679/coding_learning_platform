const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginStatus = document.getElementById("loginStatus");
const signupStatus = document.getElementById("signupStatus");

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validatePassword(value) {
  const trimmed = value.trim();
  return trimmed.length >= 8 && /[0-9]/.test(trimmed);
}

function displayStatus(element, message, type = "info") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("error", "success", "info");
  element.classList.add(type);
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const usernameValue = document.getElementById("loginUsername")?.value.trim() ?? "";
  const passwordValue = document.getElementById("loginPassword")?.value ?? "";

  const usernameOk = usernameValue.length >= 2;
  const passwordOk = validatePassword(passwordValue);

  if (!usernameOk || !passwordOk) {
    displayStatus(
      loginStatus,
      "Use a real username and a password with 8 characters including a number.",
      "error"
    );
    return;
  }

  displayStatus(loginStatus, "Nice! We will hook this up to auth soon.", "success");
}

function handleSignupSubmit(event) {
  event.preventDefault();
  const fullName = document.getElementById("signupFullName")?.value.trim() ?? "";
  const emailValue = document.getElementById("signupEmail")?.value ?? "";
  const usernameValue = document.getElementById("signupUsername")?.value.trim() ?? "";
  const passwordValue = document.getElementById("signupPassword")?.value ?? "";
  const confirmValue = document.getElementById("signupConfirmPassword")?.value ?? "";

  const fullNameOk = fullName.length >= 2;
  const emailOk = validateEmail(emailValue);
  const usernameOk = usernameValue.length >= 2;
  const passwordOk = validatePassword(passwordValue);
  const matchOk = passwordValue === confirmValue && passwordValue.length > 0;

  if (!fullNameOk || !emailOk || !usernameOk || !passwordOk || !matchOk) {
    displayStatus(
      signupStatus,
      "Please fill out all fields, use a valid email, and ensure passwords match and include a number.",
      "error"
    );
    return;
  }

  displayStatus(signupStatus, "Account looks good! We'll hook this up to auth shortly.", "success");
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLoginSubmit);
}

if (signupForm) {
  signupForm.addEventListener("submit", handleSignupSubmit);
}
