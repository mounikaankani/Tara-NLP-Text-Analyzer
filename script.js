const API = "http://127.0.0.1:8010";

const textInput = document.getElementById("textInput");
const result = document.getElementById("result");


function showLoading() {
    result.innerHTML = `
        <div class="loading">
            Analyzing your text...
        </div>
    `;
}


function showResult(title, content) {

    result.innerHTML = `
        <div class="result-title">
            ${title}
        </div>

        <div class="result-content">
            ${content}
        </div>
    `;
}


async function sendRequest(endpoint, data, title, formatter) {

    showLoading();

    try {

        const response = await fetch(`${API}${endpoint}`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });


        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const responseData = await response.json();

        const formatted =
            formatter(responseData);

        showResult(title, formatted);


    } catch (error) {

        result.innerHTML = `
            <div class="error">
                <strong>Connection Error</strong>
                <br><br>
                ${error.message}
                <br><br>
                Make sure FastAPI is running on
                <strong>port 8010</strong>.
            </div>
        `;
    }
}


function getText() {

    const text = textInput.value.trim();

    if (!text) {

        result.innerHTML = `
            <div class="error">
                Please enter some text first.
            </div>
        `;

        return null;
    }

    return text;
}


// --------------------------------------
// WORD COUNT
// --------------------------------------

function wordCount() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/word-count",
        { text: text },
        "Word Count",
        data => `

            <div class="stats">

                <div class="stat-box">
                    <span>Total Words</span>
                    <strong>${data.total_words}</strong>
                </div>

                <div class="stat-box">
                    <span>Distinct Words</span>
                    <strong>${data.distinct_words}</strong>
                </div>

            </div>
        `
    );
}


// --------------------------------------
// TOKENIZATION
// --------------------------------------

function tokenize() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/tokenize",
        { text: text },
        "Tokenization",
        data => `

            <div class="token-container">

                ${data.tokens.map(
                    token =>
                    `<span class="token">${token}</span>`
                ).join("")}

            </div>

            <p class="count">
                Total Tokens: ${data.tokens.length}
            </p>
        `
    );
}


// --------------------------------------
// STOPWORDS
// --------------------------------------

function stopwords() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/stopwords",
        { text: text },
        "Stopwords",
        data => `

            <div class="word-list">

                ${data.stopwords.map(
                    word =>
                    `<span>${word}</span>`
                ).join("")}

            </div>

            <p class="count">
                Unique Stopwords: ${data.count}
            </p>
        `
    );
}


// --------------------------------------
// BIGRAMS
// --------------------------------------

function bigrams() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/bigrams",
        { text: text },
        "Bigrams",
        data => `

            <div class="bigram-grid">

                ${data.bigrams.map(
                    (pair, index) =>
                    `<div>
                        <b>${index + 1}</b>
                        ${pair}
                    </div>`
                ).join("")}

            </div>

            <p class="count">
                Total Bigrams: ${data.bigrams.length}
            </p>
        `
    );
}


// --------------------------------------
// POS TAGGING
// --------------------------------------

function posTagging() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/pos",
        { text: text },
        "Part-of-Speech Tagging",
        data => `

            <table>

                <thead>

                    <tr>
                        <th>Word</th>
                        <th>POS Tag</th>
                    </tr>

                </thead>

                <tbody>

                    ${data.pos_tags.map(
                        item => `
                        <tr>
                            <td>${item.word}</td>
                            <td>
                                <span class="tag">
                                    ${item.tag}
                                </span>
                            </td>
                        </tr>
                        `
                    ).join("")}

                </tbody>

            </table>
        `
    );
}


// --------------------------------------
// NAMED ENTITIES
// --------------------------------------

function entities() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/entities",
        { text: text },
        "Named Entity Recognition",
        data => {

            if (data.entities.length === 0) {

                return `
                    <p>
                        No named entities detected.
                    </p>
                `;
            }


            return `

                <div class="entity-list">

                    ${data.entities.map(
                        entity => `

                        <div class="entity">

                            <strong>
                                ${entity.text}
                            </strong>

                            <span>
                                ${entity.label}
                            </span>

                            <small>
                                ${entity.meaning}
                            </small>

                        </div>

                        `
                    ).join("")}

                </div>
            `;
        }
    );
}


// --------------------------------------
// POSITIVE WORDS
// --------------------------------------

function positiveWords() {

    const text = getText();

    if (!text) return;


    sendRequest(
        "/positive-words",
        { text: text },
        "Positive Words",
        data => `

            <div class="word-list positive">

                ${data.positive_words.map(
                    word =>
                    `<span>${word}</span>`
                ).join("")}

            </div>

            <p class="count">
                Total Positive Words:
                ${data.count}
            </p>
        `
    );
}


// --------------------------------------
// SYNONYMS
// --------------------------------------

function synonyms() {

    const word =
        document.getElementById("synonymWord")
        .value
        .trim();


    if (!word) {

        result.innerHTML = `
            <div class="error">
                Please enter a word first.
            </div>
        `;

        return;
    }


    sendRequest(
        "/synonyms",
        { word: word },
        `Synonyms for "${word}"`,
        data => {

            if (data.synonyms.length === 0) {

                return `
                    <p>
                        No synonyms found.
                    </p>
                `;
            }


            return `

                <div class="word-list">

                    ${data.synonyms.map(
                        synonym =>
                        `<span>${synonym}</span>`
                    ).join("")}

                </div>

                <p class="count">
                    ${data.synonyms.length}
                    synonyms found
                </p>
            `;
        }
    );
}


// --------------------------------------
// CLEAR
// --------------------------------------

function clearResult() {

    result.innerHTML = `
        <p class="placeholder">
            Your NLP analysis will appear here.
        </p>
    `;

}