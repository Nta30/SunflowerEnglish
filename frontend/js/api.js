const BASE_URL = "http://127.0.0.1:5000";

function authHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

export async function login(username, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

export async function register(data) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

// ========== Exam API ==========

export async function getExams() {
    const res = await fetch(`${BASE_URL}/api/exams/`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function getExamDetail(examId) {
    const res = await fetch(`${BASE_URL}/api/exams/${examId}`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function submitExam(examId, answers, selectedParts = []) {
    const res = await fetch(`${BASE_URL}/api/exams/${examId}/submit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ answers, selectedParts })
    });
    return res.json();
}

export async function getExamHistory() {
    const res = await fetch(`${BASE_URL}/api/exams/history`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function getSessionDetail(sessionId) {
    const res = await fetch(`${BASE_URL}/api/exams/history/${sessionId}`, {
        headers: authHeaders()
    });
    return res.json();
}
// ========== DECKS API ==========
export async function getDecks() {
    const res = await fetch(`${BASE_URL}/api/flashcards/decks`, {
    method: "GET",
    headers: authHeaders()
  });
  return res.json();
}
export async function getDeckDetail(deckId) {
  const res = await fetch(`${BASE_URL}/api/flashcards/decks/${deckId}`, {
    method: "GET",
    headers: authHeaders()
  });
  return res.json();
}

export async function createDeck(data) {
  const res = await fetch(`${BASE_URL}/api/flashcards/decks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}
export async function deleteDeck(deckId) {
  const res = await fetch(`${BASE_URL}/api/flashcards/decks/${deckId}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  return res.json();
}
export async function updateDeck(deckId,data) {
  const res = await fetch(`${BASE_URL}/api/flashcards/decks/${deckId}`,{
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}
// ========== FLASHCARD API ==========

export async function createCard(deckId, data) {
  const res = await fetch(`${BASE_URL}/api/flashcards/decks/${deckId}/cards`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}
export async function updateCard(cardId, data) {
  const res = await fetch(`${BASE_URL}/api/flashcards/cards/${cardId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}
export async function deleteCard(cardId) {
  const res = await fetch(`${BASE_URL}/api/flashcards/cards/${cardId}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  return res.json();
}