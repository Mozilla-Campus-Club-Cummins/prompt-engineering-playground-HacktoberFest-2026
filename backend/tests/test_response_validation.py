
import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

# Allow tests to import backend/main.py.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Use a placeholder key for tests; no real API calls are made.
os.environ.setdefault("GROQ_API_KEY", "test-key")

import main


class GenerateResponseTests(unittest.TestCase):

    def generate_with_mock_response(self, response):
        with patch.object(
            main.client.chat.completions,
            "create",
            return_value=response,
        ):
            return main.generate_response("test prompt")

    def test_empty_choices_returns_empty_string(self):
        response = SimpleNamespace(choices=[])

        result = self.generate_with_mock_response(response)

        self.assertEqual(result, "")

    def test_missing_choices_field_returns_empty_string(self):
        response = SimpleNamespace()

        result = self.generate_with_mock_response(response)

        self.assertEqual(result, "")

    def test_missing_message_returns_empty_string(self):
        response = SimpleNamespace(
            choices=[SimpleNamespace()]
        )

        result = self.generate_with_mock_response(response)

        self.assertEqual(result, "")

    def test_missing_content_returns_empty_string(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(message=SimpleNamespace())
            ]
        )

        result = self.generate_with_mock_response(response)

        self.assertEqual(result, "")

    def test_empty_or_whitespace_content_returns_empty_string(self):
        for content in ("", "   ", "\n\t  "):
            with self.subTest(content=repr(content)):
                response = SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(content=content)
                        )
                    ]
                )

                result = self.generate_with_mock_response(response)

                self.assertEqual(result, "")

    def test_valid_content_is_trimmed(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content="  Hello AI  ")
                )
            ]
        )

        result = self.generate_with_mock_response(response)

        self.assertEqual(result, "Hello AI")


class ComparePromptsTests(unittest.TestCase):

    def test_unavailable_response_raises_helpful_error(self):
        request = main.CompareRequest(
            original_prompt="Original prompt",
            improved_prompt="Improved prompt",
        )

        with patch.object(
            main,
            "generate_response",
            side_effect=["", "Valid response"],
        ):
            with self.assertRaises(main.HTTPException) as context:
                main.compare_prompts(request)

        self.assertEqual(context.exception.status_code, 502)
        self.assertEqual(
            context.exception.detail,
            "AI response is unavailable. Please try again.",
        )

    def test_valid_responses_are_returned(self):
        request = main.CompareRequest(
            original_prompt="Original prompt",
            improved_prompt="Improved prompt",
        )

        with patch.object(
            main,
            "generate_response",
            side_effect=["Original answer", "Improved answer"],
        ):
            result = main.compare_prompts(request)

        self.assertEqual(
            result,
            {
                "original_response": "Original answer",
                "improved_response": "Improved answer",
            },
        )


if __name__ == "__main__":
    unittest.main()
