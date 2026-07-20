document.addEventListener("DOMContentLoaded", function () {
    const EXACT_SCORE_BONUS = 150;
    const STORAGE_KEY = "monPetitMajeanPredictions";

    const matches = [
        {
            id: 1,
            competition: "Ligue des champions",
            date: "Mardi 15 septembre",
            time: "21h00",
            home: "Real Madrid",
            away: "Manchester City",
            odds: {
                home: 210,
                draw: 360,
                away: 295
            },
            actualScore: null
        },
        {
            id: 2,
            competition: "Ligue des champions",
            date: "Mardi 15 septembre",
            time: "21h00",
            home: "Paris SG",
            away: "Bayern Munich",
            odds: {
                home: 245,
                draw: 350,
                away: 275
            },
            actualScore: null
        },
        {
            id: 3,
            competition: "Ligue des champions",
            date: "Mercredi 16 septembre",
            time: "21h00",
            home: "Arsenal",
            away: "Inter Milan",
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
                localStorage.getItem(STORAGE_KEY);

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
                STORAGE_KEY,
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

    function getBasePoints(match, homeScore, awayScore) {
        const outcome =
            getOutcome(homeScore, awayScore);

        return match.odds[outcome];
    }

    function calculateResult(match, prediction) {
        if (!match.actualScore) {
            return {
                status: "pending",
                message: "Résultat en attente",
                points: null
            };
        }

        const actualHome =
            match.actualScore.home;

        const actualAway =
            match.actualScore.away;

        const predictedOutcome =
            getOutcome(
                prediction.homeScore,
                prediction.awayScore
            );

        const actualOutcome =
            getOutcome(actualHome, actualAway);

        const exactScore =
            prediction.homeScore === actualHome &&
            prediction.awayScore === actualAway;

        if (exactScore) {
            return {
                status: "exact",
                message: "Score exact",
                points:
                    match.odds[actualOutcome] +
                    EXACT_SCORE_BONUS
            };
        }

        if (predictedOutcome === actualOutcome) {
            return {
                status: "correct",
                message: "Bon résultat",
                points: match.odds[actualOutcome]
            };
        }

        return {
            status: "wrong",
            message: "Mauvais résultat",
            points: 0
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

                return `
                    <article class="match-card">
                        <div class="match-card-header">
                            <span class="match-competition">
                                ${match.competition}
                            </span>

                            <span class="match-date">
                                ${match.date} · ${match.time}
                            </span>
                        </div>

                        ${
                            prediction
                                ? renderSavedMatch(
                                    match,
                                    prediction
                                )
                                : renderMatchForm(match)
                        }
                    </article>
                `;
            })
            .join("");

        attachScoreInputEvents();
        attachValidationEvents();
        attachModificationEvents();
    }

    function renderMatchForm(match) {
        return `
            <div class="match-main-row">
                <div class="team-block home-team">
                    <strong class="team-name">
                        ${match.home}
                    </strong>

                    <span class="team-odd">
                        ${match.odds.home} pts
                    </span>
                </div>

                <div class="score-zone">
                    <div class="score-input-row">
                        <input
                            class="score-box"
                            type="number"
                            min="0"
                            max="20"
                            inputmode="numeric"
                            placeholder="0"
                            data-home-score="${match.id}"
                            aria-label="Score de ${match.home}"
                        >

                        <span class="score-dash">
                            -
                        </span>

                        <input
                            class="score-box"
                            type="number"
                            min="0"
                            max="20"
                            inputmode="numeric"
                            placeholder="0"
                            data-away-score="${match.id}"
                            aria-label="Score de ${match.away}"
                        >
                    </div>

                    <span class="score-caption">
                        Ton pronostic
                    </span>
                </div>

                <div class="team-block away-team">
                    <strong class="team-name">
                        ${match.away}
                    </strong>

                    <span class="team-odd">
                        ${match.odds.away} pts
                    </span>
                </div>
            </div>

            <div class="match-extra-row">
                <span>
                    Match nul
                </span>

                <strong>
                    ${match.odds.draw} pts
                </strong>

                <span class="match-extra-separator">
                    ·
                </span>

                <span>
                    Score exact
                </span>

                <strong>
                    +${EXACT_SCORE_BONUS} pts
                </strong>
            </div>

            <div
                class="potential-points"
                id="potential-points-${match.id}"
            >
                Entre ton score pour voir les points possibles.
            </div>

            <button
                type="button"
                class="validate-prediction-button"
                data-save-prediction="${match.id}"
            >
                Valider mon pronostic
            </button>
        `;
    }

    function renderSavedMatch(match, prediction) {
        const result =
            calculateResult(match, prediction);

        let resultContent = `
            <div class="prediction-state pending">
                Résultat en attente
            </div>
        `;

        if (result.points !== null) {
            resultContent = `
                <div class="prediction-state ${result.status}">
                    <span>${result.message}</span>
                    <strong>${result.points} pts</strong>
                </div>
            `;
        }

        return `
            <div class="match-main-row">
                <div class="team-block home-team">
                    <strong class="team-name">
                        ${match.home}
                    </strong>

                    <span class="team-odd">
                        ${match.odds.home} pts
                    </span>
                </div>

                <div class="saved-score-zone">
                    <strong class="saved-score">
                        ${prediction.homeScore}
                        -
                        ${prediction.awayScore}
                    </strong>

                    <span class="score-caption">
                        Mon pronostic
                    </span>
                </div>

                <div class="team-block away-team">
                    <strong class="team-name">
                        ${match.away}
                    </strong>

                    <span class="team-odd">
                        ${match.odds.away} pts
                    </span>
                </div>
            </div>

            <div class="saved-prediction-details">
                <span>
                    ${getOutcomeLabel(
                        match,
                        prediction.outcome
                    )}
                </span>

                <strong>
                    ${prediction.basePoints} pts
                </strong>
            </div>

            <div class="exact-score-information">
                Score exact :
                ${
                    prediction.basePoints +
                    EXACT_SCORE_BONUS
                }
                pts possibles
            </div>

            ${resultContent}

            ${
                match.actualScore
                    ? ""
                    : `
                        <button
                            type="button"
                            class="edit-prediction-button"
                            data-edit-prediction="${match.id}"
                        >
                            Modifier mon pronostic
                        </button>
                    `
            }
        `;
    }

    function attachScoreInputEvents() {
        matches.forEach(function (match) {
            const homeInput =
                document.querySelector(
                    `[data-home-score="${match.id}"]`
                );

            const awayInput =
                document.querySelector(
                    `[data-away-score="${match.id}"]`
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
                        `potential-points-${match.id}`
                    );

                if (!information) {
                    return;
                }

                if (
                    homeValue === "" ||
                    awayValue === ""
                ) {
                    information.textContent =
                        "Entre ton score pour voir les points possibles.";

                    return;
                }

                const homeScore =
                    Number(homeValue);

                const awayScore =
                    Number(awayValue);

                if (
                    !isValidScore(homeScore) ||
                    !isValidScore(awayScore)
                ) {
                    information.textContent =
                        "Entre un score valide entre 0 et 20.";

                    return;
                }

                const basePoints =
                    getBasePoints(
                        match,
                        homeScore,
                        awayScore
                    );

                information.innerHTML = `
                    Bon résultat :
                    <strong>${basePoints} pts</strong>

                    <span>·</span>

                    Score exact :
                    <strong>
                        ${
                            basePoints +
                            EXACT_SCORE_BONUS
                        }
                        pts
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
        });
    }

    function attachValidationEvents() {
        const buttons =
            document.querySelectorAll(
                "[data-save-prediction]"
            );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                const matchId = Number(
                    button.getAttribute(
                        "data-save-prediction"
                    )
                );

                savePrediction(matchId);
            });
        });
    }

    function savePrediction(matchId) {
        const match = matches.find(function (item) {
            return item.id === matchId;
        });

        if (!match) {
            alert("Ce match est introuvable.");
            return;
        }

        const homeInput =
            document.querySelector(
                `[data-home-score="${matchId}"]`
            );

        const awayInput =
            document.querySelector(
                `[data-away-score="${matchId}"]`
            );

        if (!homeInput || !awayInput) {
            alert(
                "Les cases de score sont introuvables."
            );

            return;
        }

        if (
            homeInput.value.trim() === "" ||
            awayInput.value.trim() === ""
        ) {
            alert(
                "Entre le score des deux équipes."
            );

            return;
        }

        const homeScore =
            Number(homeInput.value);

        const awayScore =
            Number(awayInput.value);

        if (
            !isValidScore(homeScore) ||
            !isValidScore(awayScore)
        ) {
            alert(
                "Entre un score valide entre 0 et 20."
            );

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
        renderMyPredictions();

        document
            .getElementById("mes-pronos")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }

    function isValidScore(score) {
        return (
            Number.isInteger(score) &&
            score >= 0 &&
            score <= 20
        );
    }

    function attachModificationEvents() {
        const buttons =
            document.querySelectorAll(
                "[data-edit-prediction]"
            );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                const matchId =
                    button.getAttribute(
                        "data-edit-prediction"
                    );

                const confirmed = confirm(
                    "Modifier ce pronostic ?"
                );

                if (!confirmed) {
                    return;
                }

                delete savedPredictions[matchId];

                savePredictions();
                renderMatches();
                renderMyPredictions();
            });
        });
    }

    function renderMyPredictions() {
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
                    calculateResult(match, prediction);

                let resultText =
                    "Résultat en attente";

                if (result.points !== null) {
                    resultText =
                        `${result.points} pts gagnés`;
                }

                return `
                    <article class="prediction-card">
                        <div class="prediction-match">
                            <span>
                                ${match.date}
                            </span>

                            <strong>
                                ${match.home}
                                ${prediction.homeScore}
                                -
                                ${prediction.awayScore}
                                ${match.away}
                            </strong>

                            <small>
                                ${getOutcomeLabel(
                                    match,
                                    prediction.outcome
                                )}
                            </small>
                        </div>

                        <div class="prediction-card-points">
                            <strong>
                                ${prediction.basePoints} pts
                            </strong>

                            <span>
                                Score exact :
                                ${
                                    prediction.basePoints +
                                    EXACT_SCORE_BONUS
                                }
                                pts
                            </span>

                            <small>
                                ${resultText}
                            </small>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    renderMatches();
    renderMyPredictions();
});
