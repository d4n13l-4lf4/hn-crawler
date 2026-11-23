# Research: Dependency Injection with inversify

## Decisions

### DI library: inversify + @inversifyjs/strongly-typed

**Decision**: Use `inversify` 8.3.0 with `@inversifyjs/strongly-typed` 3.0.1 for programmatic dependency injection.

**Rationale**: Both libraries are already installed and configured in the project (see `package.json` dependencies). The user explicitly opted for programmatic DI without decorators to avoid mixing DI concerns into the application, domain, and core layers. `inversify` provides a container with `bind`, `get`, and singleton scope support; `@inversifyjs/strongly-typed` provides type-safe `Symbol`-based tokens via `Symbol.for` / `Symbol.description`, avoiding string-based token collisions.

**Alternatives considered**: None. The library choice and decorator-free approach were already decided as part of the feature plan; no evaluation of alternative DI libraries was needed.

### Token strategy: Symbol-based identifiers

**Decision**: Define container binding tokens as `Symbol` values in `src/bootstrap/tokens.ts`, using `@inversifyjs/strongly-typed` for type safety.

**Rationale**: Symbols provide unique, collision-free identifiers that are scoped to the module. Strongly-typed tokens give compile-time type safety when binding and resolving. This aligns with the project's strict TypeScript settings and avoids the fragility of string-based tokens.

### Binding scope: all classes as singletons

**Decision**: Every class binding in the container is registered as a singleton (`inversify` `inSingletonScope`).

**Rationale**: The user specified all classes are bound as singletons. This matches the current behavior where the composition root instantiates each dependency once and reuses it throughout the application lifetime.

### Container composition: `createContainer` in `src/bootstrap/container.ts`

**Decision**: Export a `createContainer` function that assembles and returns the configured `Container` instance with all bindings registered.

**Rationale**: Keeps container creation explicit and testable. The composition root (`src/main.ts`) calls `createContainer` at startup, resolves the services it needs, and proceeds with the existing behavior (migration, CLI registration, parsing).

### Binding map: `src/bootstrap/binding.map.ts`

**Decision**: Define binding type aliases/interfaces in `binding.map.ts` that document which token resolves to which concrete type and scope.

**Rationale**: Provides a single source of truth for the binding graph, making dependencies explicit and reviewable. Separates type-level binding declarations from runtime container assembly.

### CLI commands out of scope for container integration

**Decision**: Do not bind CLI commands (root or subcommands) into the container in this task.

**Rationale**: Per the user's plan, CLI command integration is deferred to a future task. The composition root resolves use cases from the container and passes them to command constructors manually, preserving the current behavior.

### Composition root relocation

**Decision**: Move `src/presentation/main.ts` to `src/main.ts` and refactor it to use the container instead of manual wiring.

**Rationale**: Per the feature requirement, the composition root moves to `src/main.ts`. The `src/bootstrap/` folder hosts the DI wiring. `src/presentation/main.ts` is deleted.
