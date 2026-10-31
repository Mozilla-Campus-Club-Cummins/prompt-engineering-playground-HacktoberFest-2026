# 🎯 Prompt Engineering Playground

A beginner-friendly playground to create, compare, and evaluate AI prompts.

Prompt Engineering Playground helps users understand how changing a prompt can affect an AI-generated response. It allows users to compare responses from original and improved prompts and evaluate prompt quality using a rule-based scoring system.

---

## ✨ Features

### 📝 Prompt Builder
Create improved prompts by specifying:
- Topic
- Target audience
- Preferred explanation style

### 🤖 AI Response Comparison
- Generate responses using the Groq API.
- Compare responses from original and improved prompts.
- View both responses side by side.

### 📊 Prompt Quality Evaluation
- Evaluate prompts based on specificity, clarity, context, and structure.
- Display scores for each criterion.
- Calculate a total score out of 20.
- Compare the quality scores of original and improved prompts.

**Note:** The evaluation system uses rule-based heuristics. The scores are estimates of prompt quality and do not guarantee the quality or accuracy of AI-generated responses.

---

## 🛠️ Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript
- Marked.js
- DOMPurify

**Backend**
- Python
- FastAPI
- Groq API

---

## 📁 Project Structure

```text
prompt-engineering-playground/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── tests/
│   └── evaluatePrompt.test.js
│
├── index.html
├── style.css
├── script.js
├── README.md
├── RESOURCES.md
└── .gitignore
```

---

## ⚙️ Prerequisites

Before starting, make sure you have:

- Python 3.10 or later
- Git
- Visual Studio Code or another code editor
- A Groq API key

---

## 🚀 Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Mayuri0013/prompt-engineering-playground.git
```

Navigate into the project folder:

```bash
cd prompt-engineering-playground
```

### 2. Set Up the Backend

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure the API Key

Create a `.env` file inside the `backend` folder.

Add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace `your_groq_api_key_here` with your actual API key.

**Important:** Never share or upload your API key to GitHub.

### 4. Start the Backend

Run:

```bash
uvicorn main:app --reload
```

The backend will run at:

http://127.0.0.1:8000

You can access the API documentation at:

http://127.0.0.1:8000/docs

### 5. Start the Frontend

Open the project folder in VS Code.

Use the Live Server extension to open `index.html`.

The frontend will usually run at:

http://127.0.0.1:5500

---

## 🧪 How to Use

1. Open the Prompt Engineering Playground in your browser.
2. Enter an original prompt.
3. Select the topic, audience, and explanation style.
4. Click **Generate Improved Prompt**.
5. Review the improved prompt.
6. Click **Compare Responses**.
7. Compare the AI-generated responses.
8. Review the prompt evaluation scores.

---

## ✅ Running Tests

The prompt evaluation logic (`evaluatePrompt` in `script.js`) has unit tests. They use Node.js's built-in test runner, so there is nothing extra to install.

From the project root, run:

```bash
node --test
```

This needs Node.js 20 or later. No API key or running backend is required.

---

## 📚 Learning Resources

For beginner-friendly learning materials, setup guidance, and useful references, see:

[RESOURCES.md](RESOURCES.md)

---

## 🤝 Contributing

Contributions are welcome!

1. Explore the open issues in the repository.
2. Choose an issue you would like to work on.
3. Comment on the issue before starting work.
4. Fork the repository.
5. Create a new branch.
6. Make your changes and test them.
7. Submit a pull request describing your changes.

Please follow the project's contribution guidelines and keep your changes focused on the selected issue.

---

## 📌 Future Improvements

- Add more prompt templates.
- Improve prompt evaluation logic.
- Add prompt history.
- Add response export functionality.
- Improve mobile responsiveness.
- Improve AI response formatting.
- Add automated tests.

---

## 👩‍💻 Project Maintainer

**Mayuri Ingle**

GitHub: [Mayuri0013](https://github.com/Mayuri0013)

---

## 📄 License

A license has not yet been specified for this project.
