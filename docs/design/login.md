# Login — design prototype (placeholder)

> **Placeholder for issue #68.** The real high-fidelity prototype belongs in
> Claude Design. This describes the intended layout so the functional screen
> (issue #69, already implemented) has a reference.

## Purpose

Single entry point for members and admins to exchange credentials for a JWT.
Anonymous visitors reach it from the header's "Login" action.

## Proposed layout

```
            SprintWell
        ┌────────────────────┐
        │  Sign in           │
        │                    │
        │  Email             │
        │  [________________]│
        │  Password          │
        │  [________________]│
        │                    │
        │  (!) error message │   ← only on failure
        │                    │
        │  [    Sign in    ] │   ← full width, disabled while submitting
        └────────────────────┘
```

- Centered card, max width ~24rem, on the app background.
- Labels above inputs; email + password with proper `autoComplete`.
- Inline error region (`role="alert"`) between the fields and the button.
- Submit button shows a "Signing in…" state while the request is in flight.

## States

- **Idle** — empty form, button enabled.
- **Submitting** — button disabled, label "Signing in…".
- **Invalid credentials** — red inline message "Invalid email or password.".
- **Network/server error** — inline message "Could not reach the server.".
- **Success** — redirect to the home (public sprints) screen.
