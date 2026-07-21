/*
 * Firebase + interface de connexion.
 * Les boutons et la fenêtre sont branchés AVANT le chargement de Firebase,
 * donc la fenêtre s'ouvre même si le réseau ou Firebase rencontre une erreur.
 */

const modal = document.getElementById("auth-modal");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");
const authOpenButton = document.getElementById("auth-open-button");
const logoutButton = document.getElementById("logout-button");
const closeButton = document.getElementById("auth-close-button");
const loginTab = document.getElementById("show-login");
const registerTab = document.getElementById("show-register");

let currentUser = null;
let firebaseServices = null;

function showMessage(message, isError = true) {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.classList.toggle("auth-message-error", isError);
    authMessage.classList.toggle("auth-message-success", !isError);
}

function clearMessage() {
    if (!authMessage) return;
    authMessage.textContent = "";
    authMessage.classList.remove("auth-message-error", "auth-message-success");
}

function openAuthModal() {
    if (!modal) return;
    modal.classList.add("auth-modal-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-is-open");
}

function closeAuthModal() {
    if (!modal) return;
    modal.classList.remove("auth-modal-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-is-open");
    clearMessage();
}

function showForm(mode) {
    const loginMode = mode === "login";
    loginForm?.classList.toggle("auth-form-hidden", !loginMode);
    registerForm?.classList.toggle("auth-form-hidden", loginMode);
    loginTab?.classList.toggle("active", loginMode);
    registerTab?.classList.toggle("active", !loginMode);
    clearMessage();
}

function initials(name) {
    return (name || "J")
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function updatePlayerInterface(user, profile = {}) {
    const pseudo = profile.pseudo || user?.displayName || "Joueur";
    const initial = initials(pseudo);

    document.querySelectorAll("[data-player-name]").forEach((element) => {
        element.textContent = user ? pseudo : "Connexion";
    });

    document.querySelectorAll("[data-player-avatar]").forEach((element) => {
        element.textContent = user ? initial : "?";
    });

    const profileStatus = document.getElementById("profile-status");
    if (profileStatus) {
        profileStatus.textContent = user
            ? user.email || "Joueur de la ligue privée"
            : "Connecte-toi pour sauvegarder tes pronostics";
    }

    authOpenButton?.classList.toggle("auth-hidden", Boolean(user));
    logoutButton?.classList.toggle("auth-hidden", !user);
}

// Branchement immédiat de l'interface : aucun import Firebase nécessaire.
authOpenButton?.addEventListener("click", openAuthModal);
closeButton?.addEventListener("click", closeAuthModal);
loginTab?.addEventListener("click", () => showForm("login"));
registerTab?.addEventListener("click", () => showForm("register"));
modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeAuthModal();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("auth-modal-open")) {
        closeAuthModal();
    }
});

window.mpmFirebase = {
    currentUser: () => currentUser,
    openAuthModal,
    savePredictions: async () => {
        throw new Error("Firebase est encore en cours de chargement.");
    }
};

async function startFirebase() {
    try {
        const [appModule, authModule, firestoreModule] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
        ]);

        const firebaseConfig = {
            apiKey: "AIzaSyCYWClCA7W4d1WZDt3gpTMOgtc6UNfqRcQ",
            authDomain: "mon-petit-majean-82a7d.firebaseapp.com",
            projectId: "mon-petit-majean-82a7d",
            storageBucket: "mon-petit-majean-82a7d.firebasestorage.app",
            messagingSenderId: "687822253256",
            appId: "1:687822253256:web:18f9a763fa3522f90e09fd"
        };

        const app = appModule.initializeApp(firebaseConfig);
        const auth = authModule.getAuth(app);
        const db = firestoreModule.getFirestore(app);

        firebaseServices = { auth, db, authModule, firestoreModule };

        async function loadUserData(user) {
            const userRef = firestoreModule.doc(db, "users", user.uid);
            const snapshot = await firestoreModule.getDoc(userRef);

            if (!snapshot.exists()) {
                const profile = {
                    pseudo: user.displayName || "Joueur",
                    email: user.email,
                    points: 0,
                    predictions: {},
                    createdAt: firestoreModule.serverTimestamp()
                };
                await firestoreModule.setDoc(userRef, profile, { merge: true });
                return { profile, predictions: {} };
            }

            const data = snapshot.data();
            return { profile: data, predictions: data.predictions || {} };
        }

        async function savePredictions(predictions) {
            if (!auth.currentUser) {
                openAuthModal();
                throw new Error("Connecte-toi pour enregistrer ton pronostic.");
            }

            await firestoreModule.setDoc(
                firestoreModule.doc(db, "users", auth.currentUser.uid),
                { predictions, updatedAt: firestoreModule.serverTimestamp() },
                { merge: true }
            );
        }

        window.mpmFirebase = {
            currentUser: () => currentUser,
            openAuthModal,
            savePredictions
        };

        logoutButton?.addEventListener("click", async () => {
            await authModule.signOut(auth);
        });

        loginForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessage();

            const email = loginForm.elements.email.value.trim();
            const password = loginForm.elements.password.value;

            try {
                await authModule.signInWithEmailAndPassword(auth, email, password);
                closeAuthModal();
                loginForm.reset();
            } catch (error) {
                console.error(error);
                showMessage("Connexion impossible. Vérifie ton e-mail et ton mot de passe.");
            }
        });

        registerForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessage();

            const pseudo = registerForm.elements.pseudo.value.trim();
            const email = registerForm.elements.email.value.trim();
            const password = registerForm.elements.password.value;
            const confirmation = registerForm.elements.confirmation.value;

            if (pseudo.length < 2) return showMessage("Le pseudo doit contenir au moins 2 caractères.");
            if (password.length < 6) return showMessage("Le mot de passe doit contenir au moins 6 caractères.");
            if (password !== confirmation) return showMessage("Les deux mots de passe ne correspondent pas.");

            try {
                const credential = await authModule.createUserWithEmailAndPassword(auth, email, password);
                await authModule.updateProfile(credential.user, { displayName: pseudo });
                await firestoreModule.setDoc(
                    firestoreModule.doc(db, "users", credential.user.uid),
                    {
                        pseudo,
                        email,
                        points: 0,
                        predictions: {},
                        createdAt: firestoreModule.serverTimestamp()
                    },
                    { merge: true }
                );
                closeAuthModal();
                registerForm.reset();
            } catch (error) {
                console.error(error);
                showMessage(
                    error.code === "auth/email-already-in-use"
                        ? "Cette adresse e-mail possède déjà un compte."
                        : "Inscription impossible. Vérifie les informations saisies."
                );
            }
        });

        authModule.onAuthStateChanged(auth, async (user) => {
            currentUser = user;

            if (!user) {
                updatePlayerInterface(null);
                window.dispatchEvent(new CustomEvent("mpm-auth-change", {
                    detail: { user: null, profile: null, predictions: {} }
                }));
                return;
            }

            try {
                const { profile, predictions } = await loadUserData(user);
                updatePlayerInterface(user, profile);
                window.dispatchEvent(new CustomEvent("mpm-auth-change", {
                    detail: { user, profile, predictions }
                }));
            } catch (error) {
                console.error("Erreur de chargement du compte :", error);
                updatePlayerInterface(user, {});
            }
        });
    } catch (error) {
        console.error("Firebase n'a pas pu être chargé :", error);
        showMessage("La fenêtre fonctionne, mais Firebase n'a pas pu se charger. Recharge la page avec Ctrl + F5.");
    }
}

startFirebase();
