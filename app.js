document.addEventListener("DOMContentLoaded", () => {
    const inputBox = document.getElementById("sctm-input");
    const outputConsole = document.getElementById("execution-output");
    const knowledgeGraphDiv = document.getElementById("knowledge-graph");
    const formulaPlotDiv = document.getElementById("formula-plot");

    function logOutput(message) {
        outputConsole.textContent = message;
    }

    // Parse SCTM symbols into nodes, links, and formulas
    function parseSCTM(input) {
        const nodesSet = new Set();
        const links = [];
        const formulas = [];

        const lines = input.split("\n").map(line => line.trim()).filter(line => line);
        lines.forEach(line => {
            // Simple pattern: "A -> B" or "X + Y -> Z"
            const match = line.match(/([\w\s\+\*]+)->([\w\s]+)/);
            if (match) {
                const left = match[1].split("+").map(s => s.trim());
                const right = match[2].split("+").map(s => s.trim());

                left.forEach(l => nodesSet.add(l));
                right.forEach(r => nodesSet.add(r));

                left.forEach(l => {
                    right.forEach(r => {
                        links.push({ source: l, target: r });
                    });
                });

                formulas.push({ expression: line });
            }
        });

        const nodes = Array.from(nodesSet).map(id => ({ id }));
        return { nodes, links, formulas };
    }

    // Render Knowledge Graph
    function renderKnowledgeGraph({ nodes, links }) {
        knowledgeGraphDiv.innerHTML = "";

        const width = knowledgeGraphDiv.clientWidth || 400;
        const height = knowledgeGraphDiv.clientHeight || 400;

        const svg = d3.select(knowledgeGraphDiv)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-width", 2);

        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 15)
            .attr("fill", "#69b3a2")
            .call(d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        const label = svg.append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text(d => d.id)
            .attr("font-size", "12px")
            .attr("dx", 18)
            .attr("dy", 4);

        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x).attr("cy", d => d.y);
            label.attr("x", d => d.x).attr("y", d => d.y);
        });
    }

    // Render Formula Plot
    function renderFormulaPlot(formulas) {
        formulaPlotDiv.innerHTML = "";

        const traces = formulas.map(f => {
            const x = Array.from({ length: 10 }, (_, i) => i);
            // Simple eval of formula: just random y values for now (replace with real calculation later)
            const y = x.map(d => Math.random() * 10);

            return {
                x, y, mode: "lines+markers", type: "scatter", name: f.expression
            };
        });

        const layout = { title: "Formula Plot", xaxis: { title: "X" }, yaxis: { title: "Y" } };
        Plotly.newPlot(formulaPlotDiv, traces, layout);
    }

    // Input listener
    inputBox.addEventListener("input", () => {
        const userInput = inputBox.value.trim();
        if (!userInput) {
            logOutput("{}");
            knowledgeGraphDiv.innerHTML = "";
            formulaPlotDiv.innerHTML = "";
            return;
        }

        try {
            const parsed = parseSCTM(userInput);
            renderKnowledgeGraph(parsed);
            renderFormulaPlot(parsed.formulas);

            logOutput(`Parsed ${parsed.nodes.length} nodes, ${parsed.links.length} links, ${parsed.formulas.length} formulas.`);
        } catch (err) {
            logOutput(`Error: ${err.message}`);
        }
    });
});
