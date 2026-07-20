const PASSWORD = "Majean2025";

const loginButton = document.getElementById("login-admin");
const passwordInput = document.getElementById("admin-password");
const loginBox = document.querySelector(".admin-login");
const adminPanel = document.getElementById("admin-panel");

loginButton.addEventListener("click", login);

passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        login();
    }
});

function login() {

    if (passwordInput.value !== PASSWORD) {
        alert("Mot de passe incorrect.");
        return;
    }

    loginBox.style.display = "none";
    adminPanel.style.display = "block";

    initialiseAdmin();
}

function initialiseAdmin() {

    const boutonAjouter = document.getElementById("add-match");

    boutonAjouter.onclick = function () {

        const domicile = document.getElementById("home-team").value.trim();
        const exterieur = document.getElementById("away-team").value.trim();
        const date = document.getElementById("match-date").value;
        const heure = document.getElementById("match-time").value;

        if (
            domicile === "" ||
            exterieur === "" ||
            date === "" ||
            heure === ""
        ) {
            alert("Remplis tous les champs.");
            return;
        }

        alert(
            "✅ Match ajouté !\n\n" +
            domicile +
            " vs " +
            exterieur +
            "\n\n" +
            date +
            " à " +
            heure
        );

    };

}
