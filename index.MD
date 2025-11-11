---
tittle:page
layout:site
features:
author:kubu
---

<!-- Header -->
<div class="header">
    <div class="logo">SCTM-for-Life</div>
    <div class="domain-select">Domain: <select><option>Education</option></select></div>
    <div class="help">Help ?</div>
</div>

<!-- Panels Container -->
<div class="panels">
    <!-- Input Panel -->
    <div class="panel input-panel">
        <h2>Input Panel</h2>
        <textarea id="sctm-input" placeholder="Type SCTM symbols here..."></textarea>
    </div>

    <!-- Visualization Panel -->
    <div class="panel viz-panel">
        <h2>Visualization Panel</h2>
        <div id="knowledge-graph"></div>
        <div id="formula-plot"></div>
    </div>
</div>

<!-- Execution / Output Console -->j
<div class="panel console-panel">
    <h2>Execution Console</h2>
    <pre id="execution-output">{}</pre>
</div>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</body>
<script src="app.js"></script>
</html>

