// Get HTML elements
const originalPrompt = document.getElementById("originalPrompt");
const topicInput = document.getElementById("topic");
const audienceInput = document.getElementById("audience");
const styleInput = document.getElementById("style");

const improvedPrompt = document.getElementById("improvedPrompt");

const originalResponse = document.getElementById("originalResponse");
const improvedResponse = document.getElementById("improvedResponse");

const evaluationResults = document.getElementById("evaluationResults");

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

// Render sanitized Markdown responses
function renderResponse(element, text) {
    const cleanedText = text
        .replace(/\r\n/g, "\n")
        .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
        .trim();

    element.innerHTML = DOMPurify.sanitize(
        marked.parse(cleanedText)
    );

    // Wrap tables so wide ones scroll horizontally without breaking table layout
    element.querySelectorAll("table").forEach(function (table) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
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

        // Check whether the backend returned an error
        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong.");
        }

        // Display actual AI responses
        renderResponse(originalResponse, data.original_response);
        renderResponse(improvedResponse, data.improved_response);

        // Evaluate both prompts
        displayEvaluation(original, improved);

    } catch (error) {
        console.error("Comparison error:", error);
        originalResponse.textContent = "Failed to generate response.";
        improvedResponse.textContent = "Failed to generate response.";
        evaluationResults.textContent = "Error: " + error.message;
    } finally {
        // Always hides the loader and re-enables the button (both success and error)
        setLoading(false);
    }
});

// STEP 3: Evaluate prompt quality using simple rules
function evaluatePrompt(prompt) {
    const text = prompt.trim();
    const lowerText = text.toLowerCase();

    let specificity = 0;
    let clarity = 0;
    let context = 0;
    let structure = 0;

    // Specificity
    if (text.length >= 30) specificity++;
    if (text.length >= 60) specificity++;
    if (text.length >= 100) specificity++;
    if (/\b(example|such as|including)\b/i.test(text)) specificity++;
    if (/\b(specific|detailed|step-by-step)\b/i.test(text)) specificity++;

    // Clarity
    if (/\b(explain|describe|summarize|compare|list|create|write)\b/i.test(lowerText)) clarity += 2;
    if (text.split(/\s+/).length >= 8) clarity++;
    if (/[.!?]$/.test(text)) clarity++;
    if (/\b(please|your task|you should)\b/i.test(lowerText)) clarity++;

    // Context
    if (/\b(for|audience|student|beginner|expert|professional)\b/i.test(lowerText)) context += 2;
    if (/\b(context|background|assume|scenario)\b/i.test(lowerText)) context += 2;
    if (/\b(because|purpose|goal|reason)\b/i.test(lowerText)) context++;

    // Structure
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

// STEP 4: Display evaluation results
function displayEvaluation(originalPrompt, improvedPrompt) {
    const original = evaluatePrompt(originalPrompt);
    const improved = evaluatePrompt(improvedPrompt);

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
}// STEP 5: Copy Improved Prompt

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