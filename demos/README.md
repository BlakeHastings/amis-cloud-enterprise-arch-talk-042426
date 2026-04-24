# Demos

Two versions of "Sally's" fictional web presence — the same person, two different business needs, two different infrastructure footprints.

| Demo | What it is | Cloud hosting |
|---|---|---|
| **[blog/](blog/)** | A personal blog — static content, no database | AWS: S3 + CloudFront · Azure: Storage static website |
| **[ecommerce/](ecommerce/)** | An online shop with a product catalog and orders | AWS: EC2 + RDS · Azure: VM + MySQL |

The blog shows the simplest possible cloud deployment. The shop shows a multi-tier enterprise pattern: a web server, an application layer, and a database — each in its own network segment.

---

> **Technical setup:** see [../infrastructure/](../infrastructure/) for the Terraform that provisions these on AWS and Azure.
