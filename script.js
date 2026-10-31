
const originalPrompt = document.getElementById("originalPrompt");
const topicInput = document.getElementById("topic");
const audienceInput = document.getElementById("audience");
const styleInput = document.getElementById("style");

const improvedPrompt = document.getElementById("improvedPrompt");

const originalResponse = document.getElementById("originalResponse");
const improvedResponse = document.getElementById("improvedResponse");

const evaluationResults = document.getElementById("evaluationResults");
const promptHistoryList = document.getElementById("promptHistoryList");
const clearPromptHistoryButton = document.getElementById("clearPromptHistory");

const HISTORY_KEY = "promptComparisonHistory";
const MAX_HISTORY_ITEMS = 20;

let promptHistory = [];

try {
    const savedHistory = sessionStorage.getItem(HISTORY_KEY);
    const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];

    if (Array.isArray(parsedHistory)) {
        promptHistory = parsedHistory.filter(item =>
            item &&
            typeof item.id === "string" &&
            typeof item.originalPrompt === "string" &&
            typeof item.improvedPrompt === "string" &&
            typeof item.originalResponse === "string" &&
            typeof item.improvedResponse === "string" &&
            item.originalEvaluation &&
            item.improvedEvaluation
        ).slice(0, MAX_HISTORY_ITEMS);
    }
} catch (error) {
    promptHistory = [];
}

function savePromptHistory() {
    try {
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(promptHistory));
    } catch (error) {
        console.error("Could not save prompt history:", error);
        alert("Unable to save prompt history in this browser session.");
    }
}

function renderResponse(element, text) {
    const cleanedText = String(text)
        .replace(/\r\n/g, "\n")
        .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
        .trim();

    element.innerHTML = DOMPurify.sanitize(marked.parse(cleanedText));
}

function displayEvaluation(originalPromptText, improvedPromptText) {
    const original = evaluatePrompt(originalPromptText);
    const improved = evaluatePrompt(improvedPromptText);

    evaluationResults.innerHTML = `
        <h3>Original Prompt: ${original.total}/20</h3>
        <p>Specificity: ${original.specificity}/5</p>
        <p>Clarity: ${original.clarity}/5</p>
        <p>Context: ${original.context}/5</p>
        <p>Structure: ${original.structure}/5</p>

        <hr>

        <h3>Improved Prompt: ${improved.total}/20</h3>
        <p>Specificity: ${improved.specificity}/5</p>
        <p>Clarity: ${improved.clarity}/5</p>
        <p>Context: ${improved.context}/5</p>
        <p>Structure: ${improved.structure}/5</p>

        <hr>

        <h3>Score Difference: ${improved.total - original.total} points</h3>
        <p>Note: These are rule-based scores, not a guarantee of response quality.</p>
    `;
}

function evaluatePrompt(prompt) {
    const text = prompt.trim();
    const lowerText = text.toLowerCase();

    let specificity = 0;
    let clarity = 0;
    let context = 0;
    let structure = 0;

    if (text.length >= 30) specificity++;
    if (text.length >= 60) specificity++;
    if (text.length >= 100) specificity++;
    if (/\b(example|such as|including)\b/i.test(text)) specificity++;
    if (/\b(specific|detailed|step-by-step)\b/i.test(text)) specificity++;

    if (/\b(explain|describe|summarize|compare|list|create|write)\b/i.test(lowerText)) clarity += 2;
    if (text.split(/\s+/).length >= 8) clarity++;
    if (/[.!?]$/.test(text)) clarity++;
    if (/\b(please|your task|you should)\b/i.test(lowerText)) clarity++;

    if (/\b(for|audience|student|beginner|expert|professional)\b/i.test(lowerText)) context += 2;
    if (/\b(context|background|assume|scenario)\b/i.test(lowerText)) context += 2;
    if (/\b(because|purpose|goal|reason)\b/i.test(lowerText)) context++;

    if (/\b(bullet points|numbered list|table|paragraph|json|format)\b/i.test(lowerText)) structure += 2;
    if (/\b(short|concise|detailed|word limit|words|steps)\b/i.test(lowerText)) structure += 2;
    if (/\b(include|avoid|don't|do not|must)\b/i.test(lowerText)) structure++;

    specificity = Math.min(specificity, 5);
    clarity = Math.min(clarity, 5);
    context = Math.min(context, 5);
    structure = Math.min(structure, 5);

    return {
        specificity,
        clarity,
        context,
        structure,
        total: specificity + clarity + context + structure
    };
}

function renderPromptHistory() {
    promptHistoryList.replaceChildren();

    if (promptHistory.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "history-empty";
        emptyMessage.textContent =
            "No prompt history yet. Compare two prompts to get started.";

        promptHistoryList.appendChild(emptyMessage);
        return;
    }

    promptHistory.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "history-item";

        const title = document.createElement("h3");
        title.textContent = `Comparison ${promptHistory.length - index}`;

        const date = document.createElement("p");
        date.className = "history-date";
        date.textContent = new Date(item.createdAt).toLocaleString();

        const originalLabel = document.createElement("strong");
        originalLabel.textContent = "Original prompt";

        const originalText = document.createElement("p");
        originalText.textContent = item.originalPrompt;

        const improvedLabel = document.createElement("strong");
        improvedLabel.textContent = "Improved prompt";

        const improvedText = document.createElement("p");
        improvedText.textContent = item.improvedPrompt;

        const scores = document.createElement("p");
        scores.textContent =
            `Scores: Original ${item.originalEvaluation.total}/20 · ` +
            `Improved ${item.improvedEvaluation.total}/20`;

        const actions = document.createElement("div");
        actions.className = "history-actions";

        const restoreButton = document.createElement("button");
        restoreButton.type = "button";
        restoreButton.className = "restore-history";
        restoreButton.textContent = "Restore Comparison";

        restoreButton.addEventListener("click", () => {
            restorePromptHistory(item.id);
        });

        actions.appendChild(restoreButton);

        card.append(
            title,
            date,
            originalLabel,
            originalText,
            improvedLabel,
            improvedText,
            scores,
            actions
        );

        promptHistoryList.appendChild(card);
    });
}

function addToPromptHistory(original, improved, originalAI, improvedAI) {
    const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        originalPrompt: original,
        improvedPrompt: improved,
        originalResponse: originalAI,
        improvedResponse: improvedAI,
        originalEvaluation: evaluatePrompt(original),
        improvedEvaluation: evaluatePrompt(improved)
    };

    promptHistory.unshift(item);
    promptHistory = promptHistory.slice(0, MAX_HISTORY_ITEMS);

    savePromptHistory();
    renderPromptHistory();
}

function restorePromptHistory(id) {
    const item = promptHistory.find(entry => entry.id === id);

    if (!item) {
        alert("This history entry could not be found.");
        return;
    }

    originalPrompt.value = item.originalPrompt;
    improvedPrompt.value = item.improvedPrompt;

    renderResponse(originalResponse, item.originalResponse);
    renderResponse(improvedResponse, item.improvedResponse);

    displayEvaluation(item.originalPrompt, item.improvedPrompt);

    document.getElementById("originalPrompt").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Loading indicator and compare button elements
const compareResponsesBtn = document.getElementById("compareResponses");
const loadingIndicator = document.getElementById("loadingIndicator");

let isProcessing = false;

// Helper to toggle loading indicator and button state
function setLoading(isLoading) {
    isProcessing = isLoading;

    if (compareResponsesBtn) {
        compareResponsesBtn.disabled = isLoading;
        compareResponsesBtn.textContent = isLoading ? "Generating..." : "Compare Responses";
        if (isLoading) {
            compareResponsesBtn.setAttribute("aria-busy", "true");
        } else {
            compareResponsesBtn.removeAttribute("aria-busy");
        }
    }

    if (loadingIndicator) {
        loadingIndicator.classList.toggle("hidden", !isLoading);
    }
}

// STEP 1: Generate Improved Prompt
document.getElementById("generatePrompt").addEventListener("click", function () {
    const topic = topicInput.value.trim();
    const audience = audienceInput.value;
    const style = styleInput.value;

    if (!topic || !audience || !style) {
        alert("Please fill in the topic, audience, and explanation style.");
        return;
    }

    const finalPrompt = `Explain ${topic} to a ${audience} using ${style}.`;
    improvedPrompt.value = finalPrompt;

    // Reset previous responses
    originalResponse.textContent = "Click Compare Responses to generate the AI response.";
    improvedResponse.textContent = "Click Compare Responses to generate the AI response.";
    evaluationResults.textContent = "Your evaluation results will appear here.";
});



 // Render sanitized Markdown responses safely
function renderResponse(element, text) {
    if (typeof text !== "string" || !text.trim()) {
        element.textContent =
            "AI response is unavailable. Please try again.";
        return;
    }

    const cleanedText = text
        .replace(/\r\n/g, "\n")
        .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
        .trim();

    element.innerHTML = DOMPurify.sanitize(
        marked.parse(cleanedText)
    );
}


// STEP 2: Compare Responses using Groq API
compareResponsesBtn.addEventListener("click", async function () {
    // Guard against duplicate requests while one is already processing
    if (isProcessing) return;

    const original = originalPrompt.value.trim();
    const improved = improvedPrompt.value.trim();

    if (!original) {
        alert("Please enter your original prompt first.");
        return;
    }

    if (!improved) {
        alert("Please generate an improved prompt first.");
        return;
    }

    // Trigger visual loading indicator and disable button
    setLoading(true);

    // Initial message placeholders while loading
    originalResponse.textContent = "Generating AI response...";
    improvedResponse.textContent = "Generating AI response...";
    evaluationResults.textContent = "Waiting for AI responses...";

    try {
        // Send both prompts to Python FastAPI backend
        const response = await fetch("http://127.0.0.1:8000/api/compare", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                original_prompt: original,
                improved_prompt: improved
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong.");
        }

        if (
            typeof data.original_response !== "string" ||
            typeof data.improved_response !== "string"
        ) {
            throw new Error("The backend returned an unexpected response.");
        }

        renderResponse(originalResponse, data.original_response);
        renderResponse(improvedResponse, data.improved_response);

        displayEvaluation(original, improved);

        addToPromptHistory(
            original,
            improved,
            data.original_response,
            data.improved_response
        );
    } catch (error) {
         console.error("Comparison error:", error);
        originalResponse.textContent = "Failed to generate response.";
        improvedResponse.textContent = "Failed to generate response.";
         evaluationResults.textContent = "Error: " + error.message;
    } finally {
      setLoading(false);
    }
});

       
clearPromptHistoryButton.addEventListener("click", function () {
    if (promptHistory.length === 0) {
        return;
    }

    const confirmed = confirm("Are you sure you want to clear your prompt history?");

    if (!confirmed) {
        return;
    }

    promptHistory = [];

    try {
        sessionStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error("Could not clear prompt history:", error);
    }

    renderPromptHistory();
});




// STEP 5: Copy Improved Prompt

const copyPromptButton = document.getElementById("copyPrompt");
const copyMessage = document.getElementById("copyMessage");

copyPromptButton.addEventListener("click", async function () {
    const prompt = improvedPrompt.value.trim();

    if (!prompt) {
        copyMessage.textContent = "No improved prompt available to copy.";
        return;
    }

    try {
        await navigator.clipboard.writeText(prompt);
        copyMessage.textContent = "Prompt copied successfully!";
    } catch (error) {
        copyMessage.textContent =
            "Unable to copy the prompt. Please copy it manually.";
    }
});

renderPromptHistory();
