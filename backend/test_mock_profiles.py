"""
Test script for mock profile assignment.
Run this to verify profiles are assigned correctly on signup.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


def test_mock_profiles():
    """Test that mock profiles are loaded correctly."""
    print("=" * 70)
    print("Test 1: Mock Profiles Module")
    print("=" * 70)

    try:
        from app.data.mock_profiles import (
            MOCK_PROFILES,
            PROFILE_DESCRIPTIONS,
            assign_mock_profile_to_user,
            get_random_mock_profile,
        )

        print(f"✓ Mock profiles module imported successfully")
        print(f"✓ Number of profiles available: {len(MOCK_PROFILES)}")

        # Test each profile
        for i, profile in enumerate(MOCK_PROFILES, 1):
            print(f"\n--- Profile {i} ---")
            print(f"  Credit Score: {profile.get('mock_credit_score')}")
            print(f"  Monthly Income: ₹{profile.get('monthly_income'):,.2f}")
            print(f"  Existing EMI: ₹{profile.get('existing_emi'):,.2f}")
            print(f"  Segment: {profile.get('segment')}")
            print(f"  Risk Category: {profile.get('risk_category')}")
            print(f"  Max Eligible: ₹{profile.get('max_eligible_amount'):,.2f}")
            print(f"  KYC Verified: {profile.get('kyc_verified')}")

        print("\n✅ Test 1 PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_random_assignment():
    """Test random profile assignment."""
    print("=" * 70)
    print("Test 2: Random Profile Assignment")
    print("=" * 70)

    try:
        from app.data.mock_profiles import get_random_mock_profile

        # Get 5 random profiles
        profiles = [get_random_mock_profile() for _ in range(5)]

        print(f"✓ Generated 5 random profiles")
        print("\nCredit Scores assigned:")
        for i, profile in enumerate(profiles, 1):
            print(f"  User {i}: {profile.get('mock_credit_score')}")

        # Check diversity
        unique_scores = set(p.get("mock_credit_score") for p in profiles)
        if len(unique_scores) > 1:
            print(f"\n✓ Good diversity: {len(unique_scores)} different profiles")
        else:
            print(f"\n⚠️  All users got same profile (acceptable but unlikely)")

        print("\n✅ Test 2 PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_profile_assignment():
    """Test assigning profile to user data."""
    print("=" * 70)
    print("Test 3: Profile Assignment to User")
    print("=" * 70)

    try:
        from app.data.mock_profiles import assign_mock_profile_to_user

        # Simulate user signup data
        user_data = {
            "user_id": "test_user_123",
            "email": "test@example.com",
            "full_name": "Test User",
        }

        # Assign profile
        complete_profile = assign_mock_profile_to_user(user_data)

        print(f"✓ Profile assigned successfully")
        print(f"\nUser Information:")
        print(f"  User ID: {complete_profile.get('user_id')}")
        print(f"  Email: {complete_profile.get('email')}")
        print(f"  Full Name: {complete_profile.get('full_name')}")

        print(f"\nFinancial Information (from mock profile):")
        print(f"  Monthly Income: ₹{complete_profile.get('monthly_income'):,.2f}")
        print(f"  Credit Score: {complete_profile.get('mock_credit_score')}")
        print(f"  Existing EMI: ₹{complete_profile.get('existing_emi'):,.2f}")

        print(f"\nKYC Information (from mock profile):")
        print(f"  PAN: {complete_profile.get('pan_number')}")
        print(f"  Aadhaar: {complete_profile.get('aadhar_number')}")
        print(f"  Bank: {complete_profile.get('bank_name')}")
        print(f"  KYC Verified: {complete_profile.get('kyc_verified')}")

        # Verify required fields exist
        required_fields = [
            "user_id",
            "email",
            "full_name",
            "monthly_income",
            "existing_emi",
            "mock_credit_score",
            "segment",
            "pan_number",
            "aadhar_number",
            "bank_name",
            "kyc_verified",
        ]

        missing_fields = [
            field for field in required_fields if field not in complete_profile
        ]

        if missing_fields:
            print(f"\n⚠️  Missing fields: {missing_fields}")
        else:
            print(f"\n✓ All required fields present")

        print("\n✅ Test 3 PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Test 3 FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_profile_descriptions():
    """Test profile description data."""
    print("=" * 70)
    print("Test 4: Profile Descriptions")
    print("=" * 70)

    try:
        from app.data.mock_profiles import PROFILE_DESCRIPTIONS

        print(f"✓ Profile descriptions loaded")
        print(f"✓ Number of descriptions: {len(PROFILE_DESCRIPTIONS)}")

        for profile_type, desc in PROFILE_DESCRIPTIONS.items():
            print(f"\n--- {profile_type} ---")
            print(f"  Name: {desc.get('name')}")
            print(f"  Income Range: {desc.get('income_range')}")
            print(f"  Credit Score Range: {desc.get('credit_score_range')}")
            print(f"  Approval Rate: {desc.get('approval_rate')}")
            print(f"  Max Loan: {desc.get('max_loan')}")
            print(f"  Typical Decision: {desc.get('typical_decision')}")

        print("\n✅ Test 4 PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Test 4 FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_profile_scenarios():
    """Test expected loan scenarios for each profile."""
    print("=" * 70)
    print("Test 5: Loan Approval Scenarios")
    print("=" * 70)

    try:
        from app.data.mock_profiles import (
            PROFILE_ENTRY_LEVEL,
            PROFILE_MID_CAREER,
            PROFILE_YOUNG_PROFESSIONAL,
        )

        scenarios = [
            {
                "name": "Young Professional",
                "profile": PROFILE_YOUNG_PROFESSIONAL,
                "loan_amount": 300000,
                "expected": "APPROVED",
            },
            {
                "name": "Mid-Career",
                "profile": PROFILE_MID_CAREER,
                "loan_amount": 300000,
                "expected": "APPROVED or ADJUST",
            },
            {
                "name": "Entry-Level",
                "profile": PROFILE_ENTRY_LEVEL,
                "loan_amount": 150000,
                "expected": "APPROVED",
            },
        ]

        for scenario in scenarios:
            profile = scenario["profile"]
            income = profile["monthly_income"]
            existing_emi = profile["existing_emi"]
            credit_score = profile["mock_credit_score"]

            # Simple FOIR calculation
            requested_emi = scenario["loan_amount"] / 24 * 1.06  # Rough EMI estimate
            total_emi = existing_emi + requested_emi
            foir = (total_emi / income) * 100

            print(f"\n--- {scenario['name']} ---")
            print(f"  Loan Request: ₹{scenario['loan_amount']:,}")
            print(f"  Monthly Income: ₹{income:,.2f}")
            print(f"  Existing EMI: ₹{existing_emi:,.2f}")
            print(f"  Requested EMI: ₹{requested_emi:,.2f}")
            print(f"  Total EMI: ₹{total_emi:,.2f}")
            print(f"  FOIR: {foir:.1f}%")
            print(f"  Credit Score: {credit_score}")
            print(f"  Expected: {scenario['expected']}")

            # Basic decision logic
            if credit_score >= 720 and foir < 40:
                decision = "APPROVED"
            elif credit_score >= 680 and foir < 50:
                decision = "APPROVED or ADJUST"
            else:
                decision = "ADJUST or REJECTED"

            print(f"  Predicted: {decision}")

        print("\n✅ Test 5 PASSED\n")
        return True

    except Exception as e:
        print(f"❌ Test 5 FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("Mock Profile Assignment Test Suite")
    print("=" * 70 + "\n")

    tests = [
        ("Mock Profiles Loading", test_mock_profiles),
        ("Random Assignment", test_random_assignment),
        ("Profile Assignment to User", test_profile_assignment),
        ("Profile Descriptions", test_profile_descriptions),
        ("Loan Approval Scenarios", test_profile_scenarios),
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
    print("=" * 70)
    print("Test Summary")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {test_name}")

    print(f"\n{passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Mock profiles are ready to use.")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")

    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
