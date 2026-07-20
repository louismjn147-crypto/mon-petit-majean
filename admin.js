document.addEventListener("DOMContentLoaded", function () {

    const PASSWORD = "Majean2025";

    const loginButton = document.getElementById("login-admin");
    const passwordInput = document.getElementById("admin-password");
    const loginBox = document.querySelector(".admin-login");
    const adminPanel = document.getElementById("admin-panel");

    let matchEnModification = null;

    if (!loginButton || !passwordInput || !loginBox || !adminPanel) {
        console.error("Éléments de connexion admin introuvables.");
        return;
    }

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

        if (!boutonAjouter) {
            console.error('Le bouton id="add-match" est introuvable.');
            return;
        }

        boutonAjouter.onclick = function () {

            const domicile = lireChamp("home-team");
            const exterieur = lireChamp("away-team");
            const date = lireChamp("match-date");
            const heure = lireChamp("match-time");

            const coteDomicile = lireNombre("home-odds");
            const coteNul = lireNombre("draw-odds");
            const coteExterieur = lireNombre("away-odds");

            if (
                domicile === "" ||
                exterieur === "" ||
                date === "" ||
                heure === ""
            ) {
                alert("Remplis les équipes, la date et l’heure.");
                return;
            }

            if (
                coteDomicile === null ||
                coteNul === null ||
                coteExterieur === null
            ) {
                alert(
                    "Les trois champs de cotes sont absents dans admin.html."
                );
                return;
            }

            if (
                coteDomicile <= 0 ||
                coteNul <= 0 ||
                coteExterieur <= 0
            ) {
                alert("Remplis correctement les trois cotes.");
                return;
            }

            const nouveauMatch = {
                homeTeam: domicile,
                awayTeam: exterieur,
                date: date,
                time: heure,
                homeOdds: coteDomicile,
                drawOdds: coteNul,
                awayOdds: coteExterieur
            };

            const matchs = obtenirMatchs();

            if (matchEnModification === null) {

                matchs.push(nouveauMatch);

                alert("✅ Match enregistré !");

            } else {

                matchs[matchEnModification] = nouveauMatch;

                matchEnModification = null;

                boutonAjouter.textContent = "Ajouter le match";

                alert("✅ Match modifié !");
            }

            enregistrerMatchs(matchs);
            viderFormulaire();
            afficherMatchs();
        };
    }

    function afficherMatchs() {

        const liste = document.getElementById("matches-list");

        if (!liste) {
            console.error(
                'Le bloc id="matches-list" est introuvable.'
            );
            return;
        }

        const matchs = obtenirMatchs();

        if (matchs.length === 0) {
            liste.innerHTML = "<p>Aucun match enregistré.</p>";
            return;
        }

        liste.innerHTML = "";

        matchs.forEach(function (match, index) {

            const coteDomicile =
                match.homeOdds ?? "Non renseignée";

            const coteNul =
                match.drawOdds ?? "Non renseignée";

            const coteExterieur =
                match.awayOdds ?? "Non renseignée";

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

                Victoire ${match.homeTeam} :
                ${coteDomicile} pts

                <br>

                Match nul :
                ${coteNul} pts

                <br>

                Victoire ${match.awayTeam} :
                ${coteExterieur} pts

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

        document
            .querySelectorAll(".edit-match-button")
            .forEach(function (bouton) {

                bouton.addEventListener("click", function () {

                    const index = Number(bouton.dataset.index);

                    modifierMatch(index);
                });
            });

        document
            .querySelectorAll(".delete-match-button")
            .forEach(function (bouton) {

                bouton.addEventListener("click", function () {

                    const index = Number(bouton.dataset.index);

                    supprimerMatch(index);
                });
            });
    }

    function modifierMatch(index) {

        const matchs = obtenirMatchs();
        const match = matchs[index];

        if (!match) {
            alert("Ce match est introuvable.");
            return;
        }

        remplirChamp("home-team", match.homeTeam);
        remplirChamp("away-team", match.awayTeam);
        remplirChamp("match-date", match.date);
        remplirChamp("match-time", match.time);

        remplirChamp("home-odds", match.homeOdds ?? "");
        remplirChamp("draw-odds", match.drawOdds ?? "");
        remplirChamp("away-odds", match.awayOdds ?? "");

        matchEnModification = index;

        const boutonAjouter =
            document.getElementById("add-match");

        if (boutonAjouter) {
            boutonAjouter.textContent =
                "Enregistrer les modifications";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function supprimerMatch(index) {

        const matchs = obtenirMatchs();

        if (!confirm("Veux-tu vraiment supprimer ce match ?")) {
            return;
        }

        matchs.splice(index, 1);

        enregistrerMatchs(matchs);

        if (matchEnModification === index) {

            matchEnModification = null;

            viderFormulaire();

            const boutonAjouter =
                document.getElementById("add-match");

            if (boutonAjouter) {
                boutonAjouter.textContent =
                    "Ajouter le match";
            }

        } else if (
            matchEnModification !== null &&
            matchEnModification > index
        ) {
            matchEnModification--;
        }

        afficherMatchs();
    }

    function obtenirMatchs() {

        try {
            return JSON.parse(
                localStorage.getItem("adminMatches")
            ) || [];
        } catch (erreur) {
            console.error(
                "Erreur lors de la lecture des matchs :",
                erreur
            );

            return [];
        }
    }

    function enregistrerMatchs(matchs) {

        localStorage.setItem(
            "adminMatches",
            JSON.stringify(matchs)
        );
    }

    function lireChamp(id) {

        const champ = document.getElementById(id);

        if (!champ) {
            return "";
        }

        return champ.value.trim();
    }

    function lireNombre(id) {

        const champ = document.getElementById(id);

        if (!champ) {
            return null;
        }

        if (champ.value.trim() === "") {
            return 0;
        }

        return Number(champ.value);
    }

    function remplirChamp(id, valeur) {

        const champ = document.getElementById(id);

        if (champ) {
            champ.value = valeur;
        }
    }

    function viderFormulaire() {

        remplirChamp("home-team", "");
        remplirChamp("away-team", "");
        remplirChamp("match-date", "");
        remplirChamp("match-time", "");

        remplirChamp("home-odds", "");
        remplirChamp("draw-odds", "");
        remplirChamp("away-odds", "");
    }

});
