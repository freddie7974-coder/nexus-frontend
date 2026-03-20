Feature: NEXUS Frontend Validation

  # =====================
  # BLACKBOX: BVA Password Validation
  # =====================
  Scenario: Password below minimum boundary is rejected (BVA)
    Given I have the password validator
    When I validate password "abc123"
    Then the result should be invalid
    And the message should contain "Too short"

  Scenario: Password at exact minimum boundary is accepted (BVA)
    Given I have the password validator
    When I validate password "abcd1234"
    Then the result should be valid
    And the message should contain "within accepted range"

  Scenario: Password at exact maximum boundary is accepted (BVA)
    Given I have the password validator
    When I validate password "abcdefghij12345678ab"
    Then the result should be valid
    And the message should contain "within accepted range"

  Scenario: Password above maximum boundary is rejected (BVA)
    Given I have the password validator
    When I validate password "abcdefghij123456789xyz"
    Then the result should be invalid
    And the message should contain "Too long"

  # =====================
  # BLACKBOX: Email Validation
  # =====================
  Scenario: Valid email format is accepted
    Given I have the email validator
    When I validate email "user@nexus.io"
    Then the result should be valid

  Scenario: Invalid email format is rejected
    Given I have the email validator
    When I validate email "not-an-email"
    Then the result should be invalid

