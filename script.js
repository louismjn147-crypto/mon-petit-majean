document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const EXACT_SCORE_BONUS = 150;
    const STORAGE_KEY = "monPetitMajeanPredictionsV20";

    const ADMIN_MATCHES_KEY = "adminMatches";

    let matches = loadAdminMatches();

    let matches = [];
let arreterEcouteMatchs = null;

async function chargerMatchsFirebase() {
    try {
        const [appModule, firestoreModule] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
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

        const app = appModule.getApps().length
            ? appModule.getApp()
            : appModule.initializeApp(firebaseConfig);

        const db = firestoreModule.getFirestore(app);

        const collectionMatchs =
            firestoreModule.collection(db, "matches");

        arreterEcouteMatchs = firestoreModule.onSnapshot(
            collectionMatchs,

            function (snapshot) {
                matches = snapshot.docs
                    .map(function (document, index) {
                        return convertAdminMatch(
                            {
                                id: document.id,
                                ...document.data()
                            },
                            index
                        );
                    })
                    .sort(function (premierMatch, deuxiemeMatch) {
                        const dateA = premierMatch.kickoff || "";
                        const dateB = deuxiemeMatch.kickoff || "";

                        return dateA.localeCompare(dateB);
                    });

                console.log(
                    `✅ ${matches.length} match(s) chargé(s) depuis Firebase`
                );

                renderMatches();
                renderMyPredictions();
            },

            function (erreur) {
                console.error(
                    "Impossible de charger les matchs Firebase :",
                    erreur
                );

                if (matchesContainer) {
                    matchesContainer.innerHTML = `
                        <p>
                            Impossible de charger les matchs.
                            Recharge la page.
                        </p>
                    `;
                }
            }
        );
    } catch (erreur) {
        console.error(
            "Erreur pendant le chargement de Firebase :",
            erreur
        );
    }
}

    function loadAdminMatches() {
        try {
            const savedData = localStorage.getItem(ADMIN_MATCHES_KEY);
            if (!savedData) return [];

            const adminMatches = JSON.parse(savedData);
            if (!Array.isArray(adminMatches)) return [];

            return adminMatches.map((match, index) =>
                convertAdminMatch(match, index)
            );
        } catch (error) {
            console.error("Erreur lors du chargement des matchs admin :", error);
            return [];
        }
    }

    function convertAdminMatch(match, index) {
        const homeTeam = String(match.homeTeam || "Équipe domicile").trim();
        const awayTeam = String(match.awayTeam || "Équipe extérieure").trim();
        const rawDate = String(match.date || "").trim();
        const rawTime = String(match.time || "").trim();

        return {
            id: match.id || createMatchId(homeTeam, awayTeam, rawDate, rawTime, index),
            competition: "Ligue des champions",
            stage: match.stage || "Phase de ligue",
            date: formatMatchDate(rawDate),
            time: formatMatchTime(rawTime),
            kickoff: rawDate && rawTime ? `${rawDate}T${rawTime}:00` : null,
            homeTeam,
            homeShort: createTeamShortName(homeTeam),
            homeLogo: getTeamLogo(homeTeam),
            awayTeam,
            awayShort: createTeamShortName(awayTeam),
            awayLogo: getTeamLogo(awayTeam),
            odds: {
                home: Number(match.homeOdds) || 0,
                draw: Number(match.drawOdds) || 0,
                away: Number(match.awayOdds) || 0
            },
            finalScore:
                match.homeScore !== undefined &&
                match.homeScore !== null &&
                match.homeScore !== "" &&
                match.awayScore !== undefined &&
                match.awayScore !== null &&
                match.awayScore !== ""
                    ? {
                        home: Number(match.homeScore),
                        away: Number(match.awayScore)
                    }
                    : null
        };
    }

    function createMatchId(homeTeam, awayTeam, date, time, index) {
        return `${homeTeam}-${awayTeam}-${date}-${time}-${index}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function createTeamShortName(teamName) {
        const ignoredWords = ["fc", "cf", "ac", "as", "rc", "sc", "club"];
        const words = teamName.split(/\s+/).filter(Boolean);
        const usefulWords = words.filter(
            (word) => !ignoredWords.includes(word.toLowerCase())
        );
        const sourceWords = usefulWords.length > 0 ? usefulWords : words;

        if (sourceWords.length === 1) {
            return sourceWords[0].slice(0, 3).toUpperCase();
        }

        return sourceWords
            .map((word) => word.charAt(0))
            .join("")
            .slice(0, 3)
            .toUpperCase();
    }

    function normalizeTeamName(teamName) {
        return teamName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    function getTeamLogo(teamName) {
        const logos = {
            parissg: "logos/psg.png",
            psg: "logos/psg.png",
            realmadrid: "logos/madrid.png",
            manchestercity: "logos/manchester.jpg",
            mancity: "logos/manchester.jpg",
            intermilano: "logos/inter.png",
            inter: "logos/inter.png",
            rclens: "logos/rclens.jpg",
            lens: "logos/rclens.jpg",
            bayernmunich: "logos/munich.jpg",
            bayern: "logos/munich.jpg",
            arsenal: "logos/arsenal.png"
        };

        return logos[normalizeTeamName(teamName)] || "";
    }

    function formatMatchDate(dateText) {
        if (!dateText) return "Date à définir";

        const date = new Date(`${dateText}T12:00:00`);
        if (Number.isNaN(date.getTime())) return dateText;

        const formattedDate = date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

        return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    function formatMatchTime(timeText) {
        return timeText ? timeText.replace(":", "h") : "Heure à définir";
    }

    function renderTeamLogo(logoPath, shortName, teamName) {
        const safeShortName = escapeHtml(shortName || "?");

        if (!logoPath) {
            return `
                <span
                    class="team-logo-fallback"
                    aria-label="${escapeHtml(teamName)}"
                    style="width:42px;height:42px;min-width:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:rgba(255,255,255,0.12);"
                >${safeShortName}</span>
            `;
        }

        return `
            <img
                src="${escapeHtml(logoPath)}"
                alt="${escapeHtml(teamName)}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                style="width:42px;height:42px;max-width:42px;max-height:42px;object-fit:contain;display:block;"
            >
            <span
                class="team-logo-fallback"
                aria-hidden="true"
                style="width:42px;height:42px;min-width:42px;border-radius:50%;display:none;align-items:center;justify-content:center;font-weight:800;background:rgba(255,255,255,0.12);"
            >${safeShortName}</span>
        `;
    }

    const matchesContainer = document.getElementById(
        "matches-container"
    );

    const predictionsContainer = document.getElementById(
        "my-predictions-container"
    );

    const matchCount = document.getElementById("match-count");

    let predictions = loadPredictions();

    function loadPredictions() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) {
                return {};
            }

            const parsedData = JSON.parse(savedData);

            if (
                typeof parsedData !== "object" ||
                parsedData === null ||
                Array.isArray(parsedData)
            ) {
                return {};
            }

            return parsedData;
        } catch (error) {
            console.error(
                "Erreur lors du chargement des pronostics :",
                error
            );

            return {};
        }
    }

    function savePredictions() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(predictions)
            );
        } catch (error) {
            console.error(
                "Erreur lors de l'enregistrement :",
                error
            );

            alert(
                "Le pronostic n'a pas pu être enregistré."
            );
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getMatchById(matchId) {
        return matches.find((match) => match.id === matchId);
    }

    function isValidScore(score) {
        return (
            Number.isInteger(score) &&
            score >= 0 &&
            score <= 20
        );
    }

    function getOutcome(homeScore, awayScore) {
        if (homeScore > awayScore) {
            return "home";
        }

        if (homeScore < awayScore) {
            return "away";
        }

        return "draw";
    }

    function getOutcomeLabel(match, outcome) {
        if (outcome === "home") {
            return `Victoire ${match.homeTeam}`;
        }

        if (outcome === "away") {
            return `Victoire ${match.awayTeam}`;
        }

        return "Match nul";
    }

    function getOutcomePoints(match, outcome) {
        return match.odds[outcome];
    }

    function calculatePredictionResult(match, prediction) {
        if (!match.finalScore) {
            return {
                status: "pending",
                label: "Résultat en attente",
                points: null
            };
        }

        const realHomeScore = match.finalScore.home;
        const realAwayScore = match.finalScore.away;

        const realOutcome = getOutcome(
            realHomeScore,
            realAwayScore
        );

        const predictedOutcome = getOutcome(
            prediction.homeScore,
            prediction.awayScore
        );

        const exactScore =
            prediction.homeScore === realHomeScore &&
            prediction.awayScore === realAwayScore;

        if (exactScore) {
            return {
                status: "exact",
                label: "Score exact",
                points:
                    getOutcomePoints(match, realOutcome) +
                    EXACT_SCORE_BONUS
            };
        }

        if (predictedOutcome === realOutcome) {
            return {
                status: "correct",
                label: "Bon résultat",
                points: getOutcomePoints(match, realOutcome)
            };
        }

        return {
            status: "wrong",
            label: "Mauvais résultat",
            points: 0
        };
    }

    function renderMatches() {
        if (!matchesContainer) {
            return;
        }

        if (matchCount) {
            matchCount.textContent =
                `${matches.length} matchs`;
        }

        matchesContainer.innerHTML = matches
            .map((match) => {
                const prediction = predictions[match.id];

                return `
                    <article class="match-card">

                        <div class="match-topline">

                            <div class="match-context">
                                <span class="champions-star">
                                    ★
                                </span>

                                <span>
                                    ${escapeHtml(match.stage)}
                                </span>
                            </div>

                            <time class="match-time">
                                ${escapeHtml(match.date)}
                                ·
                                ${escapeHtml(match.time)}
                            </time>

                        </div>

                        ${
                            prediction
                                ? renderSavedPrediction(
                                    match,
                                    prediction
                                )
                                : renderPredictionForm(match)
                        }

                    </article>
                `;
            })
            .join("");

        bindPredictionInputs();
        bindSaveButtons();
        bindEditButtons();
    }

    function renderPredictionForm(match) {
        const locked = isMatchLocked(match);
        return `
            <div class="match-content">

                <div class="match-team match-team-home">
                    ${renderTeamLogo(
                        match.homeLogo,
                        match.homeShort,
                        match.homeTeam
                    )}

                    <strong class="team-name">
                        ${escapeHtml(match.homeTeam)}
                    </strong>

                    <span class="team-odds">
                        ${match.odds.home} pts
                    </span>

                </div>

                <div class="prediction-center">

                    <span class="prediction-label">
                        Ton score
                    </span>

                    <div class="score-selector">

                        <input
                            type="number"
                            min="0"
                            max="20"
                            inputmode="numeric"
                            autocomplete="off"
                            class="score-input"
                            ${locked ? "disabled" : ""}
                            data-home-input="${escapeHtml(match.id)}"
                            aria-label="Score de ${escapeHtml(match.homeTeam)}"
                        >

                        <span class="score-separator">
                            -
                        </span>

                        <input
                            type="number"
                            min="0"
                            max="20"
                            inputmode="numeric"
                            autocomplete="off"
                            class="score-input"
                            ${locked ? "disabled" : ""}
                            data-away-input="${escapeHtml(match.id)}"
                            aria-label="Score de ${escapeHtml(match.awayTeam)}"
                        >

                    </div>

                    <span
                        class="prediction-points"
                        id="prediction-points-${escapeHtml(match.id)}"
                    >
                        Entre ton pronostic
                    </span>

                </div>

                <div class="match-team match-team-away">
                    ${renderTeamLogo(
                        match.awayLogo,
                        match.awayShort,
                        match.awayTeam
                    )}

                    <strong class="team-name">
                        ${escapeHtml(match.awayTeam)}
                    </strong>

                    <span class="team-odds">
                        ${match.odds.away} pts
                    </span>

                </div>

            </div>

            <div class="match-footer">

                <div class="draw-information">
                    <span>Match nul</span>
                    <strong>${match.odds.draw} pts</strong>
                </div>

                <div class="bonus-information">
                    <span>Score exact</span>
                    <strong>+${EXACT_SCORE_BONUS} pts</strong>
                </div>

                <button
    type="button"
    class="save-prediction-button"
    ${locked ? "disabled" : ""}
    data-save-match="${escapeHtml(match.id)}"
>
    ${locked ? "Pronostics fermés" : "Valider"}
</button>

            </div>
        `;
    }

    function renderSavedPrediction(match, prediction) {
        const outcomeLabel = getOutcomeLabel(
            match,
            prediction.outcome
        );

        const exactScorePoints =
            prediction.basePoints + EXACT_SCORE_BONUS;

        const result = calculatePredictionResult(
            match,
            prediction
        );

        return `
            <div class="match-content saved-match-content">

                <div class="match-team match-team-home">
                    ${renderTeamLogo(
                        match.homeLogo,
                        match.homeShort,
                        match.homeTeam
                    )}

                    <strong class="team-name">
                        ${escapeHtml(match.homeTeam)}
                    </strong>

                    <span class="team-odds">
                        ${match.odds.home} pts
                    </span>

                </div>

                <div class="prediction-center">

                    <span class="prediction-label">
                        Mon pronostic
                    </span>

                    <div class="saved-score">
                        <span>
                            ${prediction.homeScore}
                        </span>

                        <strong>-</strong>

                        <span>
                            ${prediction.awayScore}
                        </span>
                    </div>

                    <span class="prediction-points">
                        ${escapeHtml(outcomeLabel)}
                    </span>

                </div>

                <div class="match-team match-team-away">
                    ${renderTeamLogo(
                        match.awayLogo,
                        match.awayShort,
                        match.awayTeam
                    )}

                    <strong class="team-name">
                        ${escapeHtml(match.awayTeam)}
                    </strong>

                    <span class="team-odds">
                        ${match.odds.away} pts
                    </span>

                </div>

            </div>

            <div class="saved-prediction-footer">

                <div class="saved-points-information">

                    <span>
                        Bon résultat
                    </span>

                    <strong>
                        ${prediction.basePoints} pts
                    </strong>

                </div>

                <div class="saved-points-information">

                    <span>
                        Score exact
                    </span>

                    <strong>
                        ${exactScorePoints} pts
                    </strong>

                </div>

                ${renderResultStatus(result)}

                ${
                    match.finalScore
                        ? ""
                        : `
                            <button
                                type="button"
                                class="edit-prediction-button"
                                data-edit-match="${escapeHtml(match.id)}"
                            >
                                Modifier
                            </button>
                        `
                }

            </div>
        `;
    }

    function renderResultStatus(result) {
        if (result.points === null) {
            return `
                <div class="result-status result-pending">
                    Résultat en attente
                </div>
            `;
        }

        return `
            <div class="result-status result-${result.status}">
                <span>
                    ${escapeHtml(result.label)}
                </span>

                <strong>
                    ${result.points} pts
                </strong>
            </div>
        `;
    }

    function bindPredictionInputs() {
        matches.forEach((match) => {
            const homeInput = document.querySelector(
                `[data-home-input="${match.id}"]`
            );

            const awayInput = document.querySelector(
                `[data-away-input="${match.id}"]`
            );

            if (!homeInput || !awayInput) {
                return;
            }

            const updatePointsPreview = () => {
                const preview = document.getElementById(
                    `prediction-points-${match.id}`
                );

                if (!preview) {
                    return;
                }

                const homeValue = homeInput.value.trim();
                const awayValue = awayInput.value.trim();

                if (
                    homeValue === "" ||
                    awayValue === ""
                ) {
                    preview.textContent =
                        "Entre ton pronostic";

                    return;
                }

                const homeScore = Number(homeValue);
                const awayScore = Number(awayValue);

                if (
                    !isValidScore(homeScore) ||
                    !isValidScore(awayScore)
                ) {
                    preview.textContent =
                        "Score entre 0 et 20";

                    return;
                }

                const outcome = getOutcome(
                    homeScore,
                    awayScore
                );

                const basePoints = getOutcomePoints(
                    match,
                    outcome
                );

                preview.innerHTML = `
                    ${basePoints} pts
                    <span>·</span>
                    Exact ${basePoints + EXACT_SCORE_BONUS} pts
                `;
            };

            homeInput.addEventListener(
                "input",
                updatePointsPreview
            );

            awayInput.addEventListener(
                "input",
                updatePointsPreview
            );
        });
    }

    function bindSaveButtons() {
        const buttons = document.querySelectorAll(
            "[data-save-match]"
        );

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const matchId = button.dataset.saveMatch;

                savePrediction(matchId);
            });
        });
    }

    function savePrediction(matchId) {
        const match = getMatchById(matchId);

        if (!match) {
            alert("Match introuvable.");
            return;
        }

        const homeInput = document.querySelector(
            `[data-home-input="${matchId}"]`
        );

        const awayInput = document.querySelector(
            `[data-away-input="${matchId}"]`
        );

        if (!homeInput || !awayInput) {
            alert("Les cases de score sont introuvables.");
            return;
        }

        const homeValue = homeInput.value.trim();
        const awayValue = awayInput.value.trim();

        if (homeValue === "" || awayValue === "") {
            alert("Entre le score des deux équipes.");
            return;
        }

        const homeScore = Number(homeValue);
        const awayScore = Number(awayValue);

        if (
            !isValidScore(homeScore) ||
            !isValidScore(awayScore)
        ) {
            alert(
                "Le score doit être un nombre entier entre 0 et 20."
            );

            return;
        }

        const outcome = getOutcome(
            homeScore,
            awayScore
        );

        predictions[matchId] = {
            homeScore,
            awayScore,
            outcome,
            basePoints: getOutcomePoints(match, outcome),
            savedAt: new Date().toISOString()
        };

        savePredictions();
        renderMatches();
        renderMyPredictions();

        const predictionsSection = document.getElementById(
            "mes-pronos"
        );

        predictionsSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function bindEditButtons() {
        const buttons = document.querySelectorAll(
            "[data-edit-match]"
        );

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const matchId = button.dataset.editMatch;
                const prediction = predictions[matchId];

                if (!prediction) {
                    return;
                }

                delete predictions[matchId];

                savePredictions();
                renderMatches();
                renderMyPredictions();

                requestAnimationFrame(() => {
                    const homeInput = document.querySelector(
                        `[data-home-input="${matchId}"]`
                    );

                    const awayInput = document.querySelector(
                        `[data-away-input="${matchId}"]`
                    );

                    if (homeInput) {
                        homeInput.value =
                            prediction.homeScore;
                    }

                    if (awayInput) {
                        awayInput.value =
                            prediction.awayScore;
                    }

                    homeInput?.dispatchEvent(
                        new Event("input")
                    );

                    homeInput?.focus();
                });
            });
        });
    }

    function renderMyPredictions() {
        if (!predictionsContainer) {
            return;
        }

        const savedEntries = matches
            .filter((match) => predictions[match.id])
            .map((match) => ({
                match,
                prediction: predictions[match.id]
            }));

        if (savedEntries.length === 0) {
            predictionsContainer.innerHTML = `
                <div class="empty-card">
                    Aucun pronostic enregistré.
                </div>
            `;

            return;
        }

        predictionsContainer.innerHTML = savedEntries
            .map(({ match, prediction }) => {
                const result = calculatePredictionResult(
                    match,
                    prediction
                );

                const pointsText =
                    result.points === null
                        ? `${prediction.basePoints} pts possibles`
                        : `${result.points} pts gagnés`;

                return `
                    <article class="prediction-summary">

                        <div class="prediction-summary-date">
                            <span>
                                ${escapeHtml(match.date)}
                            </span>

                            <small>
                                ${escapeHtml(match.time)}
                            </small>
                        </div>

                        <div class="prediction-summary-match">

                            <div class="summary-team">
                                <span class="summary-team-code">
                                    ${escapeHtml(match.homeShort)}
                                </span>

                                <strong>
                                    ${escapeHtml(match.homeTeam)}
                                </strong>
                            </div>

                            <div class="summary-score">
                                ${prediction.homeScore}
                                -
                                ${prediction.awayScore}
                            </div>

                            <div class="summary-team summary-team-away">
                                <span class="summary-team-code">
                                    ${escapeHtml(match.awayShort)}
                                </span>

                                <strong>
                                    ${escapeHtml(match.awayTeam)}
                                </strong>
                            </div>

                        </div>

                        <div class="prediction-summary-points">

                            <strong>
                                ${pointsText}
                            </strong>

                            <span>
                                Exact :
                                ${
                                    prediction.basePoints +
                                    EXACT_SCORE_BONUS
                                }
                                pts
                            </span>

                        </div>

                    </article>
                `;
            })
            .join("");
    }

    function bindNavigationTabs() {
        const tabs = document.querySelectorAll(".main-tab");

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((item) => {
                    item.classList.remove("active");
                });

                tab.classList.add("active");
            });
        });
    }

    function isMatchLocked(match) {
        if (!match.kickoff) return false;

        const kickoffDate = new Date(match.kickoff);
        if (Number.isNaN(kickoffDate.getTime())) return false;

        return new Date() >= kickoffDate;
    }

    renderMatches();
renderMyPredictions();
bindNavigationTabs();
chargerMatchsFirebase();

window.addEventListener("beforeunload", function () {
    if (arreterEcouteMatchs) {
        arreterEcouteMatchs();
    }
});
