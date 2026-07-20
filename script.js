document.addEventListener("DOMContentLoaded", function () {
    const EXACT_SCORE_BONUS = 150;

    /*
     * Pour saisir le résultat réel plus tard :
     *
     * actualScore: null
     *
     * devient par exemple :
     *
     * actualScore: {
     *     home: 2,
     *     away: 1
     * }
     */

    const matches = [
        {
            id: 1,
            home: "Real Madrid",
            away: "Manchester City",
            date: "Mardi 21h00",

            odds: {
                home: 210,
                draw: 360,
                away: 295
            },

            actualScore: null
        },
        {
            id: 2,
            home: "Paris SG",
            away: "Bayern Munich",
            date: "Mardi 21h00",

            odds: {
                home: 245,
                draw: 350,
                away: 275
            },

            actualScore: null
        },
        {
            id: 3,
            home: "Arsenal",
            away: "Inter Milan",
            date: "Mercredi 21h00",

            odds: {
                home: 185,
                draw: 370,
                away: 410
            },

            actualScore: null
        }
    ];

    const matchesContainer =
        document.getElementById("matches-container");

    const predictionsContainer =
        document.getElementById("my-predictions-container");

    let savedPredictions = loadPredictions();

    function loadPredictions() {
        try {
            const storedPredictions =
                localStorage.getItem("scorePredictions");

            if (!storedPredictions) {
                return {};
            }

            const parsedPredictions =
                JSON.parse(storedPredictions);

            if (
                typeof parsedPredictions !== "object" ||
                parsedPredictions === null
            ) {
                return {};
            }

            return parsedPredictions;
        } catch (error) {
            console.error(
                "Impossible de charger les pronostics :",
                error
            );

            return {};
        }
    }

    function savePredictions() {
        try {
            localStorage.setItem(
                "scorePredictions",
                JSON.stringify(savedPredictions)
            );
        } catch (error) {
            console.error(
                "Impossible d'enregistrer les pronostics :",
                error
            );

            alert(
                "Une erreur empêche l'enregistrement du pronostic."
            );
        }
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
            return `Victoire ${match.home}`;
        }

        if (outcome === "away") {
            return `Victoire ${match.away}`;
        }

        return "Match nul";
    }

    function getPredictionResult(match, prediction) {
        if (!match.actualScore) {
            return {
                status: "pending",
                points: null,
                message: "En attente du résultat"
            };
        }

        const predictedOutcome = getOutcome(
            prediction.homeScore,
            prediction.awayScore
        );

        const actualOutcome = getOutcome(
            match.actualScore.home,
            match.actualScore.away
        );

        const exactScore =
            prediction.homeScore === match.actualScore.home &&
            prediction.awayScore === match.actualScore.away;

        if (exactScore) {
            return {
                status: "exact",
                points:
                    match.odds[actualOutcome] +
                    EXACT_SCORE_BONUS,
                message: `Score exact : +${EXACT_SCORE_BONUS} pts de bonus`
            };
        }

        if (predictedOutcome === actualOutcome) {
            return {
                status: "correct",
                points: match.odds[actualOutcome],
                message: "Bon résultat"
            };
        }

        return {
            status: "wrong",
            points: 0,
            message: "Mauvais résultat"
        };
    }

    function renderMatches() {
        if (!matchesContainer) {
            console.error(
                'La zone "matches-container" est introuvable.'
            );

            return;
        }

        matchesContainer.innerHTML = matches
            .map(function (match) {
                const prediction =
                    savedPredictions[match.id];

                const result = prediction
                    ? getPredictionResult(match, prediction)
                    : null;

                return `
                    <article class="match-card">
                        <div class="match-top">
                            <div>
                                <p class="competition">
                                    Ligue des champions
                                </p>

                                <h3 class="teams">
                                    ${match.home} - ${match.away}
                                </h3>
                            </div>

                            <p class="match-date">
                                ${match.date}
                            </p>
                        </div>

                        <div class="odds-grid">
                            <div class="odd-box">
                                <span>${match.home}</span>
                                <strong>
                                    ${match.odds.home} pts
                                </strong>
                            </div>

                            <div class="odd-box">
                                <span>Match nul</span>
                                <strong>
                                    ${match.odds.draw} pts
                                </strong>
                            </div>

                            <div class="odd-box">
                                <span>${match.away}</span>
                                <strong>
                                    ${match.odds.away} pts
                                </strong>
                            </div>
                        </div>

                        ${
                            prediction
                                ? renderSavedPrediction(
                                    match,
                                    prediction,
                                    result
                                )
                                : renderScoreForm(match)
                        }
                    </article>
                `;
            })
            .join("");

        addScoreEvents();
        addDeleteEvents();
    }

    function renderScoreForm(match) {
        return `
            <div class="score-prediction">
                <p class="score-instruction">
                    Entre ton score exact
                </p>

                <div class="score-inputs">
                    <div class="score-team">
                        <label for="home-score-${match.id}">
                            ${match.home}
                        </label>

                        <input
                            id="home-score-${match.id}"
                            class="score-input"
                            type="number"
                            min="0"
                            max="20"
                            inputmode="numeric"
                            placeholder="0"
                            data-home-score="${match.id}"
                        >
                    </div>

                    <span class="score-separator">
                        -
                    </span>

                    <div class="score-team">
                        <label for="away-score-${match.id}">
                            ${match.away}
                        </label>

                        <input
                            id="away-score-${match.id}"
                            class="score-input"
                            type="number"
                            min="0"
                            max="20"
                            inputmode="numeric"
                            placeholder="0"
                            data-away-score="${match.id}"
                        >
                    </div>
                </div>

                <p
                    class="potential-points"
                    id="potential-points-${match.id}"
                >
                    Saisis un score pour voir les points possibles.
                </p>

                <button
                    type="button"
                    class="validate-button"
                    data-save-score="${match.id}"
                >
                    Valider mon score
                </button>
            </div>
        `;
    }

    function renderSavedPrediction(
        match,
        prediction,
        result
    ) {
        let resultHtml = "";

        if (result.status === "pending") {
            resultHtml = `
                <div class="prediction-status pending">
                    Résultat en attente
                </div>
            `;
        } else {
            resultHtml = `
                <div class="prediction-result ${result.status}">
                    <span>${result.message}</span>

                    <strong>
                        ${result.points} pts gagnés
                    </strong>
                </div>
            `;
        }

        return `
            <div class="saved-score-box">
                <p class="saved-score-label">
                    Ton pronostic
                </p>

                <div class="saved-score">
                    <span>${match.home}</span>

                    <strong>
                        ${prediction.homeScore}
                        -
                        ${prediction.awayScore}
                    </strong>

                    <span>${match.away}</span>
                </div>

                <p class="saved-outcome">
                    ${getOutcomeLabel(
                        match,
                        prediction.outcome
                    )}
                    —
                    ${prediction.basePoints}
                    pts possibles
                </p>

                <p class="exact-bonus-information">
                    Score exact :
                    ${prediction.basePoints}
                    + ${EXACT_SCORE_BONUS}
                    =
                    ${prediction.basePoints + EXACT_SCORE_BONUS}
                    pts
                </p>

                ${resultHtml}

                ${
                    match.actualScore
                        ? ""
                        : `
                            <button
                                type="button"
                                class="delete-prediction-button"
                                data-delete-score="${match.id}"
                            >
                                Modifier mon pronostic
                            </button>
                        `
                }
            </div>
        `;
    }

    function addScoreEvents() {
        const saveButtons =
            document.querySelectorAll("[data-save-score]");

        saveButtons.forEach(function (button) {
            const matchId = Number(
                button.getAttribute("data-save-score")
            );

            const homeInput =
                document.querySelector(
                    `[data-home-score="${matchId}"]`
                );

            const awayInput =
                document.querySelector(
                    `[data-away-score="${matchId}"]`
                );

            if (!homeInput || !awayInput) {
                return;
            }

            function updatePotentialPoints() {
                const homeValue =
                    homeInput.value.trim();

                const awayValue =
                    awayInput.value.trim();

                const information =
                    document.getElementById(
                        `potential-points-${matchId}`
                    );

                if (!information) {
                    return;
                }

                if (
                    homeValue === "" ||
                    awayValue === ""
                ) {
                    information.textContent =
                        "Saisis un score pour voir les points possibles.";

                    return;
                }

                const homeScore = Number(homeValue);
                const awayScore = Number(awayValue);

                if (
                    !Number.isInteger(homeScore) ||
                    !Number.isInteger(awayScore) ||
                    homeScore < 0 ||
                    awayScore < 0
                ) {
                    information.textContent =
                        "Le score doit contenir des nombres entiers positifs.";

                    return;
                }

                const match = matches.find(function (item) {
                    return item.id === matchId;
                });

                if (!match) {
                    return;
                }

                const outcome =
                    getOutcome(homeScore, awayScore);

                const basePoints =
                    match.odds[outcome];

                information.innerHTML = `
                    Bon résultat :
                    <strong>${basePoints} pts</strong>

                    <br>

                    Score exact :
                    <strong>
                        ${basePoints + EXACT_SCORE_BONUS} pts
                    </strong>
                `;
            }

            homeInput.addEventListener(
                "input",
                updatePotentialPoints
            );

            awayInput.addEventListener(
                "input",
                updatePotentialPoints
            );

            button.addEventListener("click", function () {
                saveScorePrediction(
                    matchId,
                    homeInput,
                    awayInput
                );
            });
        });
    }

    function saveScorePrediction(
        matchId,
        homeInput,
        awayInput
    ) {
        const homeValue =
            homeInput.value.trim();

        const awayValue =
            awayInput.value.trim();

        if (
            homeValue === "" ||
            awayValue === ""
        ) {
            alert(
                "Entre le score des deux équipes."
            );

            return;
        }

        const homeScore = Number(homeValue);
        const awayScore = Number(awayValue);

        if (
            !Number.isInteger(homeScore) ||
            !Number.isInteger(awayScore) ||
            homeScore < 0 ||
            awayScore < 0 ||
            homeScore > 20 ||
            awayScore > 20
        ) {
            alert(
                "Entre un score valide entre 0 et 20."
            );

            return;
        }

        const match = matches.find(function (item) {
            return item.id === matchId;
        });

        if (!match) {
            alert("Ce match est introuvable.");
            return;
        }

        const outcome =
            getOutcome(homeScore, awayScore);

        savedPredictions[matchId] = {
            homeScore: homeScore,
            awayScore: awayScore,
            outcome: outcome,
            basePoints: match.odds[outcome]
        };

        savePredictions();
        renderMatches();
        renderPredictions();
    }

    function addDeleteEvents() {
        const deleteButtons =
            document.querySelectorAll(
                "[data-delete-score]"
            );

        deleteButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                const matchId =
                    button.getAttribute(
                        "data-delete-score"
                    );

                const confirmed = confirm(
                    "Modifier ce pronostic ? Le score actuel sera supprimé."
                );

                if (!confirmed) {
                    return;
                }

                delete savedPredictions[matchId];

                savePredictions();
                renderMatches();
                renderPredictions();
            });
        });
    }

    function renderPredictions() {
        if (!predictionsContainer) {
            return;
        }

        const entries =
            Object.entries(savedPredictions);

        if (entries.length === 0) {
            predictionsContainer.innerHTML = `
                <p class="empty-message">
                    Aucun pronostic enregistré pour le moment.
                </p>
            `;

            return;
        }

        predictionsContainer.innerHTML = entries
            .map(function ([matchId, prediction]) {
                const match = matches.find(function (item) {
                    return item.id === Number(matchId);
                });

                if (!match) {
                    return "";
                }

                const result =
                    getPredictionResult(
                        match,
                        prediction
                    );

                let pointsText =
                    "Résultat en attente";

                if (result.points !== null) {
                    pointsText =
                        `${result.points} pts gagnés`;
                }

                return `
                    <article class="prediction-card">
                        <div>
                            <strong>
                                ${match.home}
                                ${prediction.homeScore}
                                -
                                ${prediction.awayScore}
                                ${match.away}
                            </strong>

                            <p>
                                ${getOutcomeLabel(
                                    match,
                                    prediction.outcome
                                )}
                            </p>

                            <p>
                                Score exact :
                                ${prediction.basePoints + EXACT_SCORE_BONUS}
                                pts possibles
                            </p>
                        </div>

                        <span class="prediction-points">
                            ${pointsText}
                        </span>
                    </article>
                `;
            })
            .join("");
    }

    renderMatches();
    renderPredictions();
});
