(function () {
  'use strict';

  var DEFAULTS = {
    students: 600,
    avgFee: 50000,
    growthRate: 15,
    teachingPct: 38,
    marketingPct: 8,
    adminPct: 12,
    rentMonthly: 150000,
    otherFixedMonthly: 50000,
    taxRate: 25
  };

  var state = Object.assign({}, DEFAULTS);

  var inputs = {
    students: document.getElementById('in-students'),
    avgFee: document.getElementById('in-fee'),
    growthRate: document.getElementById('in-growth'),
    teachingPct: document.getElementById('in-teaching'),
    marketingPct: document.getElementById('in-marketing'),
    adminPct: document.getElementById('in-admin'),
    rentMonthly: document.getElementById('in-rent'),
    otherFixedMonthly: document.getElementById('in-other'),
    taxRate: document.getElementById('in-tax')
  };

  function inr(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
  }

  function pct1(n) {
    return (Math.round(n * 10) / 10) + '%';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function compute() {
    var s = state;

    var revenue = s.students * s.avgFee;
    var teaching = revenue * s.teachingPct / 100;
    var marketing = revenue * s.marketingPct / 100;
    var admin = revenue * s.adminPct / 100;
    var rent = s.rentMonthly * 12;
    var other = s.otherFixedMonthly * 12;

    var grossProfit = revenue - teaching;
    var grossMarginPct = revenue ? (grossProfit / revenue * 100) : 0;

    var totalOpex = marketing + admin + rent + other;
    var ebitda = grossProfit - totalOpex;
    var ebitdaMarginPct = revenue ? (ebitda / revenue * 100) : 0;

    var tax = Math.max(0, ebitda) * s.taxRate / 100;
    var netProfit = ebitda - tax;
    var netMarginPct = revenue ? (netProfit / revenue * 100) : 0;

    var variablePctTotal = s.teachingPct + s.marketingPct + s.adminPct;
    var contribPerStudent = s.avgFee * (1 - variablePctTotal / 100);
    var fixedTotal = rent + other;
    var breakEven = contribPerStudent > 0 ? Math.ceil(fixedTotal / contribPerStudent) : null;

    var prevYearRevenue = revenue / (1 + s.growthRate / 100);

    var revForPct = revenue || 1;
    var segRaw = [
      ['Teaching & academic', teaching, 'var(--series-1)'],
      ['Marketing & admissions', marketing, 'var(--series-2)'],
      ['Admin, ops & support', admin, 'var(--series-3)'],
      ['Rent & infrastructure', rent, 'var(--series-4)'],
      ['Other fixed overheads', other, 'var(--series-5)'],
      ['Income tax', tax, 'var(--series-tax)'],
      ['Net profit', Math.max(netProfit, 0), 'var(--series-6)']
    ];
    var segments = segRaw.map(function (row) {
      var label = row[0], value = row[1], color = row[2];
      var pctNum = Math.round((value / revForPct) * 1000) / 10;
      return {
        label: label,
        color: color,
        pctWidth: pctNum + '%',
        summary: pct1(pctNum) + ' · ' + inr(value)
      };
    });

    var weights = [0.14, 0.12, 0.10, 0.07, 0.06, 0.06, 0.07, 0.07, 0.06, 0.08, 0.06, 0.11];
    var monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    var maxRevMonth = Math.max.apply(null, weights) * revenue;
    var maxBarPx = 160;

    var months = weights.map(function (w, i) {
      var rev = revenue * w;
      var teachM = rev * s.teachingPct / 100;
      var mktM = rev * s.marketingPct / 100;
      var fixedM = (rent / 12) + (other / 12) + (admin / 12);
      var cost = teachM + mktM + fixedM;
      var ebitdaM = rev - cost;
      var barPx = maxRevMonth ? (rev / maxRevMonth) * maxBarPx : 0;
      var costPx = rev > 0 ? Math.max(0, Math.min(barPx, (cost / rev) * barPx)) : barPx;
      var profitPx = Math.max(0, barPx - costPx);
      return {
        name: monthNames[i],
        revenue: rev,
        cost: cost,
        ebitda: ebitdaM,
        barPx: Math.round(barPx),
        costPx: Math.round(costPx),
        profitPx: Math.round(profitPx),
        tooltip: monthNames[i] + ': revenue ' + inr(rev) + ', costs ' + inr(cost) + ', EBITDA ' + inr(ebitdaM)
      };
    });

    var pxPerRevenue = maxRevMonth ? (maxBarPx / maxRevMonth) : 0;

    return {
      revenue: revenue, teaching: teaching, marketing: marketing, admin: admin, rent: rent, other: other,
      grossProfit: grossProfit, grossMarginPct: grossMarginPct,
      totalOpex: totalOpex, ebitda: ebitda, ebitdaMarginPct: ebitdaMarginPct,
      tax: tax, netProfit: netProfit, netMarginPct: netMarginPct,
      breakEven: breakEven, prevYearRevenue: prevYearRevenue,
      segments: segments, months: months, pxPerRevenue: pxPerRevenue
    };
  }

  function renderAllocation(segments) {
    var bar = document.getElementById('alloc-bar');
    var legend = document.getElementById('alloc-legend');
    bar.innerHTML = '';
    legend.innerHTML = '';

    segments.forEach(function (seg) {
      var segEl = document.createElement('div');
      segEl.className = 'alloc-seg';
      segEl.style.width = seg.pctWidth;
      segEl.style.background = seg.color;
      bar.appendChild(segEl);

      var item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML =
        '<span class="legend-swatch" style="background:' + seg.color + ';"></span>' +
        '<div><div class="legend-label">' + seg.label + '</div>' +
        '<div class="legend-value">' + seg.summary + '</div></div>';
      legend.appendChild(item);
    });
  }

  var QUARTER_DEFS = [
    { key: 'q1', name: 'Q1 (Apr–Jun)', idx: [0, 1, 2] },
    { key: 'q2', name: 'Q2 (Jul–Sep)', idx: [3, 4, 5] },
    { key: 'q3', name: 'Q3 (Oct–Dec)', idx: [6, 7, 8] },
    { key: 'q4', name: 'Q4 (Jan–Mar)', idx: [9, 10, 11] }
  ];

  function getMonthlyRows(r) {
    return r.months.map(function (m, i) {
      var a = actuals && actuals.filter(function (x) { return x.monthIndex === i; })[0];
      return {
        name: m.name,
        revenue: m.revenue,
        cost: m.cost,
        ebitda: m.ebitda,
        actualRevenue: a ? a.revenue : null,
        actualEbitda: a ? a.ebitda : null
      };
    });
  }

  function getQuarterlyRows(r) {
    return QUARTER_DEFS.map(function (q) {
      var revenue = 0, cost = 0, ebitda = 0, actualRevenue = null, actualEbitda = null, actualCount = 0;
      q.idx.forEach(function (i) {
        revenue += r.months[i].revenue;
        cost += r.months[i].cost;
        ebitda += r.months[i].ebitda;
        var a = actuals && actuals.filter(function (x) { return x.monthIndex === i; })[0];
        if (a) {
          actualCount++;
          actualRevenue = (actualRevenue || 0) + a.revenue;
          actualEbitda = (actualEbitda || 0) + a.ebitda;
        }
      });
      return {
        name: q.name,
        revenue: revenue, cost: cost, ebitda: ebitda,
        actualRevenue: actualRevenue, actualEbitda: actualEbitda,
        partial: actualCount > 0 && actualCount < q.idx.length
      };
    });
  }

  function getWeeklyRows(r) {
    var weeksTotal = 52;
    var weights = r.months.map(function (m) { return r.revenue ? m.revenue / r.revenue : 0; });
    var raw = weights.map(function (w) { return w * weeksTotal; });
    var weeksPerMonth = raw.map(Math.floor);
    var used = weeksPerMonth.reduce(function (a, b) { return a + b; }, 0);
    var remainder = weeksTotal - used;
    var order = raw.map(function (w, i) { return { i: i, frac: w - Math.floor(w) }; })
      .sort(function (a, b) { return b.frac - a.frac; });
    for (var k = 0; k < remainder; k++) { weeksPerMonth[order[k % order.length].i]++; }

    var rows = [];
    r.months.forEach(function (m, i) {
      var n = weeksPerMonth[i] || 0;
      for (var w = 1; w <= n; w++) {
        rows.push({
          name: m.name + ' W' + w,
          revenue: n ? m.revenue / n : 0,
          cost: n ? m.cost / n : 0,
          ebitda: n ? m.ebitda / n : 0,
          actualRevenue: null,
          actualEbitda: null
        });
      }
    });
    return rows;
  }

  function renderBars(rows, chartEl, labelsEl, opts) {
    opts = opts || {};
    chartEl.innerHTML = '';
    labelsEl.innerHTML = '';
    chartEl.className = 'chart' + (opts.thin ? ' thin' : '');

    var maxBarPx = 160;
    var maxRev = Math.max.apply(null, rows.map(function (row) { return row.revenue; }).concat([0]));
    var maxActual = Math.max.apply(null, rows.map(function (row) { return row.actualRevenue || 0; }).concat([0]));
    var scaleBase = Math.max(maxRev, maxActual) || 1;
    var pxPerRevenue = maxBarPx / scaleBase;

    rows.forEach(function (row) {
      var col = document.createElement('div');
      col.className = 'chart-col';
      col.title = row.name + ': revenue ' + inr(row.revenue) + ', costs ' + inr(row.cost) + ', EBITDA ' + inr(row.ebitda) +
        (row.actualRevenue != null ? ', actual revenue ' + inr(row.actualRevenue) : '');

      var barPx = row.revenue * pxPerRevenue;
      var costPx = row.revenue > 0 ? Math.max(0, Math.min(barPx, (row.cost / row.revenue) * barPx)) : barPx;
      var profitPx = Math.max(0, barPx - costPx);

      var bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = Math.round(barPx) + 'px';

      var costEl = document.createElement('div');
      costEl.className = 'chart-cost';
      costEl.style.height = Math.round(costPx) + 'px';

      var profitEl = document.createElement('div');
      profitEl.className = 'chart-profit';
      profitEl.style.height = Math.round(profitPx) + 'px';

      bar.appendChild(costEl);
      bar.appendChild(profitEl);

      if (row.actualRevenue != null) {
        var markerPx = Math.max(0, Math.min(maxBarPx, row.actualRevenue * pxPerRevenue));
        var marker = document.createElement('div');
        marker.className = 'actual-marker';
        marker.style.bottom = Math.round(markerPx) + 'px';
        col.appendChild(marker);
      }

      col.appendChild(bar);
      chartEl.appendChild(col);

      if (!opts.hideLabels) {
        var label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = row.name;
        labelsEl.appendChild(label);
      }
    });

    labelsEl.style.display = opts.hideLabels ? 'none' : 'flex';
  }

  function renderReportTable(rows, theadEl, tbodyEl, showActuals) {
    var cols = ['Period', 'Revenue', 'Cost', 'EBITDA', 'Margin'];
    if (showActuals) cols = cols.concat(['Actual revenue', 'Revenue variance']);
    theadEl.innerHTML = '<tr>' + cols.map(function (c, i) {
      return '<th' + (i === 0 ? ' style="text-align:left;"' : '') + '>' + c + '</th>';
    }).join('') + '</tr>';

    tbodyEl.innerHTML = '';
    rows.forEach(function (row) {
      var marginPct = row.revenue ? (row.ebitda / row.revenue * 100) : 0;
      var cells = [
        '<td style="text-align:left;">' + row.name + '</td>',
        '<td>' + inr(row.revenue) + '</td>',
        '<td>' + inr(row.cost) + '</td>',
        '<td>' + inr(row.ebitda) + '</td>',
        '<td>' + pct1(marginPct) + '</td>'
      ];
      if (showActuals) {
        if (row.actualRevenue != null) {
          var v = variance(row.actualRevenue, row.revenue);
          cells.push('<td>' + inr(row.actualRevenue) + '</td>');
          cells.push('<td class="' + (v >= 0 ? 'variance-pos' : 'variance-neg') + '">' + varianceLabel(v) + '</td>');
        } else {
          cells.push('<td class="row-line">—</td>', '<td class="row-line">—</td>');
        }
      }
      var tr = document.createElement('tr');
      tr.className = 'row-plain';
      tr.innerHTML = cells.join('');
      tbodyEl.appendChild(tr);
    });
  }

  var currentPeriod = 'monthly';
  var REPORT_NOTES = {
    weekly: 'Weekly figures split each month’s plan evenly across its weeks (no separate weekly seasonality assumption). Actuals are uploaded monthly, so no comparison is shown here — switch to Monthly or Quarterly for that.',
    monthly: 'Shaped by the institute’s admission-season seasonality, not a straight-line split.',
    quarterly: 'Quarters follow the institute’s fiscal year (Q1 = Apr–Jun).',
    annual: ''
  };

  function renderReport(r) {
    var chartEl = document.getElementById('report-chart');
    var labelsEl = document.getElementById('report-labels');
    var legendEl = document.getElementById('report-legend');
    var legendActual = document.getElementById('report-legend-actual');
    var tableWrap = document.getElementById('report-table-wrap');
    var annualSummary = document.getElementById('report-annual-summary');
    var theadEl = document.getElementById('report-table-head');
    var tbodyEl = document.getElementById('report-table-body');
    var noteEl = document.getElementById('report-note');

    noteEl.textContent = REPORT_NOTES[currentPeriod] || '';

    if (currentPeriod === 'annual') {
      chartEl.style.display = 'none';
      labelsEl.style.display = 'none';
      legendEl.style.display = 'none';
      tableWrap.style.display = 'none';
      annualSummary.style.display = 'grid';
      annualSummary.innerHTML =
        '<div class="kpi"><div class="kpi-label">Annual revenue</div><div class="kpi-value">' + inr(r.revenue) + '</div></div>' +
        '<div class="kpi"><div class="kpi-label">Total costs</div><div class="kpi-value">' + inr(r.revenue - r.ebitda) + '</div></div>' +
        '<div class="kpi"><div class="kpi-label">EBITDA</div><div class="kpi-value">' + inr(r.ebitda) + '</div><div class="kpi-note">' + pct1(r.ebitdaMarginPct) + ' margin</div></div>' +
        '<div class="kpi highlight"><div class="kpi-label">Net profit</div><div class="kpi-value">' + inr(r.netProfit) + '</div><div class="kpi-note">' + pct1(r.netMarginPct) + ' margin</div></div>';
      return;
    }

    annualSummary.style.display = 'none';
    chartEl.style.display = 'flex';
    legendEl.style.display = 'flex';
    tableWrap.style.display = 'block';

    var rows, showActuals, thin, hideLabels;
    if (currentPeriod === 'weekly') {
      rows = getWeeklyRows(r);
      showActuals = false;
      thin = true;
      hideLabels = true;
    } else if (currentPeriod === 'quarterly') {
      rows = getQuarterlyRows(r);
      showActuals = !!(actuals && actuals.length);
      thin = false;
      hideLabels = false;
    } else {
      rows = getMonthlyRows(r);
      showActuals = !!(actuals && actuals.length);
      thin = false;
      hideLabels = false;
    }

    legendActual.style.display = showActuals ? 'flex' : 'none';
    labelsEl.style.display = hideLabels ? 'none' : 'flex';

    renderBars(rows, chartEl, labelsEl, { thin: thin, hideLabels: hideLabels });
    renderReportTable(rows, theadEl, tbodyEl, showActuals);
  }

  document.getElementById('report-tabs').addEventListener('click', function (e) {
    var btn = e.target.closest('.report-tab');
    if (!btn) return;
    currentPeriod = btn.getAttribute('data-period');
    Array.prototype.forEach.call(document.querySelectorAll('.report-tab'), function (b) {
      b.classList.toggle('active', b === btn);
    });
    render();
  });

  var MONTH_NAMES = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  var actuals = null; // array of {monthIndex, name, students, revenue, cost, ebitda} once uploaded

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function parseActualsCSV(text) {
    var lines = text.split(/\r\n|\n|\r/).filter(function (l) { return l.trim().length > 0; });
    if (lines.length < 2) {
      return { rows: [], errors: ['The file has a header but no data rows.'] };
    }
    var header = lines[0].split(',').map(function (h) { return h.trim().toLowerCase(); });
    var idx = {
      month: header.indexOf('month'),
      students: header.indexOf('students'),
      revenue: header.indexOf('revenue'),
      teaching: header.indexOf('teachingcost'),
      marketing: header.indexOf('marketingcost'),
      admin: header.indexOf('admincost'),
      rent: header.indexOf('rent'),
      other: header.indexOf('otheroverheads')
    };
    if (idx.month === -1 || idx.revenue === -1) {
      return { rows: [], errors: ['The CSV needs at least a "Month" and a "Revenue" column.'] };
    }
    var monthKeys = MONTH_NAMES.map(function (m) { return m.toLowerCase(); });
    var rows = [];
    var errors = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].split(',').map(function (c) { return c.trim(); });
      var monthRaw = (cols[idx.month] || '').toLowerCase().slice(0, 3);
      var mi = monthKeys.indexOf(monthRaw);
      if (mi === -1) {
        errors.push('Row ' + (i + 1) + ': "' + (cols[idx.month] || '') + '" is not a recognized month (use Apr, May, ... Mar).');
        continue;
      }
      var revenue = num(cols[idx.revenue]);
      var teaching = idx.teaching > -1 ? num(cols[idx.teaching]) : 0;
      var marketing = idx.marketing > -1 ? num(cols[idx.marketing]) : 0;
      var admin = idx.admin > -1 ? num(cols[idx.admin]) : 0;
      var rent = idx.rent > -1 ? num(cols[idx.rent]) : 0;
      var other = idx.other > -1 ? num(cols[idx.other]) : 0;
      var cost = teaching + marketing + admin + rent + other;
      rows.push({
        monthIndex: mi,
        name: MONTH_NAMES[mi],
        students: idx.students > -1 ? num(cols[idx.students]) : null,
        revenue: revenue,
        cost: cost,
        ebitda: revenue - cost
      });
    }
    rows.sort(function (a, b) { return a.monthIndex - b.monthIndex; });
    return { rows: rows, errors: errors };
  }

  function downloadTemplate() {
    var header = 'Month,Students,Revenue,TeachingCost,MarketingCost,AdminCost,Rent,OtherOverheads';
    var lines = MONTH_NAMES.map(function (m) { return m + ',,,,,,,'; });
    var csv = [header].concat(lines).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'scubus-actuals-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function variance(actual, plan) {
    if (!plan) return null;
    return (actual - plan) / Math.abs(plan) * 100;
  }

  function varianceLabel(v) {
    if (v == null) return '—';
    return (v >= 0 ? '+' : '') + pct1(v);
  }

  function renderActuals(planMonths) {
    var summaryEl = document.getElementById('actuals-summary');
    var tableWrap = document.getElementById('actuals-table-wrap');
    var tbody = document.getElementById('actuals-tbody');
    var clearBtn = document.getElementById('clear-actuals');

    if (!actuals || !actuals.length) {
      summaryEl.style.display = 'none';
      tableWrap.style.display = 'none';
      clearBtn.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'inline';

    var planRevSum = 0, actualRevSum = 0, planEbitdaSum = 0, actualEbitdaSum = 0;
    tbody.innerHTML = '';

    actuals.forEach(function (a) {
      var plan = planMonths[a.monthIndex];
      planRevSum += plan.revenue;
      actualRevSum += a.revenue;
      planEbitdaSum += plan.ebitda;
      actualEbitdaSum += a.ebitda;

      var revVar = variance(a.revenue, plan.revenue);
      var ebitdaVar = variance(a.ebitda, plan.ebitda);

      var tr = document.createElement('tr');
      tr.className = 'row-plain';
      tr.innerHTML =
        '<td style="text-align:left;">' + a.name + '</td>' +
        '<td>' + inr(plan.revenue) + '</td>' +
        '<td>' + inr(a.revenue) + '</td>' +
        '<td class="' + (revVar >= 0 ? 'variance-pos' : 'variance-neg') + '">' + varianceLabel(revVar) + '</td>' +
        '<td>' + inr(plan.ebitda) + '</td>' +
        '<td>' + inr(a.ebitda) + '</td>' +
        '<td class="' + (ebitdaVar >= 0 ? 'variance-pos' : 'variance-neg') + '">' + varianceLabel(ebitdaVar) + '</td>';
      tbody.appendChild(tr);
    });

    var revVarTotal = variance(actualRevSum, planRevSum);
    var ebitdaVarTotal = variance(actualEbitdaSum, planEbitdaSum);

    summaryEl.innerHTML =
      '<div class="kpi"><div class="kpi-label">Months uploaded</div><div class="kpi-value">' + actuals.length + '</div><div class="kpi-note">of 12</div></div>' +
      '<div class="kpi"><div class="kpi-label">Actual revenue (YTD)</div><div class="kpi-value">' + inr(actualRevSum) + '</div><div class="kpi-note ' + (revVarTotal >= 0 ? 'variance-pos' : 'variance-neg') + '">' + varianceLabel(revVarTotal) + ' vs plan</div></div>' +
      '<div class="kpi"><div class="kpi-label">Actual EBITDA (YTD)</div><div class="kpi-value">' + inr(actualEbitdaSum) + '</div><div class="kpi-note ' + (ebitdaVarTotal >= 0 ? 'variance-pos' : 'variance-neg') + '">' + varianceLabel(ebitdaVarTotal) + ' vs plan</div></div>';

    summaryEl.style.display = 'grid';
    summaryEl.style.gridTemplateColumns = 'repeat(3, 1fr)';
    tableWrap.style.display = 'block';
  }

  document.getElementById('actuals-file').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    var status = document.getElementById('upload-status');
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
      var parsed = parseActualsCSV(String(evt.target.result));
      if (!parsed.rows.length) {
        status.textContent = parsed.errors.length ? parsed.errors[0] : 'Could not read any rows from that file.';
        status.className = 'upload-status err';
        return;
      }
      actuals = parsed.rows;
      status.className = 'upload-status ok';
      status.textContent = 'Loaded ' + parsed.rows.length + ' month' + (parsed.rows.length === 1 ? '' : 's') + ' of actuals' + (parsed.errors.length ? ' (' + parsed.errors.length + ' row(s) skipped)' : '') + '.';
      render();
    };
    reader.onerror = function () {
      status.className = 'upload-status err';
      status.textContent = 'Could not read that file.';
    };
    reader.readAsText(file);
  });

  document.getElementById('download-template').addEventListener('click', downloadTemplate);

  document.getElementById('clear-actuals').addEventListener('click', function () {
    actuals = null;
    document.getElementById('actuals-file').value = '';
    document.getElementById('upload-status').textContent = '';
    document.getElementById('upload-status').className = 'upload-status';
    render();
  });

  // ---- Staffing & payroll ----

  var employeeIdCounter = 1;
  var employees = []; // {id, role, department, headcount, monthlySalary}

  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function addEmployeeRow(prefill) {
    var row = Object.assign({ id: employeeIdCounter++, role: '', department: '', headcount: 1, monthlySalary: 0 }, prefill || {});
    employees.push(row);
    return row;
  }

  function renderRosterTable() {
    var tbody = document.getElementById('roster-tbody');
    tbody.innerHTML = '';
    employees.forEach(function (emp) {
      var tr = document.createElement('tr');
      tr.className = 'row-plain';
      tr.innerHTML =
        '<td><input type="text" data-field="role" placeholder="e.g. Physics Teacher" value="' + escapeAttr(emp.role) + '"></td>' +
        '<td><input type="text" data-field="department" placeholder="e.g. Teaching" value="' + escapeAttr(emp.department) + '"></td>' +
        '<td><input type="number" data-field="headcount" min="0" step="1" value="' + emp.headcount + '"></td>' +
        '<td><input type="number" data-field="monthlySalary" min="0" step="500" value="' + emp.monthlySalary + '"></td>' +
        '<td class="roster-annual">' + inr((emp.headcount || 0) * (emp.monthlySalary || 0) * 12) + '</td>' +
        '<td><button type="button" class="roster-remove-btn" title="Remove row">✕</button></td>';

      Array.prototype.forEach.call(tr.querySelectorAll('input'), function (inp) {
        inp.addEventListener('input', function () {
          var field = inp.getAttribute('data-field');
          if (field === 'role' || field === 'department') {
            emp[field] = inp.value;
          } else {
            emp[field] = Math.max(0, parseFloat(inp.value) || 0);
          }
          tr.querySelector('.roster-annual').textContent = inr((emp.headcount || 0) * (emp.monthlySalary || 0) * 12);
          render();
        });
      });

      tr.querySelector('.roster-remove-btn').addEventListener('click', function () {
        employees = employees.filter(function (e2) { return e2.id !== emp.id; });
        renderRosterTable();
        render();
      });

      tbody.appendChild(tr);
    });
  }

  function computePayroll(revenue) {
    var valid = employees.filter(function (e) { return (e.headcount || 0) > 0; });
    var totalHeadcount = 0, totalAnnual = 0;
    var byDeptMap = {};
    valid.forEach(function (e) {
      var hc = e.headcount || 0;
      var sal = e.monthlySalary || 0;
      var annual = hc * sal * 12;
      totalHeadcount += hc;
      totalAnnual += annual;
      var dept = (e.department && e.department.trim()) || (e.role && e.role.trim()) || 'Unspecified';
      if (!byDeptMap[dept]) byDeptMap[dept] = { department: dept, headcount: 0, annual: 0 };
      byDeptMap[dept].headcount += hc;
      byDeptMap[dept].annual += annual;
    });
    var byDept = Object.keys(byDeptMap).map(function (k) {
      var d = byDeptMap[k];
      return {
        department: d.department,
        headcount: d.headcount,
        avgMonthly: d.headcount ? (d.annual / d.headcount / 12) : 0,
        annual: d.annual,
        pctOfPayroll: totalAnnual ? (d.annual / totalAnnual * 100) : 0
      };
    }).sort(function (a, b) { return b.annual - a.annual; });

    return {
      headcount: totalHeadcount,
      totalAnnual: totalAnnual,
      avgMonthly: totalHeadcount ? (totalAnnual / totalHeadcount / 12) : 0,
      byDept: byDept,
      pctOfRevenue: revenue ? (totalAnnual / revenue * 100) : 0,
      revenuePerEmployee: totalHeadcount ? (revenue / totalHeadcount) : null
    };
  }

  function setPLNote(payroll, r) {
    var row = document.getElementById('pl-teaching-note-row');
    var cell = document.getElementById('pl-teaching-note');
    if (!payroll || !payroll.headcount) { row.style.display = 'none'; return; }
    var combinedPlan = r.teaching + r.admin;
    var v = variance(payroll.totalAnnual, combinedPlan);
    var rel = Math.abs(v) < 8 ? 'closely matches' : (v > 0 ? 'runs higher than' : 'runs lower than');
    cell.textContent = 'Cross-check: your ' + payroll.headcount + '-employee roster totals ' + inr(payroll.totalAnnual) +
      '/year, which ' + rel + ' the ' + inr(combinedPlan) + ' assumed above for Teaching + Admin combined (' + varianceLabel(v) + ').';
    row.style.display = 'table-row';
  }

  function renderPayroll(r) {
    var payroll = computePayroll(r.revenue);
    var summaryEl = document.getElementById('payroll-summary');
    var breakdownWrap = document.getElementById('payroll-breakdown-wrap');
    var breakdownBody = document.getElementById('payroll-breakdown-tbody');
    var clearBtn = document.getElementById('clear-roster');

    clearBtn.style.display = employees.length ? 'inline' : 'none';

    if (!payroll.headcount) {
      summaryEl.style.display = 'none';
      breakdownWrap.style.display = 'none';
      setPLNote(null, r);
      return payroll;
    }

    summaryEl.style.display = 'grid';
    summaryEl.className = 'kpis payroll-summary';
    summaryEl.innerHTML =
      '<div class="kpi"><div class="kpi-label">Total headcount</div><div class="kpi-value">' + payroll.headcount + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">Annual payroll</div><div class="kpi-value">' + inr(payroll.totalAnnual) + '</div><div class="kpi-note">' + pct1(payroll.pctOfRevenue) + ' of revenue</div></div>' +
      '<div class="kpi"><div class="kpi-label">Avg. salary / employee</div><div class="kpi-value">' + inr(payroll.avgMonthly) + '</div><div class="kpi-note">per month</div></div>' +
      '<div class="kpi"><div class="kpi-label">Revenue / employee</div><div class="kpi-value">' + (payroll.revenuePerEmployee != null ? inr(payroll.revenuePerEmployee) : '—') + '</div><div class="kpi-note">per year</div></div>';

    breakdownBody.innerHTML = '';
    payroll.byDept.forEach(function (d) {
      var tr = document.createElement('tr');
      tr.className = 'row-plain';
      tr.innerHTML =
        '<td style="text-align:left;">' + d.department + '</td>' +
        '<td>' + d.headcount + '</td>' +
        '<td>' + inr(d.avgMonthly) + '</td>' +
        '<td>' + inr(d.annual) + '</td>' +
        '<td>' + pct1(d.pctOfPayroll) + '</td>';
      breakdownBody.appendChild(tr);
    });
    breakdownWrap.style.display = 'block';

    setPLNote(payroll, r);
    return payroll;
  }

  function parseRosterRows(rows2D) {
    if (!rows2D || !rows2D.length) return { rows: [], errors: ['The file is empty.'] };
    var header = rows2D[0].map(function (h) { return String(h == null ? '' : h).trim().toLowerCase(); });
    var idx = {
      role: header.indexOf('role'),
      department: header.indexOf('department'),
      headcount: header.indexOf('headcount'),
      salary: header.indexOf('monthlysalaryperemployee')
    };
    if (idx.role === -1 || idx.salary === -1) {
      return { rows: [], errors: ['The file needs at least a "Role" and a "MonthlySalaryPerEmployee" column.'] };
    }
    var rows = [];
    var errors = [];
    for (var i = 1; i < rows2D.length; i++) {
      var cols = rows2D[i] || [];
      var blank = cols.length === 0 || cols.every(function (c) { return c === undefined || c === null || String(c).trim() === ''; });
      if (blank) continue;
      var role = idx.role > -1 ? String(cols[idx.role] == null ? '' : cols[idx.role]).trim() : '';
      if (!role) { errors.push('Row ' + (i + 1) + ': missing Role, skipped.'); continue; }
      var department = idx.department > -1 ? String(cols[idx.department] == null ? '' : cols[idx.department]).trim() : '';
      var headcount = idx.headcount > -1 ? (num(cols[idx.headcount]) || 1) : 1;
      var salary = num(cols[idx.salary]);
      rows.push({ id: employeeIdCounter++, role: role, department: department, headcount: headcount, monthlySalary: salary });
    }
    return { rows: rows, errors: errors };
  }

  function parseRosterCSV(text) {
    var lines = text.split(/\r\n|\n|\r/).filter(function (l) { return l.trim().length > 0; });
    var rows2D = lines.map(function (line) { return line.split(','); });
    return parseRosterRows(rows2D);
  }

  function parseRosterExcel(arrayBuffer) {
    if (typeof XLSX === 'undefined') {
      return { rows: [], errors: ['Excel parsing needs this page to load a small library from the internet, which isn’t reachable right now. Try again online, or upload a CSV instead.'] };
    }
    var data = new Uint8Array(arrayBuffer);
    var wb = XLSX.read(data, { type: 'array' });
    var sheet = wb.Sheets[wb.SheetNames[0]];
    var rows2D = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
    return parseRosterRows(rows2D);
  }

  function downloadRosterTemplate() {
    var header = ['Role', 'Department', 'Headcount', 'MonthlySalaryPerEmployee'];
    var sample = [
      ['Physics Teacher', 'Teaching', 3, 45000],
      ['Chemistry Teacher', 'Teaching', 2, 42000],
      ['Front Office Executive', 'Admin', 2, 22000],
      ['Peon / Support', 'Support', 2, 15000]
    ];
    if (typeof XLSX !== 'undefined') {
      var ws = XLSX.utils.aoa_to_sheet([header].concat(sample));
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Roster');
      XLSX.writeFile(wb, 'scubus-staff-roster-template.xlsx');
    } else {
      var csv = [header.join(',')].concat(sample.map(function (row) { return row.join(','); })).join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'scubus-staff-roster-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  document.getElementById('roster-file').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    var status = document.getElementById('roster-status');
    if (!file) return;
    var isExcel = /\.xlsx?$/i.test(file.name);
    var reader = new FileReader();
    reader.onload = function (evt) {
      var parsed = isExcel ? parseRosterExcel(evt.target.result) : parseRosterCSV(String(evt.target.result));
      if (!parsed.rows.length) {
        status.className = 'upload-status err';
        status.textContent = parsed.errors.length ? parsed.errors[0] : 'Could not read any employee rows from that file.';
        return;
      }
      employees = employees.concat(parsed.rows);
      renderRosterTable();
      status.className = 'upload-status ok';
      status.textContent = 'Added ' + parsed.rows.length + ' employee row' + (parsed.rows.length === 1 ? '' : 's') +
        (parsed.errors.length ? (' (' + parsed.errors.length + ' row(s) skipped)') : '') + '.';
      render();
    };
    reader.onerror = function () {
      status.className = 'upload-status err';
      status.textContent = 'Could not read that file.';
    };
    if (isExcel) reader.readAsArrayBuffer(file); else reader.readAsText(file);
  });

  document.getElementById('download-roster-template').addEventListener('click', downloadRosterTemplate);

  document.getElementById('add-roster-row').addEventListener('click', function () {
    addEmployeeRow();
    renderRosterTable();
    render();
  });

  document.getElementById('clear-roster').addEventListener('click', function () {
    employees = [];
    document.getElementById('roster-file').value = '';
    document.getElementById('roster-status').textContent = '';
    document.getElementById('roster-status').className = 'upload-status';
    renderRosterTable();
    render();
  });

  // ---- Executive summary ----

  function getActualsYTD(planMonths) {
    if (!actuals || !actuals.length) return null;
    var planRevSum = 0, actualRevSum = 0, planEbitdaSum = 0, actualEbitdaSum = 0;
    actuals.forEach(function (a) {
      var plan = planMonths[a.monthIndex];
      planRevSum += plan.revenue;
      actualRevSum += a.revenue;
      planEbitdaSum += plan.ebitda;
      actualEbitdaSum += a.ebitda;
    });
    return {
      count: actuals.length,
      revVarTotal: variance(actualRevSum, planRevSum),
      ebitdaVarTotal: variance(actualEbitdaSum, planEbitdaSum)
    };
  }

  function renderSynopsis(r, payroll) {
    var el = document.getElementById('synopsis-body');
    var paras = [];

    paras.push('S-CUBUS is planned to enroll ' + state.students + ' students in FY 2026–27, generating ' + inr(r.revenue) +
      ' in revenue — ' + (state.growthRate >= 0 ? 'up ' + pct1(state.growthRate) : 'down ' + pct1(Math.abs(state.growthRate))) +
      ' on last year’s ' + inr(r.prevYearRevenue) + '.');

    var marginNote;
    if (r.netMarginPct >= 20) marginNote = 'a healthy net margin, comfortably ahead of the 15–20% typical for established coaching institutes';
    else if (r.netMarginPct >= 10) marginNote = 'a moderate net margin, roughly in line with typical coaching-institute economics';
    else if (r.netMarginPct >= 0) marginNote = 'a thin net margin — a small swing in enrollment or costs could erode most of this profit';
    else marginNote = 'a projected loss at these assumptions — the cost structure needs revisiting before this plan is viable';
    paras.push('At ' + pct1(r.netMarginPct) + ' (' + inr(r.netProfit) + ' net profit) and ' + pct1(r.ebitdaMarginPct) +
      ' EBITDA margin, the plan runs ' + marginNote + '.');

    var candidates = [
      ['Teaching & academic', r.teaching], ['Marketing & admissions', r.marketing],
      ['Admin, ops & support', r.admin], ['Rent & infrastructure', r.rent], ['Other fixed overheads', r.other]
    ];
    var dominant = candidates[0];
    candidates.forEach(function (c) { if (c[1] > dominant[1]) dominant = c; });
    var costLine = dominant[0] + ' is the largest cost driver at ' + pct1(r.revenue ? dominant[1] / r.revenue * 100 : 0) + ' of revenue.';
    if (payroll && payroll.headcount) {
      var combinedPlan = r.teaching + r.admin;
      var v = variance(payroll.totalAnnual, combinedPlan);
      costLine += ' Your ' + payroll.headcount + '-employee payroll roster (' + inr(payroll.totalAnnual) + '/year, ' +
        pct1(payroll.pctOfRevenue) + ' of revenue) ' +
        (Math.abs(v) < 8 ? 'lines up closely with' : (v > 0 ? 'runs higher than' : 'runs lower than')) +
        ' the Teaching + Admin assumption above.';
    }
    paras.push(costLine);

    if (r.breakEven != null) {
      var cushion = r.breakEven > 0 ? state.students / r.breakEven : null;
      var cushionNote;
      if (cushion == null) cushionNote = '';
      else if (cushion >= 2) cushionNote = 'a comfortable cushion above that level.';
      else if (cushion >= 1.2) cushionNote = 'a reasonable buffer above that level.';
      else if (cushion >= 1) cushionNote = 'a thin buffer above that level — worth monitoring closely.';
      else cushionNote = 'currently below that level.';
      paras.push('The plan needs ' + r.breakEven.toLocaleString('en-IN') + ' students to break even; at ' + state.students +
        ' enrolled, that’s ' + cushionNote);
    }

    if (payroll && payroll.headcount && payroll.revenuePerEmployee != null) {
      paras.push('Staffing efficiency: ' + inr(payroll.revenuePerEmployee) + ' of revenue per employee across ' +
        payroll.headcount + ' staff, averaging ' + inr(payroll.avgMonthly) + '/month per employee.');
    }

    var ytd = getActualsYTD(r.months);
    if (ytd) {
      paras.push('Year-to-date actuals (' + ytd.count + ' month' + (ytd.count === 1 ? '' : 's') + ' uploaded) show revenue running ' +
        varianceLabel(ytd.revVarTotal) + ' against plan and EBITDA ' + varianceLabel(ytd.ebitdaVarTotal) + ' — ' +
        (ytd.revVarTotal >= 0 ? 'ahead of' : 'behind') + ' the annual target so far.');
    }

    el.innerHTML = paras.map(function (p) { return '<p>' + p + '</p>'; }).join('');
  }

  function render() {
    var r = compute();

    setText('out-students', String(state.students));
    setText('out-growth', (state.growthRate >= 0 ? '+' : '') + state.growthRate + '%');
    setText('out-teaching', state.teachingPct + '%');
    setText('out-marketing', state.marketingPct + '%');
    setText('out-admin', state.adminPct + '%');
    setText('out-tax', state.taxRate + '%');

    setText('kpi-revenue', inr(r.revenue));
    setText('kpi-revenue-note', 'vs ' + inr(r.prevYearRevenue) + ' last year');
    setText('kpi-gross-margin', pct1(r.grossMarginPct));
    setText('kpi-ebitda-margin', pct1(r.ebitdaMarginPct));
    setText('kpi-ebitda-note', inr(r.ebitda));
    setText('kpi-net-profit', inr(r.netProfit));
    setText('kpi-net-margin-note', pct1(r.netMarginPct) + ' net margin');
    setText('kpi-breakeven', r.breakEven != null ? r.breakEven.toLocaleString('en-IN') : '—');

    setText('pl-revenue', inr(r.revenue));
    setText('pl-teaching', '– ' + inr(r.teaching));
    setText('pl-teaching-pct', pct1(r.revenue ? r.teaching / r.revenue * 100 : 0));
    setText('pl-gross-profit', inr(r.grossProfit));
    setText('pl-gross-margin', pct1(r.grossMarginPct));
    setText('pl-marketing', '– ' + inr(r.marketing));
    setText('pl-marketing-pct', pct1(r.revenue ? r.marketing / r.revenue * 100 : 0));
    setText('pl-admin', '– ' + inr(r.admin));
    setText('pl-admin-pct', pct1(r.revenue ? r.admin / r.revenue * 100 : 0));
    setText('pl-rent', '– ' + inr(r.rent));
    setText('pl-rent-pct', pct1(r.revenue ? r.rent / r.revenue * 100 : 0));
    setText('pl-other', '– ' + inr(r.other));
    setText('pl-other-pct', pct1(r.revenue ? r.other / r.revenue * 100 : 0));
    setText('pl-ebitda', inr(r.ebitda));
    setText('pl-ebitda-margin', pct1(r.ebitdaMarginPct));
    setText('pl-tax', '– ' + inr(r.tax));
    setText('pl-tax-pct', pct1(r.revenue ? r.tax / r.revenue * 100 : 0));
    setText('pl-net-profit', inr(r.netProfit));
    setText('pl-net-margin', pct1(r.netMarginPct));

    renderAllocation(r.segments);
    renderReport(r);
    renderActuals(r.months);
    var payroll = renderPayroll(r);
    renderSynopsis(r, payroll);
  }

  function bind(key, el, parse) {
    if (!el) return;
    el.value = state[key];
    el.addEventListener('input', function (e) {
      state[key] = parse(e.target.value);
      render();
    });
  }

  bind('students', inputs.students, function (v) { return Math.max(0, parseInt(v, 10) || 0); });
  bind('avgFee', inputs.avgFee, function (v) { return Math.max(0, parseInt(v, 10) || 0); });
  bind('growthRate', inputs.growthRate, function (v) { return parseFloat(v) || 0; });
  bind('teachingPct', inputs.teachingPct, function (v) { return parseFloat(v) || 0; });
  bind('marketingPct', inputs.marketingPct, function (v) { return parseFloat(v) || 0; });
  bind('adminPct', inputs.adminPct, function (v) { return parseFloat(v) || 0; });
  bind('rentMonthly', inputs.rentMonthly, function (v) { return Math.max(0, parseInt(v, 10) || 0); });
  bind('otherFixedMonthly', inputs.otherFixedMonthly, function (v) { return Math.max(0, parseInt(v, 10) || 0); });
  bind('taxRate', inputs.taxRate, function (v) { return parseFloat(v) || 0; });

  document.getElementById('reset-btn').addEventListener('click', function () {
    state = Object.assign({}, DEFAULTS);
    Object.keys(inputs).forEach(function (key) {
      if (inputs[key]) inputs[key].value = state[key];
    });
    render();
  });

  render();
})();
