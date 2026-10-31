// Unit tests for evaluatePrompt() in script.js
//
// Run from the project root with:  node --test
//
// script.js is a browser script: it reads the DOM and attaches event
// listeners as soon as it loads, so it cannot simply be require()d.
// Instead, the real file is loaded inside a sandbox with a stub `document`,
// and evaluatePrompt is taken from there. This way the tests always run
// against the code that ships, with no changes to script.js.

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadEvaluatePrompt() {
    const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

    const stubElement = () => ({
        value: "",
        textContent: "",
        innerHTML: "",
        disabled: false,
        addEventListener() {},
        setAttribute() {},
        removeAttribute() {},
        classList: { toggle() {} }
    });

    const sandbox = { document: { getElementById: stubElement }, console };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: "script.js" });

    assert.equal(typeof sandbox.evaluatePrompt, "function", "script.js must define evaluatePrompt");

    // Copy the result into this realm so deep-equality checks compare plain objects.
    return (prompt) => ({ ...sandbox.evaluatePrompt(prompt) });
}

const evaluatePrompt = loadEvaluatePrompt();

// Filler text that contains none of the scoring keywords and no end punctuation.
const filler = (length) => "a".repeat(length);

const DIMENSIONS = ["specificity", "clarity", "context", "structure"];

describe("specificity scoring", () => {
    test("scores 0 for text shorter than 30 characters with no keywords", () => {
        assert.equal(evaluatePrompt(filler(29)).specificity, 0);
    });

    test("awards one point each at 30, 60 and 100 characters", () => {
        assert.equal(evaluatePrompt(filler(30)).specificity, 1);
        assert.equal(evaluatePrompt(filler(59)).specificity, 1);
        assert.equal(evaluatePrompt(filler(60)).specificity, 2);
        assert.equal(evaluatePrompt(filler(99)).specificity, 2);
        assert.equal(evaluatePrompt(filler(100)).specificity, 3);
    });

    test("awards one point for an example keyword", () => {
        assert.equal(evaluatePrompt("example").specificity, 1);
        assert.equal(evaluatePrompt("such as").specificity, 1);
        assert.equal(evaluatePrompt("including").specificity, 1);
    });

    test("awards one point for a detail keyword", () => {
        assert.equal(evaluatePrompt("specific").specificity, 1);
        assert.equal(evaluatePrompt("detailed").specificity, 1);
        assert.equal(evaluatePrompt("step-by-step").specificity, 1);
    });

    test("keywords are matched case-insensitively", () => {
        assert.equal(evaluatePrompt("EXAMPLE").specificity, 1);
        assert.equal(evaluatePrompt("Step-By-Step").specificity, 1);
    });

    test("keywords only match whole words", () => {
        assert.equal(evaluatePrompt("counterexample").specificity, 0);
    });

    test("length and keyword points add up to the maximum of 5", () => {
        const prompt = filler(100) + " example specific";
        assert.equal(evaluatePrompt(prompt).specificity, 5);
    });
});

describe("clarity scoring", () => {
    test("awards 2 points for an action verb", () => {
        for (const verb of ["explain", "describe", "summarize", "compare", "list", "create", "write"]) {
            assert.equal(evaluatePrompt(verb).clarity, 2, verb);
        }
    });

    test("several action verbs do not stack", () => {
        assert.equal(evaluatePrompt("explain and describe").clarity, 2);
    });

    test("awards 1 point for 8 or more words, not for 7", () => {
        assert.equal(evaluatePrompt("one two three four five six seven").clarity, 0);
        assert.equal(evaluatePrompt("one two three four five six seven eight").clarity, 1);
    });

    test("awards 1 point for ending punctuation", () => {
        assert.equal(evaluatePrompt("Hello").clarity, 0);
        assert.equal(evaluatePrompt("Hello.").clarity, 1);
        assert.equal(evaluatePrompt("Hello!").clarity, 1);
        assert.equal(evaluatePrompt("Hello?").clarity, 1);
    });

    test("ignores trailing whitespace when checking end punctuation", () => {
        assert.equal(evaluatePrompt("Hello.   \n").clarity, 1);
    });

    test("awards 1 point for polite or directive phrasing", () => {
        assert.equal(evaluatePrompt("please").clarity, 1);
        assert.equal(evaluatePrompt("your task").clarity, 1);
        assert.equal(evaluatePrompt("you should").clarity, 1);
    });

    test("all clarity rules together give the maximum of 5", () => {
        const prompt = "Please explain how photosynthesis works in green plants.";
        assert.equal(evaluatePrompt(prompt).clarity, 5);
    });
});

describe("context scoring", () => {
    test("awards 2 points for audience words", () => {
        for (const word of ["for", "audience", "student", "beginner", "expert", "professional"]) {
            assert.equal(evaluatePrompt(word).context, 2, word);
        }
    });

    test("awards 2 points for background words", () => {
        for (const word of ["context", "background", "assume", "scenario"]) {
            assert.equal(evaluatePrompt(word).context, 2, word);
        }
    });

    test("awards 1 point for purpose words", () => {
        for (const word of ["because", "purpose", "goal", "reason"]) {
            assert.equal(evaluatePrompt(word).context, 1, word);
        }
    });

    test("words inside longer words do not count", () => {
        assert.equal(evaluatePrompt("forecast").context, 0);
    });

    test("all context rules together give the maximum of 5", () => {
        assert.equal(evaluatePrompt("for background because").context, 5);
    });
});

describe("structure scoring", () => {
    test("awards 2 points for a requested output format", () => {
        for (const word of ["bullet points", "numbered list", "table", "paragraph", "json", "format"]) {
            assert.equal(evaluatePrompt(word).structure, 2, word);
        }
    });

    test("awards 2 points for a length or size constraint", () => {
        for (const word of ["short", "concise", "detailed", "word limit", "words", "steps"]) {
            assert.equal(evaluatePrompt(word).structure, 2, word);
        }
    });

    test("awards 1 point for include/avoid style constraints", () => {
        for (const word of ["include", "avoid", "don't", "do not", "must"]) {
            assert.equal(evaluatePrompt(word).structure, 1, word);
        }
    });

    test("all structure rules together give the maximum of 5", () => {
        assert.equal(evaluatePrompt("table short must").structure, 5);
    });
});

describe("empty and short prompts", () => {
    const zero = { specificity: 0, clarity: 0, context: 0, structure: 0, total: 0 };

    test("an empty prompt scores 0 everywhere", () => {
        assert.deepEqual(evaluatePrompt(""), zero);
    });

    test("a whitespace-only prompt scores 0 everywhere", () => {
        assert.deepEqual(evaluatePrompt("   "), zero);
        assert.deepEqual(evaluatePrompt("\n\t  \n"), zero);
    });

    test("very short prompts without keywords score 0", () => {
        assert.deepEqual(evaluatePrompt("Hi"), zero);
        assert.deepEqual(evaluatePrompt("a"), zero);
    });

    test("a short prompt with only an action verb scores just the clarity verb points", () => {
        assert.deepEqual(evaluatePrompt("Explain AI"), {
            specificity: 0, clarity: 2, context: 0, structure: 0, total: 2
        });
        assert.deepEqual(evaluatePrompt("Explain AI."), {
            specificity: 0, clarity: 3, context: 0, structure: 0, total: 3
        });
    });

    test("leading and trailing whitespace does not change the score", () => {
        assert.deepEqual(evaluatePrompt("  Explain AI  "), evaluatePrompt("Explain AI"));
    });
});

describe("total score", () => {
    // A prompt that earns every available point in every dimension.
    const maximalPrompt =
        "Please explain this specific topic for a beginner with background knowledge, " +
        "because the goal is learning, using an example. " +
        "Use bullet points, keep it short, and you must avoid jargon.";

    test("a prompt that satisfies every rule scores exactly 20", () => {
        assert.deepEqual(evaluatePrompt(maximalPrompt), {
            specificity: 5, clarity: 5, context: 5, structure: 5, total: 20
        });
    });

    test("never exceeds 20 for very long, keyword-stuffed prompts", () => {
        const stuffed = (maximalPrompt + " ").repeat(500);
        const result = evaluatePrompt(stuffed);
        assert.equal(result.total, 20);
        for (const dimension of DIMENSIONS) {
            assert.ok(result[dimension] <= 5, `${dimension} must not exceed 5`);
        }
    });

    test("stays between 0 and 20 for every combination of keyword phrases", () => {
        const phrases = [
            "Please", "explain", "for a beginner", "background", "because",
            "an example", "specific", "step-by-step", "bullet points",
            "short", "you must", "Do not use jargon."
        ];

        for (let mask = 0; mask < 2 ** phrases.length; mask++) {
            const prompt = phrases.filter((_, i) => mask & (1 << i)).join(" ");
            const result = evaluatePrompt(prompt);

            assert.ok(result.total >= 0 && result.total <= 20, `total out of range for: "${prompt}"`);
            assert.equal(
                result.total,
                result.specificity + result.clarity + result.context + result.structure,
                `total must equal the sum of the parts for: "${prompt}"`
            );
        }
    });

    test("each dimension is a whole number from 0 to 5", () => {
        const prompts = [
            "", "Hi", "Explain AI.", "x".repeat(10000), maximalPrompt,
            "Write a table in JSON format, including an example.",
            "¿Qué es la fotosíntesis? 🌱", "line one\nline two\n\nline three"
        ];

        for (const prompt of prompts) {
            const result = evaluatePrompt(prompt);
            for (const dimension of DIMENSIONS) {
                assert.ok(Number.isInteger(result[dimension]), `${dimension} must be an integer`);
                assert.ok(result[dimension] >= 0 && result[dimension] <= 5, `${dimension} must be 0-5`);
            }
        }
    });

    test("gives the same result every time for the same prompt", () => {
        assert.deepEqual(evaluatePrompt(maximalPrompt), evaluatePrompt(maximalPrompt));
    });
});

describe("typical prompts", () => {
    test("scores the improved prompt the app generates from its template", () => {
        // Template in script.js: `Explain ${topic} to a ${audience} using ${style}.`
        const prompt = "Explain recursion to a beginner using step-by-step examples.";
        assert.deepEqual(evaluatePrompt(prompt), {
            specificity: 3, clarity: 4, context: 2, structure: 0, total: 9
        });
    });

    test("a detailed prompt scores higher than a vague one", () => {
        const vague = evaluatePrompt("Tell me about dogs");
        const detailed = evaluatePrompt(
            "Please describe dog breeds for a beginner, including an example of each. " +
            "Use a short bullet points format."
        );
        assert.equal(vague.total, 0);
        assert.ok(detailed.total > vague.total);
    });
});
