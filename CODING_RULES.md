# AI Coding Rules and Best Practices

## Core Principles

All AI tools working on this codebase MUST follow these fundamental principles:

### 1. SOLID Principles

#### S - Single Responsibility Principle (SRP)

- **Rule**: Each class/module should have only ONE reason to change
- **Guidelines**:
  - One class = one responsibility
  - Split large classes into smaller, focused ones
  - Functions should do one thing and do it well
  - Avoid "god objects" that know or do too much

#### O - Open/Closed Principle (OCP)

- **Rule**: Software entities should be open for extension but closed for modification
- **Guidelines**:
  - Use interfaces and abstract classes for extensibility
  - Prefer composition over modification
  - Design for future additions without breaking existing code
  - Use dependency injection for flexibility

#### L - Liskov Substitution Principle (LSP)

- **Rule**: Subtypes must be substitutable for their base types
- **Guidelines**:
  - Child classes should not break parent class contracts
  - Override methods should maintain expected behavior
  - Don't strengthen preconditions or weaken postconditions

#### I - Interface Segregation Principle (ISP)

- **Rule**: Clients should not be forced to depend on interfaces they don't use
- **Guidelines**:
  - Create small, specific interfaces
  - Don't create fat interfaces with many methods
  - Split large interfaces into cohesive smaller ones

#### D - Dependency Inversion Principle (DIP)

- **Rule**: Depend on abstractions, not on concretions
- **Guidelines**:
  - High-level modules should not depend on low-level modules
  - Both should depend on abstractions
  - Use dependency injection containers where appropriate

---

### 2. DRY Principle (Don't Repeat Yourself)

- **Rule**: Every piece of knowledge must have a single, unambiguous representation
- **Guidelines**:
  - Extract duplicate code into reusable functions/methods
  - Create utility/helper modules for common operations
  - Use inheritance or composition to share behavior
  - Avoid copy-paste programming
  - **Exception**: Don't over-DRY - similar code is not always duplicate logic

---

### 3. KISS Principle (Keep It Simple, Stupid)

- **Rule**: Simplicity should be a key goal; unnecessary complexity should be avoided
- **Guidelines**:
  - Choose the simplest solution that works
  - Avoid over-engineering
  - Don't add functionality until you need it (YAGNI)
  - Prefer clear, straightforward code over clever tricks
  - If you can't explain it simply, refactor it

---

## Code Readability Rules

### Naming Conventions

1. **Be Descriptive and Meaningful**

   ```
   ✅ Good: getUserById(), calculateTotalPrice(), isEmailValid()
   ❌ Bad: getData(), calc(), check()
   ```

2. **Use Consistent Naming**
   - Classes: PascalCase (`UserService`, `PaymentProcessor`)
   - Functions/Methods: camelCase (`fetchUserData`, `processPayment`)
   - Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `API_BASE_URL`)
   - Variables: camelCase (`userName`, `totalAmount`)
   - Private members: prefix with underscore (`_privateMethod`, `_internalState`)

3. **Avoid Abbreviations**

   ```
   ✅ Good: customerRepository, userAuthentication
   ❌ Bad: custRepo, usrAuth
   ```

4. **Boolean Names Should Be Questions**
   ```
   ✅ Good: isValid, hasPermission, canEdit, shouldRetry
   ❌ Bad: valid, permission, edit, retry
   ```

---

### Function/Method Guidelines

1. **Keep Functions Small**
   - Aim for 10-20 lines (excluding comments)
   - Maximum 50 lines per function
   - If longer, split into smaller functions

2. **Function Parameters**
   - Maximum 3-4 parameters
   - Use objects/config for more parameters
   - Use default parameters when appropriate

3. **Single Level of Abstraction**
   - All code in a function should be at the same level of abstraction
   - Mix high-level and low-level operations in separate functions

4. **Avoid Side Effects**
   - Functions should be pure when possible
   - If side effects exist, make them obvious in the name
   - Document side effects in comments

---

### Code Structure

1. **File Organization**
   - One class per file (in most cases)
   - Group related functions in modules
   - Maximum 300-400 lines per file
   - Use clear folder structure

2. **Import Statements**
   - Group imports logically:
     1. Standard library imports
     2. Third-party imports
     3. Local application imports
   - Sort alphabetically within groups

3. **Vertical Ordering**
   - Public methods before private
   - Called functions should be below calling functions
   - Related functions should be close together

---

### Comments and Documentation

1. **Write Self-Documenting Code**
   - Code should be readable without comments
   - Use comments to explain WHY, not WHAT

2. **When to Comment**
   - Complex algorithms or business logic
   - Non-obvious workarounds or hacks
   - Important decisions and trade-offs
   - TODOs and FIXMEs (with ticket references)

3. **Documentation Requirements**
   - All public APIs must have documentation
   - Include parameters, return values, and exceptions
   - Provide usage examples for complex functions

4. **Comment Quality**
   ```
   ✅ Good: // Using binary search because dataset can exceed 10M records
   ❌ Bad: // Loop through array
   ```

---

### Error Handling

1. **Use Specific Exception Types**
   - Don't catch generic exceptions unless absolutely necessary
   - Create custom exception classes for domain-specific errors

2. **Fail Fast**
   - Validate inputs early
   - Throw exceptions for invalid states
   - Don't hide errors

3. **Meaningful Error Messages**
   - Include context in error messages
   - Log appropriate details for debugging
   - Don't expose sensitive information

---

### Code Formatting

1. **Consistent Indentation**
   - Use 2 or 4 spaces (never tabs)
   - Be consistent across the project

2. **Line Length**
   - Maximum 80-120 characters per line
   - Break long lines intelligently

3. **Whitespace**
   - Use blank lines to separate logical blocks
   - One blank line between methods
   - Two blank lines between classes

4. **Braces and Brackets**
   - Be consistent with placement
   - Follow language conventions

---

## Additional Best Practices

### Testing

- Write testable code
- Aim for high test coverage (>80%)
- Follow AAA pattern: Arrange, Act, Assert
- One assertion per test when possible

### Performance

- Don't optimize prematurely
- Profile before optimizing
- Document performance-critical sections
- Use appropriate data structures

### Security

- Validate all inputs
- Never trust user data
- Use parameterized queries
- Keep dependencies updated
- Don't commit secrets

### Version Control

- Write meaningful commit messages
- Keep commits small and focused
- Reference issue numbers in commits
- Don't commit commented-out code

---

## Code Review Checklist

Before submitting code, ensure:

- [ ] Follows SOLID principles
- [ ] No duplicate code (DRY)
- [ ] Solution is simple and clear (KISS)
- [ ] Names are descriptive and consistent
- [ ] Functions are small and focused
- [ ] Comments explain WHY, not WHAT
- [ ] Error handling is comprehensive
- [ ] Code is properly formatted
- [ ] Tests are included
- [ ] Documentation is updated

---

## Language-Specific Guidelines

### JavaScript/TypeScript

- Use `const` by default, `let` when needed, never `var`
- Prefer arrow functions for callbacks
- Use async/await over promises chains
- Enable strict mode in TypeScript

### Python

- Follow PEP 8 style guide
- Use type hints for function signatures
- Prefer list comprehensions over loops (when readable)
- Use context managers for resource management

### Java

- Follow Java naming conventions
- Use Optional instead of null when appropriate
- Prefer immutable objects
- Use streams for collection operations

### C#

- Follow Microsoft naming conventions
- Use LINQ for collection operations
- Implement IDisposable for unmanaged resources
- Use async/await for I/O operations

---

## Enforcement

These rules are MANDATORY for all AI-generated code. Code that violates these principles should be refactored during code review.

**Remember**: The goal is to write code that is:

- Easy to read and understand
- Easy to maintain and modify
- Easy to test
- Robust and reliable

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler

---

## References

- Clean Code by Robert C. Martin
- The Pragmatic Programmer by Andrew Hunt and David Thomas
- Design Patterns by Gang of Four
- Refactoring by Martin Fowler
