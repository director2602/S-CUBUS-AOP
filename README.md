# S-CUBUS — Annual Operating Plan

An interactive Annual Operating Plan and P&L calculator for S-CUBUS Coaching Institute.
Adjust enrollment, fees, and cost percentages on the left and the whole plan —
executive summary, KPIs, budget allocation, P&L statement, staffing & payroll, and
weekly/monthly/quarterly/annual reports — recalculates instantly in the browser.
No backend, no database, no build step: it's a static site.

What's on the page:

- **Executive summary** — a plain-language synopsis (margin health, dominant cost,
  break-even cushion, staffing efficiency) that rewrites itself as you move the sliders.
- **Staffing & payroll** — add employees by hand (role, department, headcount,
  monthly salary) or bulk-upload a roster (Excel or CSV) for a bottom-up cross-check
  against the Teaching/Admin assumptions, with a department-wise cost breakdown.
- **Reports** — Weekly / Monthly / Quarterly / Annual tabs, each with its own chart
  and table, all derived live from the same assumptions.
- **Actual performance** — upload real monthly numbers (CSV) to compare actuals
  against the plan, month by month and year-to-date.

## Run it locally

You need [Node.js](https://nodejs.org) 16 or later. No other dependencies are installed.

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

(You can also just open `index.html` directly in a browser — everything except the
`npm start` convenience server works the same, since this is a plain static site.)

## Deploy it

This is a static site (`index.html`, `style.css`, `app.js`, `assets/logo.png`), so
any static host works. Two ways to put it on Render, matching how your other
S-CUBUS apps are deployed:

### Option A — Render Static Site (recommended, free)

1. Push this folder to a new GitHub repository (e.g. `scubus-annual-operating-plan`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/scubus-annual-operating-plan.git
   git push -u origin main
   ```
2. In the [Render dashboard](https://dashboard.render.com), click **New → Static Site**.
3. Connect the repository you just pushed.
4. Build command: leave blank. Publish directory: `.` (the repo root).
5. Click **Create Static Site**. Render gives you a live URL
   (e.g. `scubus-aop.onrender.com`) and redeploys automatically on every push.

### Option B — Render Web Service (Node)

If you'd rather run it as a small Node service (same pattern as SmartTimetable):

1. Push to GitHub as above.
2. In Render, click **New → Web Service**, connect the repo.
3. Build command: leave blank (nothing to build). Start command: `node server.js`.
4. Render sets the `PORT` environment variable automatically; `server.js` already reads it.

## Uploading actual data

The "Actual performance" section accepts a CSV with these columns:

```
Month,Students,Revenue,TeachingCost,MarketingCost,AdminCost,Rent,OtherOverheads
```

- `Month` must be one of `Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar`
  (the institute's fiscal year).
- Only `Month` and `Revenue` are required — leave any other cell blank if you don't
  track it separately.
- Click **Download CSV template** in the app to get a ready-made file with the
  right headers and month rows to fill in.

Everything is parsed in your browser with plain JavaScript — the file is never
uploaded anywhere, so this works even if the site is offline or run purely locally.

Once uploaded, you'll see actual-vs-plan variance for revenue and EBITDA (both
per month and year-to-date), and a dashed marker on the Monthly/Quarterly report
chart showing where actual revenue landed against the plan.

## Staffing & payroll roster

Add rows by hand with **+ Add employee row**, or bulk-upload a roster (Excel
`.xlsx` or CSV) with these columns:

```
Role,Department,Headcount,MonthlySalaryPerEmployee
```

- `Role` and `MonthlySalaryPerEmployee` are required; `Department` is optional
  (rows are grouped by it, or by Role if left blank, in the "Payroll by department"
  table). `Headcount` defaults to 1 if omitted (i.e. one row per named employee).
- Click **Download template** for a ready-made file.
- Excel parsing uses [SheetJS](https://sheetjs.com), loaded from a public CDN —
  it needs internet access the first time the page loads. Without internet, the
  page still works and falls back to CSV for both the template and uploads.

The roster total is compared against the Teaching + Admin assumption in the P&L
(a note appears under that line), and feeds the Executive Summary's staffing
commentary (revenue per employee, average salary).

## Editing the plan's assumptions

Default assumptions (in `app.js`, top of the file) are placeholders — change the
`DEFAULTS` object there if you want the page to start pre-loaded with your real
numbers instead of the generic ones, e.g.:

```js
var DEFAULTS = {
  students: 600,
  avgFee: 50000,
  ...
};
```

Everyone opening the page can still move the sliders freely from that starting point.
