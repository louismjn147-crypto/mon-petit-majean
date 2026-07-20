const PASSWORD = "Majean2025";

const loginButton = document.getElementById("login-admin");
const passwordInput = document.getElementById("admin-password");
const adminPanel = document.getElementById("admin-panel");
const loginBox = document.querySelector(".admin-login");

loginButton.addEventListener("click", login);

passwordInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        login();
    }
});

function login() {

    if (passwordInput.value === PASSWORD) {

        loginBox.style.display = "none";
        adminPanel.style.display = "block";

    } else {

        alert("Mot de passe incorrect.");

    }

}
