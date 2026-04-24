# Cloud Platform & Enterprise Architecture
**AMIS · University of Memphis · April 24, 2026**

---

Welcome to the companion repository for today's talk. Everything shown during the presentation lives here — you can come back to this after class to explore at your own pace.

## What's in this repo

| Folder | What's there |
|---|---|
| 📄 **[docs/](docs/)** | Slides, notes, and reference material from the talk |
| 🖥️ **[demos/](demos/)** | The two web applications built during the demo — Sally's Blog and Sally's Tech Shop |
| ⚙️ **[infrastructure/](infrastructure/)** | The code that deploys those apps to AWS and Azure *(technical)* |

## The story

The demos follow a fictional character — **Sally** — as her web presence grows:

1. **Sally's Blog** — a simple personal blog. Static content, no database, hosted for pennies per month. This represents the simplest possible cloud deployment pattern.

2. **Sally's Tech Shop** — Sally starts selling products online. Now she needs a database, a backend server, and a more thoughtful network design. This is a *multi-tier enterprise architecture* pattern — the kind used by real businesses at scale.

Both apps are deployed on **AWS** and **Azure** so you can see how two different cloud providers solve the same problem.

## Key ideas from the talk

- **Cloud platforms** abstract away physical infrastructure — you describe what you want, the cloud figures out the hardware
- **Enterprise architecture** is about making deliberate decisions: where does the data live, who can access what, what happens when something fails
- **Infrastructure as Code** (the files in `infrastructure/`) means your entire deployment is version-controlled, repeatable, and reviewable — just like application code
- **Multi-cloud** isn't just redundancy — it's a strategic decision with real tradeoffs

---

*Questions after the talk? Open an [issue](../../issues) or reach out directly.*
