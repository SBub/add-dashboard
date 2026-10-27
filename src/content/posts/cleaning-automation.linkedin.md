I took one line from a job posting and turned it into a full feature plan before writing any code.

The line: "Cleaning and maintenance automation", from the Product Engineer role at @Base360.ai. I run a guest house, so I know this problem first-hand.

The point isn't the feature. It's treating a feature as an experiment, with every decision written down before anything is built:

→ A decision rule set before the evidence comes in, so the data decides, not my mood after seeing it.
→ One main metric, guardrails, and funnels that show where operators and cleaners get stuck.
→ Instrumentation planned from day one, because a metric you didn't record can't be calculated later.
→ Technical decisions with their trade-offs: an outbox, duplicate-safe event handling, timezones, deadlines, delivery tracking.
→ What breaks at 1,000 and at 100,000 properties, and the signal that says you've got there.

Why do this when AI writes the code?

1. You can review AI-generated code properly, because you already know what correct looks like: a duplicate event must be harmless, and a deadline must survive a daylight saving change.
2. You can ship at scale without guessing: every stage has a signal and a planned change.
3. The plan breaks into tracer bullets, thin slices that work end to end, and each one becomes an issue my AI developer workflow (ADW) builds from plan to pull request.

AI made writing code cheap. Deciding what to build, how to measure it and what "correct" means is now the job.

The full breakdown: https://build.issebya.com/writing/cleaning-automation

#ProductEngineering #ProductManagement #SystemDesign
