document.addEventListener("DOMContentLoaded", function () {
    const matches = [
        {
            id: 1,
            home: "Real Madrid",
            away: "Manchester City",
            date: "Mardi 21h00",
            choices: [
                { value: "home", label: "Real Madrid", points: 210 },
                { value: "draw", label: "Match nul", points: 360 },
                { value: "away", label: "Manchester City", points: 295 }
            ]
        },
        {
            id: 2,
            home: "Paris SG",
            away: "Bayern Munich",
            date: "Mardi 21h00",
            choices: [
                { value: "home", label: "Paris SG", points: 245 },
                { value: "draw", label: "Match nul", points: 350 },
                { value: "away", label: "Bayern Munich", points: 275 }
            ]
        },
        {
            id: 3,
            home: "Arsenal",
            away: "Inter Milan",
            date: "Mercredi 21h00",
            choices: [
                { value: "home", label: "Arsenal", points: 185 },
                { value: "draw", label: "Match nul", points: 370 },
                { value: "away", label: "Inter Milan", points: 410 }
            ]
        }
    ];

    const matchesContainer =
        document.getElementById("matches-container");

    const predictionsContainer =
        document.getElementById("my-predictions-container");

    let currentSelections = {};

    let savedPredictions = {};

    try {
        savedPredictions =
            JSON.parse(localStorage.getItem("predictions")) || {};
    } catch (error) {
        savedPredictions = {};
    }

    function savePredictions() {
        localStorage.setItem(
            "predictions",
            JSON.stringify(savedPredictions)
        );
    }

    function renderMatches() {
        if (!matchesContainer) {
            console.error(
                "Erreur : matches-container est introuvable."
            );
            return;
        }

        matchesContainer.innerHTML = matches
            .map(function (match) {
                const savedPrediction =
                    savedPredictions[match.id];

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

                        <div class="choices">
                            ${match.choices
                                .map(function (choice) {
                                    const selected =
                                        savedPrediction &&
                                        savedPrediction.value ===
                                            choice.value;

                                    return `
                                        <button
                                            type="button"
                                            class="choice ${
                                                selected
                                                    ? "selected"
                                                    : ""
                                            }"
                                            data-match-id="${match.id}"
                                            data-value="${choice.value}"
                                            data-label="${choice.label}"
                                            data-points="${choice.points}"
                                            ${
                                                savedPrediction
                                                    ? "disabled"
                                                    : ""
                                            }
                                        >
                                            <span>
                                                ${choice.label}
                                            </span>

                                            <strong>
                                                +${choice.points} pts
                                            </strong>
                                        </button>
                                    `;
                                })
                                .join("")}
                        </div>

                        <button
                            type="button"
                            class="validate-button"
                            data-validate-id="${match.id}"
                            ${
                                savedPrediction
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                savedPrediction
                                    ? "Pronostic enregistré"
                                    : "Valider mon pronostic"
                            }
                        </button>

                        ${
                            savedPrediction
                                ? `
                                    <p class="saved-message">
                                        Ton choix :
                                        <strong>
                                            ${savedPrediction.label}
                                        </strong>
                                        — ${savedPrediction.points}
                                        points possibles
                                    </p>
                                `
                                : ""
                        }
                    </article>
                `;
            })
            .join("");

        addEvents();
    }

    function addEvents() {
        const choices =
            document.querySelectorAll(".choice");

        choices.forEach(function (button) {
            button.addEventListener("click", function () {
                const matchId =
                    button.getAttribute("data-match-id");

                if (savedPredictions[matchId]) {
                    return;
                }

                currentSelections[matchId] = {
                    value: button.getAttribute("data-value"),
                    label: button.getAttribute("data-label"),
                    points: Number(
                        button.getAttribute("data-points")
                    )
                };

                document
                    .querySelectorAll(
                        `[data-match-id="${matchId}"]`
                    )
                    .forEach(function (choiceButton) {
                        choiceButton.classList.remove(
                            "selected"
                        );
                    });

                button.classList.add("selected");
            });
        });

        const validateButtons =
            document.querySelectorAll("[data-validate-id]");

        validateButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                const matchId =
                    button.getAttribute("data-validate-id");

                const selection =
                    currentSelections[matchId];

                if (!selection) {
                    alert(
                        "Choisis une équipe ou le match nul avant de valider."
                    );
                    return;
                }

                savedPredictions[matchId] = selection;

                savePredictions();

                delete currentSelections[matchId];

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

                return `
                    <article class="prediction-card">
                        <div>
                            <strong>
                                ${match.home} - ${match.away}
                            </strong>

                            <p>
                                Ton choix :
                                ${prediction.label}
                            </p>
                        </div>

                        <span class="prediction-points">
                            ${prediction.points} pts possibles
                        </span>
                    </article>
                `;
            })
            .join("");
    }

    renderMatches();
    renderPredictions();
});
