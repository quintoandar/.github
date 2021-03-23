---
title: '[Tech Debt] TD Title'
labels: 'tech-debt'

---

<!-- IF you don't have any info, just erase for the template -->

# Tech Debt Title

## Summary

> TL;DR: A simple summary about the tech debt

**Feature related:**

**Age:** { age:legacy | age:new-tech-debt-introduced }

**Present since:** 201X-XX-XX

<!--
  Age labels:

  - LEGACY: found in the codebase and being document right now.

  - NEW_TECH_DEBT_INTRODUCED: we consciously added a new tech debt in our code base right now and we're document it.
-->

**Estimated cost:** { estimatedcost:simple | estimatedcost:complex | estimatedcost:investigation_needed }
<!-- going to transform also in a label -->

<!--
  Estimated cost labels:

  - SIMPLE: It's simple to identify the solution and clearly simple to solve and test.

  - COMPLEX: It's not so simple to understand and fix it. it also may require big refactorings.

  - INVESTIGATION_NEEDED: There's a lot of unknowns related that it's impossible to say until it's prioritized, invetigated and have proposed solutions.
-->

**Type:** { type:documentation | type:coding | type:testing }

### Description :clipboard:

A clear and concise description of what the tech debt is and the reason of being created

### Impact :bomb:

Description of the current or possible impact of this tech debt.

<!-- estimated -->
**Critical in**: { N MONTHS | N YEARS | UNKOWN }

or

**Critical when**

### Solution Hints :shipit:

<!--
Here you should add only hints, context, and opinions
but let the solution proposal in a PR for ADR.
-->

Description of solution hints that you have in mind.

## Observations :thinking:

### Files related or evidences (like: prints)

[files related](files_related_link.file)

Depends on issue X
