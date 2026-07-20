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
    afficherMatchs();
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

        const nouveauMatch = {
    homeTeam: domicile,
    awayTeam: exterieur,
    date: date,
    time: heure
};

let matchs = JSON.parse(localStorage.getItem("adminMatches")) || [];

matchs.push(nouveauMatch);

localStorage.setItem("adminMatches", JSON.stringify(matchs));

afficherMatchs();

alert("✅ Match enregistré !");

document.getElementById("home-team").value = "";
document.getElementById("away-team").value = "";
document.getElementById("match-date").value = "";
document.getElementById("match-time").value = "";

    };

}
function afficherMatchs() {

    const liste = document.getElementById("matches-list");

    const matchs =
        JSON.parse(localStorage.getItem("adminMatches")) || [];

    if (matchs.length === 0) {

        liste.innerHTML = "<p>Aucun match enregistré.</p>";

        return;
    }

    liste.innerHTML = "";

    matchs.forEach(function(match, index) {

        liste.innerHTML += `
    <div style="
        background:#243244;
        padding:15px;
        border-radius:10px;
        margin-bottom:10px;
    ">

        <strong>${match.homeTeam}</strong>
        -
        <strong>${match.awayTeam}</strong>

        <br><br>

        ${match.date} à ${match.time}

        <br><br>

        <button onclick="supprimerMatch(${index})">
            🗑️ Supprimer
        </button>

    </div>
`;

    });

}
function supprimerMatch(index) {

    let matchs = JSON.parse(localStorage.getItem("adminMatches")) || [];

    if (!confirm("Supprimer ce match ?")) {
        return;
    }

    matchs.splice(index, 1);

    localStorage.setItem("adminMatches", JSON.stringify(matchs));

    afficherMatchs();

}
