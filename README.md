<a href="https://pdrflp.vercel.app">
  <img src="./assets/header.svg" width="100%" alt="Pedro Felipe — back-end developer. Java &amp; TypeScript, distributed systems, PostgreSQL. Open to internships and junior roles." />
</a>

<p align="center">
  <a href="https://pdrflp.vercel.app"><img src="https://img.shields.io/badge/portfolio-pdrflp.vercel.app-0D1117?style=for-the-badge&labelColor=0D1117&color=FF4FD8" alt="Portfolio" /></a>
  <a href="https://www.linkedin.com/in/pdrflp/"><img src="https://img.shields.io/badge/LinkedIn-0D1117?style=for-the-badge&logo=linkedin&logoColor=6E9EAD" alt="LinkedIn" /></a>
  <a href="mailto:pedrofelipewk@gmail.com"><img src="https://img.shields.io/badge/Email-0D1117?style=for-the-badge&logo=gmail&logoColor=B8755E" alt="Email" /></a>
  <a href="https://pdrflp.vercel.app/cv/pedro-felipe-en.pdf"><img src="https://img.shields.io/badge/R%C3%A9sum%C3%A9-EN-0D1117?style=for-the-badge&labelColor=0D1117&color=232C37" alt="Résumé (EN)" /></a>
  <a href="https://pdrflp.vercel.app/cv/pedro-felipe-pt.pdf"><img src="https://img.shields.io/badge/Curr%C3%ADculo-PT-0D1117?style=for-the-badge&labelColor=0D1117&color=232C37" alt="Currículo (PT)" /></a>
</p>

## `> whoami`

Back-end developer from Fortaleza, Brazil, studying Computer Science at **UNIFOR** (5th semester, graduating 2028).

I build services that stay correct when the network drops, a message arrives twice, and two requests race for the same balance. **Java and Spring Boot** by trade, **TypeScript and NestJS** by curiosity, **PostgreSQL** as the referee.

Since I was a kid, playing on the PC, I went after what the game wasn't meant to show — getting out of the map, the wrong texture in a corner nobody looks at. Back-end is the same hunt, just with logs.

```text
experience   2024 · Eletra Energy Solutions — software development fellow
status       open to internships and junior back-end roles
where        on-site / hybrid in Fortaleza · remote anywhere
```

## `> ls ./projects --sort=impact`

<sub>Ranked by technical weight and difficulty. Each card is a service: status, real metrics and the events it actually handles.</sub>

<a href="https://github.com/pdrflp0/residuo"><img src="./assets/card-residuo.svg" width="100%" alt="Resíduo — a lab that reproduces how deleted records come back, with evidence. TypeScript, NestJS, React, PostgreSQL, Playwright." /></a>
<a href="https://github.com/pdrflp0/jungle-gaming-backend-challenge"><img src="./assets/card-wagering.svg" width="100%" alt="Distributed Wagering Processor — idempotency, pessimistic locking and event-driven architecture. NestJS, Bun, PostgreSQL, AWS SQS. 297 tests." /></a>

<a href="https://github.com/pdrflp0/portfolio"><img src="./assets/card-portfolio.svg" width="49%" alt="Portfolio — Next.js, TypeScript, GSAP." /></a>
<a href="https://github.com/pdrflp0/integration_project_backend"><img src="./assets/card-eletra.svg" width="49%" alt="Energy Meter Catalog — Spring Boot REST API and JavaFX client, built at Eletra Energy Solutions." /></a>
<a href="https://github.com/pdrflp0/Minha-Cidade-Minha-Rua"><img src="./assets/card-minha-cidade.svg" width="49%" alt="Minha Cidade, Minha Rua — React Native, Expo, Firebase." /></a>
<a href="https://github.com/pdrflp0/commerceops-api"><img src="./assets/card-commerceops.svg" width="49%" alt="CommerceOps API — Java 21, Spring Boot 4, in progress." /></a>

<a href="https://github.com/pdrflp0/EmailUniTreino"><img src="./assets/card-unitreino.svg" width="32.5%" alt="Email service for UNI-Treino — Node.js, Express." /></a>
<a href="https://github.com/pdrflp0/shape-2026"><img src="./assets/card-shape.svg" width="32.5%" alt="Shape 2026 — offline training PWA." /></a>
<a href="https://github.com/pdrflp0/space-invaders"><img src="./assets/card-invaders.svg" width="32.5%" alt="Space Invaders — Godot, GDScript." /></a>

## `> tail ~/bug-journal`

Short post-mortems of bugs I reproduced, fixed or hunted down:

- [**The deleted record that came back**](https://pdrflp.vercel.app/en/bugs/resurrection) — a late offline edit, an innocent upsert, and how to prove it.
- [**Two bets of 80 on a balance of 100**](https://pdrflp.vercel.app/en/bugs/double-spend) — check-then-act, `SELECT … FOR UPDATE` and the database as referee.
- [**The refund that arrived before the bet**](https://pdrflp.vercel.app/en/bugs/out-of-order) — out-of-order messages, the Outbox pattern and a test that kills the process.
- [**The test that passed without the lock**](https://pdrflp.vercel.app/en/bugs/the-test-that-lied) — testing the tests by breaking the code on purpose.

## `> cat stack.yml`

<img src="./assets/stack.svg" width="100%" alt="Stack — Java, TypeScript, SQL; Spring Boot, JPA/Hibernate, NestJS, Node.js, Bun, MikroORM; PostgreSQL, Firebase; idempotency, pessimistic locking, Outbox/Inbox, AWS SQS, DDD; JUnit, Mockito, Vitest, Playwright; Docker, GitHub Actions, Maven, Git/GitFlow, Vercel; React, Next.js, React Native, GSAP." />

<a href="https://pdrflp.vercel.app"><img src="./assets/footer.svg" width="100%" alt="Something on pdrflp.vercel.app isn't rendering right." /></a>
