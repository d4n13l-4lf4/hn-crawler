# Engineering Approach

## Process

### 1. Understanding the problem

I started by analyzing the requirements and inspecting the target page. The goal was to identify the data to extract, understand the page structure, and gauge the complexity of each requirement. This gave an early view of where the risks were (page parsing, word-count rules, usage tracking) and what the smallest valuable slice of the solution would look like.

### 2. Planning incremental delivery

The work was broken down into an initial backlog of five user stories, each designed to be independently deliverable and verifiable. The aim was to have a working product early and to add capabilities incrementally, rather than building everything at once and integrating at the end.

### 3. De-risking through prototyping

Before committing to a design, I built a minimal proof of concept. I deliberately implemented different architectures, component designs, and technologies, using AI tools for fast prototyping, to compare their trade-offs on complexity, testability, and maintainability. Based on those results, I chose the final architecture: the high-level components and the internal design of each one.

### 4. Defining quality and delivery guardrails

Before writing production code, the quality strategy was defined: acceptance tests, static code analysis, and the standards each increment must meet. On top of that, continuous integration and delivery practices were established, so every increment follows consistent versioning, passes the same quality gates, and can reach the end user quickly. These decisions were collected into brief project guidelines that act as the "constitution" for everything that follows.

### 5. Spec-driven implementation

Implementation followed a spec-driven approach. Each user story was turned into a concrete specification derived from the requirements and the project guidelines. This allows AI coding tools to work within a structured, repeatable workflow instead of ad hoc prompting, which keeps the generated code aligned with the specs, technical standards, and quality controls and prevents drift.

At every stage, I fed feedback back into the process so the output matched my coding style and technical decisions. Each increment ended with a candidate release artifact. Although automated acceptance tests accompanied every increment, I also validated each artifact manually against the requirements.

### 6. The role of AI

AI tools were assistants throughout the project, not decision makers. They accelerated prototyping, research, brainstorming, and feedback, while the architectural, quality, and scope decisions were mine.

## Further Reading

The low-level details behind these decisions are documented separately:

- **Architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Quality assurance:** [`QA.md`](./QA.md)
- **CI/CD:** [`CICD.md`](./CICD.md)
