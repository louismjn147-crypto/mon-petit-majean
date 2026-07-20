const matches = [
    {
        id: 1,
        competition: "Ligue des champions",
        home: "Real Madrid",
        away: "Manchester City",
        date: "Mardi",
        time: "21h00",
        choices: [
            {
                value: "home",
                label: "Real Madrid",
                points: 210
            },
            {
                value: "draw",
                label: "Nul",
                points: 360
            },
            {
                value: "away",
                label: "Manchester City",
                points: 295
            }
        ]
    },
    {
        id: 2,
        competition: "Ligue des champions",
        home: "Paris SG",
        away: "Bayern Munich",
        date: "Mardi",
        time: "21h00",
        choices: [
            {
                value: "home",
                label: "Paris SG",
                points: 245
            },
            {
                value: "draw",
                label: "Nul",
                points: 350
            },
            {
                value: "away",
                label: "Bayern Munich",
                points: 275
            }
        ]
    },
    {
        id: 3,
        competition: "Ligue des champions",
        home: "Arsenal",
        away: "Inter Milan",
        date: "Mercredi",
        time: "21h00",
        choices: [
            {
                value: "home",
                label: "Arsenal",
                points: 185
            },
            {
                value: "draw",
                label: "Nul",
                points: 370
            },
            {
                value: "away",
                label: "Inter Milan",
                points: 410
            }
        ]
    }
];

const matchesContainer = document.getElementById("matches-container");

let selections = {};

let savedPredictions = loadPredictions();

function loadPredictions() {
    try {
        const storedPredictions = localStorage.getItem("predictions");

        if (!storedPredictions) {
            return {};
        }

        return JSON.parse(storedPredictions);
    } catch (error) {
        console.error(
            "Impossible de lire les pronostics enregistrés :",
            error
        );

        return {};
    }
}

function savePredictions() {
    try {
        localStorage.setItem(
            "predictions",
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

function renderMatches() {
    if (!matchesContainer) {
        console.error(
            'La zone avec l’identifiant "matches-container" est introuvable.'
        );

        return;
    }

    matchesContainer.innerHTML = "";

    matches.forEach((match) => {
        const savedPrediction = savedPredictions[match.id];

        const card = document.createElement("article");
        card.className = "match-card";

        card.innerHTML = `
            <div class="match-top">
                <div>
                    <p class="competition">
                        ${match.competition}
                    </p>

                    <h3 class="teams">
                        ${match.home} - ${match.away}
                    </h3>
                </div>

                <p class="match-date">
                    ${match.date}<br>
                    <strong>${match.time}</strong>
                </p>
            </div>

            <div class="choices">
                ${match.choices
                    .map((choice) => {
                        const isSavedChoice =
                            savedPrediction &&
                            savedPrediction.value === choice.value;

                        return `
                            <button
                                type="button"
                                class="choice ${
                                    isSavedChoice ? "selected" : ""
                                }"
                                data-match="${match.id}"
                                data-value="${choice.value}"
                                data-label="${choice.label}"
                                data-points="${choice.points}"
                            >
                                <span>${choice.label}</span>

                                <span class="choice-points">
                                    +${choice.points} pts
                                </span>
                            </button>
                        `;
                    })
                    .join("")}
            </div>

            <button
                type="button"
                class="validate-button"
                data-validate="${match.id}"
                ${savedPrediction ? "disabled" : ""}
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
                            ${savedPrediction.label}
                            —
                            ${savedPrediction.points}
                            points possibles
                        </p>
                    `
                    : ""
            }
        `;

        matchesContainer.appendChild(card);
    });

    addPredictionEvents();
    renderMyPredictions();
}

function addPredictionEvents() {
    const choiceButtons =
        document.querySelectorAll(".choice");

    choiceButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const matchId = button.dataset.match;

            if (savedPredictions[matchId]) {
                return;
            }

            selections[matchId] = {
                value: button.dataset.value,
                label: button.dataset.label,
                points: Number(button.dataset.points)
            };

            document
                .querySelectorAll(
                    `[data-match="${matchId}"]`
                )
                .forEach((choiceButton) => {
                    choiceButton.classList.remove(
                        "selected"
                    );
                });

            button.classList.add("selected");
        });
    });

    const validateButtons =
        document.querySelectorAll("[data-validate]");

    validateButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const matchId = button.dataset.validate;
            const selection = selections[matchId];

            if (!selection) {
                alert(
                    "Choisis d'abord un pronostic."
                );

                return;
            }

            savedPredictions[matchId] = selection;

            savePredictions();

            delete selections[matchId];

            renderMatches();
        });
    });
}

function renderMyPredictions() {
    const predictionsContainer =
        document.getElementById(
            "my-predictions-container"
        );

    if (!predictionsContainer) {
        return;
    }

    const predictionEntries =
        Object.entries(savedPredictions);

    if (predictionEntries.length === 0) {
        predictionsContainer.innerHTML = `
            <p class="empty-message">
                Aucun pronostic enregistré pour le moment.
            </p>
        `;

        return;
    }

    predictionsContainer.innerHTML =
        predictionEntries
            .map(([matchId, prediction]) => {
                const match = matches.find(
                    (currentMatch) =>
                        currentMatch.id === Number(matchId)
                );

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
                            ${prediction.points}
                            pts possibles
                        </span>
                    </article>
                `;
            })
            .join("");
}

renderMatches();
