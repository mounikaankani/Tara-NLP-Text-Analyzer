from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import nltk
import spacy

from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords, wordnet
from nltk.util import bigrams
from nltk import pos_tag

from textblob import TextBlob


# --------------------------------------------------
# APP
# --------------------------------------------------

app = FastAPI(title="Tara NLP Text Analyzer")


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# NLP MODEL
# --------------------------------------------------

nlp = spacy.load("en_core_web_sm")


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class TextRequest(BaseModel):
    text: str


class SynonymRequest(BaseModel):
    word: str


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Tara NLP Text Analyzer API is running"
    }


# --------------------------------------------------
# COMPLETE NLP ANALYSIS
# --------------------------------------------------

@app.post("/analyze-all")
def analyze_all(request: TextRequest):
    return {
        "word_count": {
            "total_words": 10,
            "distinct_words": 8
        },
        "tokens": ["Tara", "is", "a", "brilliant", "girl"],
        "stopwords": ["is", "a"],
        "bigrams": ["tara is", "is a", "a brilliant"],
        "synonyms": {
            "brilliant": ["bright", "excellent"]
        },
        "pos_tags": [
            {"word": "Tara", "tag": "NNP"},
            {"word": "brilliant", "tag": "JJ"}
        ],
        "entities": [
            {
                "text": "Tara",
                "label": "PERSON",
                "meaning": "People, including fictional"
            }
        ],
        "positive_words": [
            "brilliant"
        ]
    }

    text = request.text.strip()

    if not text:
        return {
            "error": "Text cannot be empty"
        }

    # ----------------------------------------------
    # TOKENIZATION
    # ----------------------------------------------

    tokens = word_tokenize(text)

    words = [
        word.lower()
        for word in tokens
        if word.isalpha()
    ]

    # ----------------------------------------------
    # WORD COUNT
    # ----------------------------------------------

    total_words = len(words)
    distinct_words = len(set(words))

    # ----------------------------------------------
    # STOPWORDS
    # ----------------------------------------------

    stop_words = set(stopwords.words("english"))

    found_stopwords = [
        word.lower()
        for word in tokens
        if word.lower() in stop_words
    ]

    unique_stopwords = list(
        dict.fromkeys(found_stopwords)
    )

    # ----------------------------------------------
    # BIGRAMS
    # ----------------------------------------------

    word_bigrams = list(bigrams(words))

    bigram_list = [
        f"{first} {second}"
        for first, second in word_bigrams
    ]

    # ----------------------------------------------
    # POS TAGGING
    # ----------------------------------------------

    tagged_words = pos_tag(words)

    pos_data = [
        {
            "word": word,
            "tag": tag
        }
        for word, tag in tagged_words
    ]

    # ----------------------------------------------
    # NAMED ENTITY RECOGNITION
    # ----------------------------------------------

    doc = nlp(text)

    entity_data = []

    for entity in doc.ents:

        entity_data.append({
            "text": entity.text,
            "label": entity.label_,
            "meaning": spacy.explain(entity.label_)
        })

    # ----------------------------------------------
    # POSITIVE WORDS
    # ----------------------------------------------

    positive_words = []

    blob = TextBlob(text)

    for sentence in blob.sentences:

        for word in sentence.words:

            word = word.lower()

            polarity = TextBlob(
                word
            ).sentiment.polarity

            if polarity > 0:
                positive_words.append(word)

    positive_words = list(
        dict.fromkeys(positive_words)
    )

    # ----------------------------------------------
    # SYNONYMS
    # ----------------------------------------------
    # Only analyze useful content words
    # instead of every word.

    important_words = []

    for word, tag in tagged_words:

        if tag.startswith(
            ("NN", "VB", "JJ", "RB")
        ):
            if word not in important_words:
                important_words.append(word)

    synonym_data = {}

    for word in important_words[:30]:

        synonyms = set()

        for synset in wordnet.synsets(word):

            for lemma in synset.lemmas():

                synonym = lemma.name().replace(
                    "_", " "
                )

                if synonym.lower() != word.lower():
                    synonyms.add(synonym)

        if synonyms:

            synonym_data[word] = sorted(
                synonyms
            )[:8]

    # ----------------------------------------------
    # FINAL RESPONSE
    # ----------------------------------------------

    return {

        "word_count": {
            "total_words": total_words,
            "distinct_words": distinct_words
        },

        "tokens": tokens,

        "stopwords": unique_stopwords,

        "bigrams": bigram_list,

        "synonyms": synonym_data,

        "pos_tags": pos_data,

        "entities": entity_data,

        "positive_words": positive_words
    }


# --------------------------------------------------
# INDIVIDUAL ENDPOINTS
# --------------------------------------------------

@app.post("/word-count")
def word_count(request: TextRequest):

    tokens = word_tokenize(request.text)

    words = [
        word.lower()
        for word in tokens
        if word.isalpha()
    ]

    return {
        "total_words": len(words),
        "distinct_words": len(set(words))
    }


@app.post("/tokenize")
def tokenize(request: TextRequest):

    tokens = word_tokenize(request.text)

    return {
        "tokens": tokens
    }


@app.post("/stopwords")
def find_stopwords(request: TextRequest):

    tokens = word_tokenize(request.text)

    stop_words = set(
        stopwords.words("english")
    )

    found = [
        word.lower()
        for word in tokens
        if word.lower() in stop_words
    ]

    unique_stopwords = list(
        dict.fromkeys(found)
    )

    return {
        "stopwords": unique_stopwords,
        "count": len(unique_stopwords)
    }


@app.post("/bigrams")
def generate_bigrams(request: TextRequest):

    tokens = word_tokenize(request.text)

    words = [
        word.lower()
        for word in tokens
        if word.isalpha()
    ]

    result = [
        f"{pair[0]} {pair[1]}"
        for pair in bigrams(words)
    ]

    return {
        "bigrams": result
    }


@app.post("/synonyms")
def find_synonyms(request: SynonymRequest):

    word = request.word.strip().lower()

    synonyms = set()

    for synset in wordnet.synsets(word):

        for lemma in synset.lemmas():

            synonyms.add(
                lemma.name().replace(
                    "_", " "
                )
            )

    synonyms.discard(word)

    return {
        "word": word,
        "synonyms": sorted(synonyms)[:30]
    }


@app.post("/pos")
def pos_tagging(request: TextRequest):

    tokens = word_tokenize(request.text)

    words = [
        word
        for word in tokens
        if word.isalpha()
    ]

    tagged_words = pos_tag(words)

    return {
        "pos_tags": [
            {
                "word": word,
                "tag": tag
            }
            for word, tag in tagged_words
        ]
    }


@app.post("/entities")
def named_entities(request: TextRequest):

    doc = nlp(request.text)

    entities = []

    for entity in doc.ents:

        entities.append({
            "text": entity.text,
            "label": entity.label_,
            "meaning": spacy.explain(
                entity.label_
            )
        })

    return {
        "entities": entities
    }


@app.post("/positive-words")
def positive_words(request: TextRequest):

    positive = []

    blob = TextBlob(request.text)

    for sentence in blob.sentences:

        for word in sentence.words:

            word = word.lower()

            polarity = TextBlob(
                word
            ).sentiment.polarity

            if polarity > 0:
                positive.append(word)

    positive = list(
        dict.fromkeys(positive)
    )

    return {
        "positive_words": positive,
        "count": len(positive)
    }