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


# -------------------------------------------------
# FastAPI setup
# -------------------------------------------------

app = FastAPI(title="Tara NLP Text Analyzer")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# Load spaCy model
# -------------------------------------------------

nlp = spacy.load("en_core_web_sm")


# -------------------------------------------------
# Request model
# -------------------------------------------------

class TextRequest(BaseModel):
    text: str


class SynonymRequest(BaseModel):
    word: str


# -------------------------------------------------
# Home API
# -------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Tara NLP Text Analyzer API is running"
    }


# -------------------------------------------------
# Word Count
# -------------------------------------------------

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


# -------------------------------------------------
# Tokenization
# -------------------------------------------------

@app.post("/tokenize")
def tokenize(request: TextRequest):

    tokens = word_tokenize(request.text)

    return {
        "tokens": tokens
    }


# -------------------------------------------------
# Stopwords
# -------------------------------------------------

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


# -------------------------------------------------
# Bigrams
# -------------------------------------------------

@app.post("/bigrams")
def generate_bigrams(request: TextRequest):

    tokens = word_tokenize(request.text)

    words = [
        word.lower()
        for word in tokens
        if word.isalpha()
    ]

    bigram_list = list(
        bigrams(words)
    )

    result = [
        f"{pair[0]} {pair[1]}"
        for pair in bigram_list
    ]

    return {
        "bigrams": result
    }


# -------------------------------------------------
# Synonyms
# -------------------------------------------------

@app.post("/synonyms")
def find_synonyms(request: SynonymRequest):

    word = request.word.strip().lower()

    synonyms = set()

    for synset in wordnet.synsets(word):

        for lemma in synset.lemmas():

            synonyms.add(
                lemma.name().replace("_", " ")
            )

    synonyms.discard(word)

    return {
        "word": word,
        "synonyms": sorted(synonyms)[:30]
    }


# -------------------------------------------------
# POS Tagging
# -------------------------------------------------

@app.post("/pos")
def pos_tagging(request: TextRequest):

    tokens = word_tokenize(request.text)

    words = [
        word
        for word in tokens
        if word.isalpha()
    ]

    tagged_words = pos_tag(words)

    result = [
        {
            "word": word,
            "tag": tag
        }
        for word, tag in tagged_words
    ]

    return {
        "pos_tags": result
    }


# -------------------------------------------------
# Named Entity Recognition
# -------------------------------------------------

@app.post("/entities")
def named_entities(request: TextRequest):

    doc = nlp(request.text)

    entities = []

    for entity in doc.ents:

        entities.append(
            {
                "text": entity.text,
                "label": entity.label_,
                "meaning": spacy.explain(
                    entity.label_
                )
            }
        )

    return {
        "entities": entities
    }


# -------------------------------------------------
# Positive Words
# -------------------------------------------------

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