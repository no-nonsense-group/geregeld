# Bounded contexts

Business code is organized first by bounded context and then by vertical use
case. A context owns its domain language, application ports, persistence
adapters, and slices.

New behavior should normally begin under:

```text
contexts/<context>/slices/<use-case>/
```

Only promote code to a context-level `domain`, `application`, or
`infrastructure` folder after multiple slices genuinely share it.

