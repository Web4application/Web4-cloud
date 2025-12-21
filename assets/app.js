document.addEventListener("DOMContentLoaded", () => {
    const inputBox = document.getElementById("sctm-input");
    const outputConsole = document.getElementById("execution-output");
    const knowledgeGraphDiv = document.getElementById("knowledge-graph");
    const formulaPlotDiv = document.getElementById("formula-plot");

    // Function to log output
    function logOutput(message) {
        outputConsole.textContent = message;
    }

    // Dummy function to generate a knowledge graph
    function renderKnowledgeGraph(data) {
        // Clear previous graph
        knowledgeGraphDiv.innerHTML = "";

        const width = knowledgeGraphDiv.clientWidth;
        const height = knowledgeGraphDiv.clientHeight;

        const svg = d3
            .select(knowledgeGraphDiv)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const nodes = data.nodes;
        const links = data.links;

        const simulation = d3
            .forceSimulation(nodes)
            .force(
                "link",
                d3.forceLink(links).id((d) => d.id).distance(100)
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg
            .append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-width", 2);

        const node = svg
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 15)
            .attr("fill", "#69b3a2")
            .call(drag(simulation));

        const label = svg
            .append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text((d) => d.id)
            .attr("font-size", "12px")
            .attr("dx", 18)
            .attr("dy", 4);

        simulation.on("tick", () => {
            link
                .attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);

            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
            label.attr("x", (d) => d.x).attr("y", (d) => d.y);
        });

        function drag(simulation) {
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }
            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
            return d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }
    }

    // Dummy function to plot a formula
    function renderFormulaPlot() {
        const x = Array.from({ length: 10 }, (_, i) => i);
        const y = x.map((d) => d * 2 + Math.random());

        const trace = {
            x,
            y,
            mode: "lines+markers",
            type: "scatter",
            name: "Dummy Formula",
        };

        const layout = {
            title: "Formula Plot",
            xaxis: { title: "X" },
            yaxis: { title: "Y" },
        };

        Plotly.newPlot(formulaPlotDiv, [trace], layout);
    }

    // Event listener for input changes
    inputBox.addEventListener("input", () => {
        const userInput = inputBox.value.trim();
        if (!userInput) {
            logOutput("{}");
            knowledgeGraphDiv.innerHTML = "";
            formulaPlotDiv.innerHTML = "";
            return;
        }

        // Dummy execution output
        logOutput(`Executing SCTM symbols:\n${userInput}\nResult: Success`);

        // Dummy knowledge graph data
        const graphData = {
            nodes: [
                { id: "A" },
                { id: "B" },
                { id: "C" },
            ],
            links: [
                { source: "A", target: "B" },
                { source: "B", target: "C" },
                { source: "A", target: "C" },
            ],
        };

        renderKnowledgeGraph(graphData);
        renderFormulaPlot();
    });
});
