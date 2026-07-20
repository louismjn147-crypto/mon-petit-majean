const PASSWORD = "Majean2025";

const loginButton = document.getElementById("login-admin");
const passwordInput = document.getElementById("admin-password");
const loginBox = document.querySelector(".admin-login");
const adminPanel = document.getElementById("admin-panel");

let matchEnModification = null;

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
        const domicile = document
            .getElementById("home-team")
            .value.trim();

        const exterieur = document
            .getElementById("away-team")
            .value.trim();

        const date = document
            .getElementById("match-date")
            .value;

        const heure = document
            .getElementById("match-time")
            .value;

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

        const matchs =
            JSON.parse(localStorage.getItem("adminMatches")) || [];

        if (matchEnModification === null) {
            matchs.push(nouveauMatch);

            alert("✅ Match enregistré !");
        } else {
            matchs[matchEnModification] = nouveauMatch;

            matchEnModification = null;

            boutonAjouter.textContent = "Ajouter le match";

            alert("✅ Match modifié !");
        }

        localStorage.setItem(
            "adminMatches",
            JSON.stringify(matchs)
        );

        viderFormulaire();
        afficherMatchs();
    };
}

function afficherMatchs() {
    const liste = document.getElementById("matches-list");

    if (!liste) {
        console.error(
            'Le bloc <div id="matches-list"></div> est introuvable.'
        );

        return;
    }

    const matchs =
        JSON.parse(localStorage.getItem("adminMatches")) || [];

    if (matchs.length === 0) {
        liste.innerHTML = "<p>Aucun match enregistré.</p>";

        return;
    }

    liste.innerHTML = "";

    matchs.forEach(function (match, index) {
        const carte = document.createElement("div");

        carte.style.background = "#243244";
        carte.style.padding = "15px";
        carte.style.borderRadius = "10px";
        carte.style.marginBottom = "10px";

        carte.innerHTML = `
            <strong>${match.homeTeam}</strong>
            -
            <strong>${match.awayTeam}</strong>

            <br><br>

            ${match.date} à ${match.time}

            <br><br>

            <button
                type="button"
                class="edit-match-button"
                data-index="${index}"
            >
                ✏️ Modifier
            </button>

            <button
                type="button"
                class="delete-match-button"
                data-index="${index}"
            >
                🗑️ Supprimer
            </button>
        `;

        liste.appendChild(carte);
    });

    const boutonsModifier =
        document.querySelectorAll(".edit-match-button");

    boutonsModifier.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            const index = Number(bouton.dataset.index);

            modifierMatch(index);
        });
    });

    const boutonsSupprimer =
        document.querySelectorAll(".delete-match-button");

    boutonsSupprimer.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            const index = Number(bouton.dataset.index);

            supprimerMatch(index);
        });
    });
}

function modifierMatch(index) {
    const matchs =
        JSON.parse(localStorage.getItem("adminMatches")) || [];

    const match = matchs[index];

    if (!match) {
        alert("Ce match est introuvable.");
        return;
    }

    document.getElementById("home-team").value =
        match.homeTeam;

    document.getElementById("away-team").value =
        match.awayTeam;

    document.getElementById("match-date").value =
        match.date;

    document.getElementById("match-time").value =
        match.time;

    matchEnModification = index;

    document.getElementById("add-match").textContent =
        "Enregistrer les modifications";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function supprimerMatch(index) {
    const matchs =
        JSON.parse(localStorage.getItem("adminMatches")) || [];

    if (!confirm("Veux-tu vraiment supprimer ce match ?")) {
        return;
    }

    matchs.splice(index, 1);

    localStorage.setItem(
        "adminMatches",
        JSON.stringify(matchs)
    );

    if (matchEnModification === index) {
        matchEnModification = null;

        viderFormulaire();

        document.getElementById("add-match").textContent =
            "Ajouter le match";
    } else if (
        matchEnModification !== null &&
        matchEnModification > index
    ) {
        matchEnModification--;
    }

    afficherMatchs();
}

function viderFormulaire() {
    document.getElementById("home-team").value = "";
    document.getElementById("away-team").value = "";
    document.getElementById("match-date").value = "";
    document.getElementById("match-time").value = "";
}
