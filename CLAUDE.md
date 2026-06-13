# ns-leads-web — Claude session context

Live lead web app (Airtable-backed). Stage + in-flight work: @NEXT-ACTIONS.md (source of truth).
Shared creds: ../MASTER_CONFIG.md. Airtable: reference fields/tables by ID (`fldXXX`/`tblXXX`), never names.

<!-- AI-OS -->
## AI-OS workspace

Part of the AI-OS workspace at `C:\AI-OS`. **Read `C:\AI-OS\CLAUDE.md` for operating rules + `C:\AI-OS\NEXT-ACTIONS.md` for the work queue.**

- **This app:** ns-leads — GitHub repo `NutraSolutions/ns-leads`, primary branch `main`/`master`.
- **Shared code:** `C:\AI-OS\packages\ns-shared`. **Tools:** `C:\AI-OS\tools`. **Services/modules:** `C:\AI-OS\modules`.
- **Secrets:** never hardcode. Source of truth = `C:\AI-OS\MASTER_CONFIG.md`; run `python C:\AI-OS\sync-env.py local` to regenerate this project's `.env`. Never hand-edit synced env files.
- **Autonomy:** execute from NEXT-ACTIONS without asking for routine work; only stop for owner-decisions, destructive/outward-facing actions, or real blockers.
- **Push silently:** `git -c credential.helper= push https://x-access-token:$TOK@github.com/NutraSolutions/ns-leads.git <ref>`.
