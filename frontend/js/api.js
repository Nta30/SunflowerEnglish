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

// exam api
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

export async function submitExam(examId, answers, selectedParts = [], timeSpent = 0) {
    const res = await fetch(`${BASE_URL}/api/exams/${examId}/submit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ answers, selectedParts, timeSpent })
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
// ========== Admin API — Dashboard ==========

export async function getAdminStats() {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
        headers: authHeaders()
    });
    return res.json();
}

// ========== Admin API — Users ==========

export async function getAdminUsers() {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function createAdminUser(data) {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function updateAdminUser(id, data) {
    const res = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deleteAdminUser(id) {
    const res = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    return res.json();
}

export async function toggleUserStatus(id) {
    const res = await fetch(`${BASE_URL}/api/admin/users/${id}/toggle-status`, {
        method: "PUT",
        headers: authHeaders()
    });
    return res.json();
}

// ========== Admin API — Exams ==========

export async function getAdminExams() {
    const res = await fetch(`${BASE_URL}/api/admin/exams`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function createAdminExam(data) {
    const res = await fetch(`${BASE_URL}/api/admin/exams`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function updateAdminExam(id, data) {
    const res = await fetch(`${BASE_URL}/api/admin/exams/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deleteAdminExam(id) {
    const res = await fetch(`${BASE_URL}/api/admin/exams/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    return res.json();
}

export async function toggleExamStatus(id) {
    const res = await fetch(`${BASE_URL}/api/admin/exams/${id}/toggle-status`, {
        method: "PUT",
        headers: authHeaders()
    });
    return res.json();
}

// ========== Admin API — Questions ==========

export async function getExamQuestions(examId) {
    const res = await fetch(`${BASE_URL}/api/admin/exams/${examId}/questions`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function createQuestion(examId, data) {
    const res = await fetch(`${BASE_URL}/api/admin/exams/${examId}/questions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function updateQuestion(questionId, data) {
    const res = await fetch(`${BASE_URL}/api/admin/questions/${questionId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deleteQuestion(questionId) {
    const res = await fetch(`${BASE_URL}/api/admin/questions/${questionId}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    return res.json();
}

export async function getExamGroups(examId) {
    const res = await fetch(`${BASE_URL}/api/admin/exams/${examId}/groups`, {
        headers: authHeaders()
    });
    return res.json();
}

// ========== Admin API — Flashcard Stats ==========

export async function getFlashcardStats() {
    const res = await fetch(`${BASE_URL}/api/admin/flashcard-stats`, {
        headers: authHeaders()
    });
    return res.json();
}

// ========== Admin API — File Upload ==========

export async function uploadFile(file, type = 'image') {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
        method: "POST",
        headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
    });
    return res.json();
}

// ========== Admin API — Group Creation ==========

export async function createGroup(formData) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/admin/groups`, {
        method: "POST",
        headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
    });
    return res.json();
}