const API = "http://127.0.0.1:8010";


const DEFAULT_TEXT = `Every evening, Tara sat beneath the old neem tree and watched the stars slowly appear in the sky. She dreamed of becoming a scientist and discovering something that could change the world. Her village was small, and many people believed that a girl should choose a simple life and leave great dreams to others. But Tara never allowed their words to silence her curiosity.

With a borrowed book in her hands and a small lamp beside her, she studied late into the night. Her mother encouraged her whenever the journey became difficult, reminding her that knowledge could open doors that fear could never close. Years passed, and Tara's determination grew stronger. She eventually won a scholarship to study science in the city.

On her first night away from home, Tara looked at the familiar stars and smiled. She realized that dreams were not distant lights waiting to be reached; they were tiny sparks that became brighter whenever someone believed in them. She promised herself that one day she would return to her village and encourage other girls to follow their own stars.`;


const textInput =
    document.getElementById("textInput");

const dashboard =
    document.getElementById("dashboard");

const loading =
    document.getElementById("loading");

const errorBox =
    document.getElementById("error");


// --------------------------------------------------
// LOAD DEFAULT TEXT
// --------------------------------------------------

window.addEventListener(
    "DOMContentLoaded",
    () => {

        textInput.value = DEFAULT_TEXT;

    }
);


// --------------------------------------------------
// ANALYZE EVERYTHING
// --------------------------------------------------

async function analyzeAll() {

    const text =
        textInput.value.trim();


    if (!text) {

        showError(
            "Please enter some text before analyzing."
        );

        return;
    }


    dashboard.classList.add("hidden");

    errorBox.classList.add("hidden");

    loading.classList.remove("hidden");


    try {

        const response =
            await fetch(
                `${API}/analyze-all`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const data =
            await response.json();


        renderDashboard(data);


    } catch (error) {

        showError(
            `Unable to connect to the FastAPI backend.

Make sure the backend is running on port 8010.

Error: ${error.message}`
        );

    } finally {

        loading.classList.add("hidden");

    }
}


// --------------------------------------------------
// RENDER DASHBOARD
// --------------------------------------------------

function renderDashboard(data) {


    dashboard.classList.remove(
        "hidden"
    );


    // ----------------------------------------------
    // STATISTICS
    // ----------------------------------------------

    document.getElementById(
        "totalWords"
    ).textContent =
        data.word_count.total_words;


    document.getElementById(
        "distinctWords"
    ).textContent =
        data.word_count.distinct_words;


    document.getElementById(
        "totalTokens"
    ).textContent =
        data.tokens.length;


    document.getElementById(
        "totalBigrams"
    ).textContent =
        data.bigrams.length;


    document.getElementById(
        "totalStopwords"
    ).textContent =
        data.stopwords.length;


    document.getElementById(
        "totalPositive"
    ).textContent =
        data.positive_words.length;


    // ----------------------------------------------
    // TOKENS
    // ----------------------------------------------

    document.getElementById(
        "tokenCount"
    ).textContent =
        `${data.tokens.length} tokens`;


    document.getElementById(
        "tokens"
    ).innerHTML =
        renderChips(
            data.tokens
        );


    // ----------------------------------------------
    // STOPWORDS
    // ----------------------------------------------

    document.getElementById(
        "stopwordCount"
    ).textContent =
        data.stopwords.length;


    document.getElementById(
        "stopwords"
    ).innerHTML =
        renderChips(
            data.stopwords
        );


    // ----------------------------------------------
    // POSITIVE WORDS
    // ----------------------------------------------

    document.getElementById(
        "positiveCount"
    ).textContent =
        data.positive_words.length;


    document.getElementById(
        "positiveWords"
    ).innerHTML =
        renderChips(
            data.positive_words
        );


    // ----------------------------------------------
    // BIGRAMS
    // ----------------------------------------------

    document.getElementById(
        "bigramCount"
    ).textContent =
        data.bigrams.length;


    document.getElementById(
        "bigrams"
    ).innerHTML =
        data.bigrams.length
            ? data.bigrams.map(
                (item, index) => `
                    <div class="bigram">
                        <span class="bigram-number">
                            ${index + 1}.
                        </span>
                        ${escapeHTML(item)}
                    </div>
                `
            ).join("")
            : `<div class="empty">
                    No bigrams found.
               </div>`;


    // ----------------------------------------------
    // SYNONYMS
    // ----------------------------------------------

    renderSynonyms(
        data.synonyms
    );


    // ----------------------------------------------
    // ENTITIES
    // ----------------------------------------------

    renderEntities(
        data.entities
    );


    // ----------------------------------------------
    // POS TAGGING
    // ----------------------------------------------

    renderPOS(
        data.pos_tags
    );


    // Scroll to dashboard

    dashboard.scrollIntoView({
        behavior: "smooth"
    });
}


// --------------------------------------------------
// CHIPS
// --------------------------------------------------

function renderChips(items) {

    if (!items || items.length === 0) {

        return `
            <div class="empty">
                No results found.
            </div>
        `;
    }


    return items.map(
        item => `
            <span class="chip">
                ${escapeHTML(item)}
            </span>
        `
    ).join("");
}


// --------------------------------------------------
// SYNONYMS
// --------------------------------------------------

function renderSynonyms(data) {

    const container =
        document.getElementById(
            "synonyms"
        );


    const entries =
        Object.entries(data);


    if (entries.length === 0) {

        container.innerHTML =
            `<div class="empty">
                No synonyms found.
             </div>`;

        return;
    }


    container.innerHTML =
        entries.map(
            ([word, synonyms]) => `

                <div class="synonym-card">

                    <span class="synonym-word">
                        ${escapeHTML(word)}
                    </span>

                    <div class="synonym-list">
                        ${synonyms
                            .map(
                                synonym =>
                                    escapeHTML(
                                        synonym
                                    )
                            )
                            .join(", ")
                        }
                    </div>

                </div>

            `
        ).join("");
}


// --------------------------------------------------
// ENTITIES
// --------------------------------------------------

function renderEntities(entities) {

    const container =
        document.getElementById(
            "entities"
        );


    if (!entities || entities.length === 0) {

        container.innerHTML =
            `<div class="empty">
                No named entities detected.
             </div>`;

        return;
    }


    container.innerHTML =
        entities.map(
            entity => `

                <div class="entity">

                    <span class="entity-name">
                        ${escapeHTML(
                            entity.text
                        )}
                    </span>

                    <span class="entity-label">
                        ${escapeHTML(
                            entity.label
                        )}
                    </span>

                    <span class="entity-meaning">
                        ${escapeHTML(
                            entity.meaning ||
                            "No description"
                        )}
                    </span>

                </div>

            `
        ).join("");
}


// --------------------------------------------------
// POS TABLE
// --------------------------------------------------

function renderPOS(tags) {

    const table =
        document.getElementById(
            "posTable"
        );


    if (!tags || tags.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="2">
                    No POS tags found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        tags.map(
            item => `

                <tr>

                    <td>
                        ${escapeHTML(
                            item.word
                        )}
                    </td>

                    <td>
                        <span class="pos-tag">
                            ${escapeHTML(
                                item.tag
                            )}
                        </span>
                    </td>

                </tr>

            `
        ).join("");
}


// --------------------------------------------------
// ERROR
// --------------------------------------------------

function showError(message) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

    dashboard.classList.add(
        "hidden"
    );
}


// --------------------------------------------------
// HTML ESCAPING
// --------------------------------------------------

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}