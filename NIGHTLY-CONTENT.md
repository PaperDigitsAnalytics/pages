# Nightly content pipeline

Doel: automatisch nieuwe artikelen maken, reviewen, publiceren en deployen met zo min mogelijk tokens.

## Hoe het werkt

De pipeline draait vanuit `scripts/nightly-content-pipeline.js` en gebruikt:
- `content-topics.json` als queue
- `artikel-ideeen.txt` als goedkope bron voor nieuwe onderwerpen
- `prompts/nightly-article-style-pack.md` als compacte stijlbron
- de bestaande content-machine voor scaffold/review/approve/publish
- optioneel automatische deploy

Voor het schrijven kijkt de job eerst of er genoeg onderwerpen in de queue staan. Zo niet, dan draait hij `scripts/auto-topic-generator.js` en zet hij automatisch nieuwe topics uit `artikel-ideeen.txt` om naar `idea`-items in `content-topics.json`.

Daarna worden alle queued topics opnieuw gescoord op:
- overlap met bestaande topics en live content
- commercieel potentieel
- cluster-prioriteit
- clusterverzadiging

Zo kiest de nachtjob niet het eerste onderwerp, maar het beste beschikbare onderwerp met zo min mogelijk duplicatierisico.

Daarnaast is er nu een harde duplicate-cleanup: onderwerpen met te hoge overlap krijgen automatisch de status `rejected_duplicate`.

Voor drafts draait nu ook een extra quality gate vóór review/approve. Die blokkeert op typische agency- of AI-achtige formuleringen, te veel lange zinnen, verkeerde h2-structuur en een te promotionele PaperDigits-vermelding.

## Waarom dit minder tokens kost

- korte lokale stijlpack in plaats van lange chatcontext
- vaste JSON-output van het model
- automatisch visueel element in code, niet in modeltokens
- bestaande validators doen de meeste kwaliteitscontrole lokaal
- geen heen-en-weer chat per artikel

## Config

Zie `nightly-content.config.json`.

Belangrijkste velden:
- `provider`: `gemini` of `claude`
- `fallbackProvider`: fallback als de eerste provider faalt
- `maxArticlesPerRun`: nu nog op 1 gezet voor veiligheid
- `autoDeploy`: publiceer en deploy direct
- `scheduledTime`: tijd voor Windows Task Scheduler

## Handige commands

```bash
npm run topics:auto
npm run topics:score
npm run topics:dedupe
npm run nightly:run
npm run nightly:install-task
```

## Queue-gedrag

De job pakt de eerste topic met status `idea` of `scaffolded`.
Als nodig maakt hij eerst automatisch een scaffold aan.
Daarna:
1. draft genereren
2. status -> `draft`
3. review
4. approve
5. publish
6. deploy
7. status -> `live`

## Let op

- De pipeline is bewust compact gehouden om tokens te besparen.
- Kwaliteitscontrole zit vooral in de bestaande content-machine en niet in extra AI-rondes.
- Als je kwaliteit verder wilt verhogen zonder veel extra tokens, voeg dan lokale lintregels toe in `scripts/content-machine.js` in plaats van langere prompts.
