import "@babel/polyfill";
import { login, logout } from "./login";
import { updateSettigns } from "./updateSettings";
import { signup } from "./createUser";

const loginForm = document.querySelector(".form--login");
const signupForm = document.querySelector(".form--signup");
const logoutButton = document.querySelector(".nav__el--logout");
const updateForm = document.querySelector(".form-user-data");
const passwordForm = document.querySelector(".form-user-settings");

if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (updateForm) {
  updateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    const photo = document.getElementById("photo").value;
    updateSettigns(form, "data");
  });
}

if (passwordForm) {
  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("password-current").value;
    const newPassword = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    updateSettigns(
      { currentPassword, newPassword, passwordConfirm },
      "password"
    );
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    signup({ name, email, password, passwordConfirm });
  });
}
