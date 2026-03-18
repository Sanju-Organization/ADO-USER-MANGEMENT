name: AI Code Agent

on:
  workflow_dispatch:

jobs:
  ai-agent:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout GitHub repo
        uses: actions/checkout@v4

      - name: Clone Azure DevOps repo
        run: |
          git clone https://$(AZURE_PAT)@dev.azure.com/org/project/_git/repo azure-repo
        env:
          AZURE_PAT: ${{ secrets.AZURE_PAT }}

      - name: Run AI Coding Agent
        run: |
          cd azure-repo
          //rest work

GitHub Workflow
      ↓
Pull Azure Repo
      ↓
Run AI agent
      ↓
Generate Tests
      ↓
Push to GitHub



Yes 👍 — you **can leverage the GitHub built-in coding agent** (like **GitHub Copilot** / Copilot coding agent) even if the source code originally lives in **Azure DevOps**.
The key idea is that the **code must exist inside the GitHub repository or workflow workspace**, because the agent only works on code available in **GitHub Actions** or the repo itself.

---

# How to Use GitHub Coding Agent With Azure Repo

## Step 1 — Workflow pulls Azure repository

Your GitHub workflow clones the Azure DevOps repo.

```yaml
name: Sync Azure Repo

on:
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Clone Azure DevOps Repo
        run: |
          git clone https://$(AZURE_PAT)@dev.azure.com/ORG/PROJECT/_git/REPO azure-code
        env:
          AZURE_PAT: ${{ secrets.AZURE_PAT }}
```

Now the runner contains:

```
/workspace
   ├── github-repo
   └── azure-code
```

---

# Step 2 — Let GitHub Coding Agent Work

Now you trigger the coding agent using **Copilot CLI / GitHub agent tools**.

Example:

```yaml
- name: Run GitHub Copilot coding agent
  run: |
    cd azure-code
    gh copilot suggest -t "Generate unit tests for this project"
```

The coding agent will:

* read the repository
* analyze code
* generate fixes / tests
* update files

---

# Step 3 — Commit or Push Changes

You can push changes back to GitHub or Azure.

Example:

```yaml
- name: Commit changes
  run: |
    git config --global user.name "github-actions"
    git config --global user.email "actions@github.com"
    git add .
    git commit -m "AI generated improvements"
```

---

# Important Architecture

```
Azure DevOps Repo
        ↓
GitHub Workflow clones repo
        ↓
GitHub Copilot Coding Agent runs
        ↓
Generate code / tests
        ↓
Commit or PR
```

---

# Enterprise Pattern (Very Powerful)

Many companies run this automation:

```
Azure DevOps
      ↓
GitHub Workflow
      ↓
Copilot Coding Agent
      ↓
Auto PR with fixes
```

This allows you to **use GitHub AI even when the source repo is in Azure DevOps**.

---

✅ If you want, I can also show a **much better setup** used in large teams:

**Auto-sync Azure DevOps → GitHub → Copilot agent → PR back to Azure**

This removes most workflow complexity and makes the coding agent much more powerful. 🚀
