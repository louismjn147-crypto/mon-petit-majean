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
const addMatchButton = document.getElementById("add-match");

addMatchButton.addEventListener("click", function () {

    const homeTeam = document.getElementById("home-team").value;
    const awayTeam = document.getElementById("away-team").value;
    const matchDate = document.getElementById("match-date").value;
    const matchTime = document.getElementById("match-time").value;

    alert(
        "Match créé :\n\n" +
        homeTeam +
        " - " +
        awayTeam +
        "\n" +
        matchDate +
        " " +
        matchTime
    );

});
