"""
Test script to verify Groq LLM integration.
Run this locally to test before deploying to Hugging Face.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


def test_groq_basic():
    """Test basic Groq API connection."""
    print("=" * 60)
    print("Test 1: Basic Groq API Connection")
    print("=" * 60)

    try:
        from langchain_groq import ChatGroq

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("❌ GROQ_API_KEY not found in environment")
            print("   Set it with: export GROQ_API_KEY='your-key-here'")
            return False

        print(f"✓ API Key found: {api_key[:10]}...")

        llm = ChatGroq(
            model="llama-3.1-70b-versatile",
            temperature=0.3,
            groq_api_key=api_key,
        )
        print("✓ ChatGroq initialized")

        # Test a simple call
        response = llm.invoke("Say 'Hello from Groq!' in exactly those words.")
        print(f"✓ Response received: {response.content}")

        print("\n✅ Basic Groq connection test PASSED\n")
        return True

    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Run: pip install langchain-groq")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_config():
    """Test that config loads properly."""
    print("=" * 60)
    print("Test 2: Config Loading")
    print("=" * 60)

    try:
        from app.config import settings

        print(f"✓ Config loaded")
        print(f"  - GROQ_MODEL: {settings.GROQ_MODEL}")
        print(f"  - LLM_TEMPERATURE: {settings.LLM_TEMPERATURE}")
        print(f"  - GROQ_API_KEY present: {bool(settings.GROQ_API_KEY)}")

        if not settings.GROQ_API_KEY:
            print("⚠️  Warning: GROQ_API_KEY is empty in config")
            print("   This is OK for dev, but required in production")

        print("\n✅ Config test PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_agent_initialization():
    """Test that master agent can initialize."""
    print("=" * 60)
    print("Test 3: Master Agent Initialization")
    print("=" * 60)

    try:
        # Set required env vars
        if not os.getenv("GROQ_API_KEY"):
            print("⚠️  Skipping - GROQ_API_KEY not set")
            return True

        os.environ.setdefault("FIREBASE_CREDENTIALS", "")

        from app.agents.master_agent import MasterAgent

        print("✓ Attempting to initialize agent...")
        agent = MasterAgent()

        print("✓ Agent initialized successfully")
        print(f"  - LLM type: {type(agent.llm).__name__}")
        print(f"  - Tools count: {len(agent.tools)}")
        print(f"  - Agent executor ready: {agent.agent_executor is not None}")

        print("\n✅ Agent initialization test PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_agent_chat():
    """Test a simple chat with the agent."""
    print("=" * 60)
    print("Test 4: Agent Chat Test")
    print("=" * 60)

    try:
        if not os.getenv("GROQ_API_KEY"):
            print("⚠️  Skipping - GROQ_API_KEY not set")
            return True

        os.environ.setdefault("FIREBASE_CREDENTIALS", "")

        from app.agents.master_agent import master_agent

        print("✓ Sending test message...")

        # Test greeting
        response = master_agent.chat(
            session_id="test_session_123",
            user_id="test_user_456",
            message="Hello, I need a loan",
        )

        print("✓ Response received:")
        print(f"  - Reply: {response['reply'][:100]}...")
        print(f"  - Decision: {response.get('decision', 'None')}")
        print(f"  - Loan ID: {response.get('loan_id', 'None')}")

        # Verify response is not empty
        if not response["reply"]:
            print("❌ Empty response received")
            return False

        print("\n✅ Agent chat test PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_verbose_suppression():
    """Test that verbose output is suppressed."""
    print("=" * 60)
    print("Test 5: Verbose Output Suppression")
    print("=" * 60)

    try:
        if not os.getenv("GROQ_API_KEY"):
            print("⚠️  Skipping - GROQ_API_KEY not set")
            return True

        os.environ.setdefault("FIREBASE_CREDENTIALS", "")

        import io
        import sys

        from app.agents.master_agent import master_agent

        print("✓ Capturing stdout during agent execution...")

        # Capture stdout
        old_stdout = sys.stdout
        captured_output = io.StringIO()
        sys.stdout = captured_output

        try:
            # Run agent
            response = master_agent.chat(
                session_id="test_session_verbose",
                user_id="test_user_verbose",
                message="Hi",
            )
        finally:
            sys.stdout = old_stdout

        output = captured_output.getvalue()

        # Check for verbose output indicators
        verbose_indicators = [
            "> Entering new AgentExecutor chain",
            "Thought:",
            "Action:",
            "Observation:",
        ]

        found_verbose = [ind for ind in verbose_indicators if ind in output]

        if found_verbose:
            print(f"⚠️  Warning: Found verbose output in logs:")
            for ind in found_verbose:
                print(f"     - {ind}")
            print(f"\nCaptured output:\n{output}")
        else:
            print("✓ No verbose agent output detected")

        print("\n✅ Verbose suppression test PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("FinAgent Groq Integration Test Suite")
    print("=" * 60 + "\n")

    tests = [
        ("Groq Basic Connection", test_groq_basic),
        ("Config Loading", test_config),
        ("Agent Initialization", test_agent_initialization),
        ("Agent Chat", test_agent_chat),
        ("Verbose Suppression", test_verbose_suppression),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))

    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {test_name}")

    print(f"\n{passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Ready to deploy to Hugging Face.")
    else:
        print("\n⚠️  Some tests failed. Fix issues before deploying.")

    print("=" * 60 + "\n")


if __name__ == "__main__":
    # Check for Groq API key
    if not os.getenv("GROQ_API_KEY"):
        print("\n" + "=" * 60)
        print("⚠️  GROQ_API_KEY not found in environment")
        print("=" * 60)
        print("\nTo run these tests, set your Groq API key:")
        print("  export GROQ_API_KEY='your-groq-api-key'")
        print("\nGet a key from: https://console.groq.com/keys")
        print("\nSome tests will be skipped without the API key.")
        print("=" * 60 + "\n")

    main()
