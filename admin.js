document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    const ADMIN_UID = "JpxPZLROVTciu2tgUzXH7ZQ79303";

    const firebaseConfig = {
        apiKey: "AIzaSyCYWClCA7W4d1WZDt3gpTMOgtc6UNfqRcQ",
        authDomain: "mon-petit-majean-82a7d.firebaseapp.com",
        projectId: "mon-petit-majean-82a7d",
        storageBucket: "mon-petit-majean-82a7d.firebasestorage.app",
        messagingSenderId: "687822253256",
        appId: "1:687822253256:web:18f9a763fa3522f90e09fd"
    };

    const [
        appModule,
        authModule,
        firestoreModule
    ] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
    ]);

    const app = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);

    const emailInput = document.getElementById("admin-email");
    const passwordInput = document.getElementById("admin-password");
    const loginButton = document.getElementById("login-admin");
    const loginBox = document.querySelector(".admin-login");
    const adminPanel = document.getElementById("admin-panel");
    const addButton = document.getElementById("add-match");
    const matchesList = document.getElementById("matches-list");

    let editingMatchId = null;
    let stopListening = null;

    loginButton.addEventListener("click", connecterAdmin);

    passwordInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            connecterAdmin();
        }
    });

    addButton.addEventListener("click", enregistrerMatch);

    authModule.onAuthStateChanged(auth, function (user) {
        if (user && user.uid === ADMIN_UID) {
            ouvrirAdmin();
        } else {
            fermerAdmin();
        }
    });

    async function connecterAdmin() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Entre l’e-mail et le mot de passe administrateur.");
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Connexion…";

        try {
            const resultat =
                await authModule.signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            if (resultat.user.uid !== ADMIN_UID) {
                await authModule.signOut(auth);
                alert("Ce compte n’est pas autorisé à administrer le site.");
                return;
            }

            passwordInput.value = "";
        } catch (erreur) {
            console.error(erreur);
            alert("E-mail ou mot de passe incorrect.");
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Connexion";
        }
    }

    function ouvrirAdmin() {
        loginBox.style.display = "none";
        adminPanel.style.display = "block";
        ecouterMatchs();
    }

    function fermerAdmin() {
        loginBox.style.display = "block";
        adminPanel.style.display = "none";

        if (stopListening) {
            stopListening();
            stopListening = null;
        }
    }

    function ecouterMatchs() {
        if (stopListening) {
            stopListening();
        }

        const requete = firestoreModule.query(
            firestoreModule.collection(db, "matches"),
            firestoreModule.orderBy("kickoff", "asc")
        );

        stopListening = firestoreModule.onSnapshot(
            requete,
            function (snapshot) {
                const matchs = snapshot.docs.map(function (document) {
                    return {
                        id: document.id,
                        ...document.data()
                    };
                });

                afficherMatchs(matchs);
            },
            function (erreur) {
                console.error(erreur);
                matchesList.innerHTML =
                    "<p>Impossible de charger les matchs.</p>";
            }
        );
    }

    async function enregistrerMatch() {
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert("Tu dois être connecté avec le compte administrateur.");
            return;
        }

        const homeTeam = lireChamp("home-team");
        const awayTeam = lireChamp("away-team");
        const date = lireChamp("match-date");
        const time = lireChamp("match-time");

        const homeOdds = lireNombre("home-odds");
        const drawOdds = lireNombre("draw-odds");
        const awayOdds = lireNombre("away-odds");

        if (!homeTeam || !awayTeam || !date || !time) {
            alert("Remplis les équipes, la date et l’heure.");
            return;
        }

        if (
            homeOdds === null ||
            drawOdds === null ||
            awayOdds === null ||
            homeOdds <= 0 ||
            drawOdds <= 0 ||
            awayOdds <= 0
        ) {
            alert("Remplis correctement les trois cotes.");
            return;
        }

        const donneesMatch = {
            homeTeam,
            awayTeam,
            date,
            time,
            kickoff: `${date}T${time}:00`,
            homeOdds,
            drawOdds,
            awayOdds,
            updatedAt: firestoreModule.serverTimestamp()
        };

        addButton.disabled = true;
        addButton.textContent = "Enregistrement…";

        try {
            if (editingMatchId) {
                await firestoreModule.updateDoc(
                    firestoreModule.doc(
                        db,
                        "matches",
                        editingMatchId
                    ),
                    donneesMatch
                );

                alert("✅ Match modifié !");
            } else {
                await firestoreModule.addDoc(
                    firestoreModule.collection(db, "matches"),
                    {
                        ...donneesMatch,
                        createdAt: firestoreModule.serverTimestamp()
                    }
                );

                alert("✅ Match ajouté !");
            }

            editingMatchId = null;
            viderFormulaire();
        } catch (erreur) {
            console.error(erreur);
            alert("Impossible d’enregistrer le match dans Firebase.");
        } finally {
            addButton.disabled = false;
            addButton.textContent = "Ajouter le match";
        }
    }

    function afficherMatchs(matchs) {
        if (matchs.length === 0) {
            matchesList.innerHTML = "<p>Aucun match enregistré.</p>";
            return;
        }

        matchesList.innerHTML = "";

        matchs.forEach(function (match) {
            const carte = document.createElement("div");

            carte.style.background = "#243244";
            carte.style.padding = "15px";
            carte.style.borderRadius = "10px";
            carte.style.marginBottom = "10px";

            carte.innerHTML = `
                <strong>${echapper(match.homeTeam)}</strong>
                -
                <strong>${echapper(match.awayTeam)}</strong>

                <br><br>

                ${echapper(match.date)} à ${echapper(match.time)}

                <br><br>

                Victoire ${echapper(match.homeTeam)} :
                ${match.homeOdds} pts

                <br>

                Match nul :
                ${match.drawOdds} pts

                <br>

                Victoire ${echapper(match.awayTeam)} :
                ${match.awayOdds} pts

                <br><br>

                <button type="button" class="edit-match-button">
                    ✏️ Modifier
                </button>

                <button type="button" class="delete-match-button">
                    🗑️ Supprimer
                </button>
            `;

            carte
                .querySelector(".edit-match-button")
                .addEventListener("click", function () {
                    modifierMatch(match);
                });

            carte
                .querySelector(".delete-match-button")
                .addEventListener("click", function () {
                    supprimerMatch(match.id);
                });

            matchesList.appendChild(carte);
        });
    }

    function modifierMatch(match) {
        remplirChamp("home-team", match.homeTeam);
        remplirChamp("away-team", match.awayTeam);
        remplirChamp("match-date", match.date);
        remplirChamp("match-time", match.time);
        remplirChamp("home-odds", match.homeOdds);
        remplirChamp("draw-odds", match.drawOdds);
        remplirChamp("away-odds", match.awayOdds);

        editingMatchId = match.id;
        addButton.textContent = "Enregistrer les modifications";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    async function supprimerMatch(matchId) {
        if (!confirm("Veux-tu vraiment supprimer ce match ?")) {
            return;
        }

        try {
            await firestoreModule.deleteDoc(
                firestoreModule.doc(db, "matches", matchId)
            );

            if (editingMatchId === matchId) {
                editingMatchId = null;
                viderFormulaire();
            }
        } catch (erreur) {
            console.error(erreur);
            alert("Impossible de supprimer le match.");
        }
    }

    function lireChamp(id) {
        return document.getElementById(id)?.value.trim() || "";
    }

    function lireNombre(id) {
        const valeur = document.getElementById(id)?.value.trim();

        if (!valeur) {
            return null;
        }

        const nombre = Number(valeur);

        return Number.isFinite(nombre) ? nombre : null;
    }

    function remplirChamp(id, valeur) {
        const champ = document.getElementById(id);

        if (champ) {
            champ.value = valeur ?? "";
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

        editingMatchId = null;
        addButton.textContent = "Ajouter le match";
    }

    function echapper(valeur) {
        return String(valeur ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});
