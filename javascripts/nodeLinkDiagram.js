function drawGraph(dataName, refCentrality, colorMapName, isTutorial, taskNum, isHighestValue = true) {
    const startTime = Util.getTime();
    const graph = Data.getData(dataName);
    const colorMap = Constant.colorMaps[colorMapName];

    let rotate = Math.random() * 360;
    let scale = 1;
    let moveX = (dataName === 'jazz') ? -25 : 0;
    let moveY = (dataName === 'jazz') ? -50 : 0;

    isHighestValue = (isHighestValue === undefined) ? true : isHighestValue;

    if (refCentrality === 'random') setRandCentrality();

    console.log(taskNum, dataName, refCentrality, colorMapName, isTutorial ? "tutorial" : "not-tutorial", isHighestValue ? "high" : "low");

    // Set Render Size
    const svgHTML = document.getElementById('network');
    const svg = d3.select("svg#network"),
        legendSvg = d3.select("svg#legend"),
        svgWidth = svgHTML.width.baseVal.value,
        svgHeight = svgHTML.height.baseVal.value,
        width = (dataName === 'jazz') ? svgHeight * 0.93 : svgHeight * 0.8,
        height = (dataName === 'jazz') ? svgHeight * 0.93 : svgHeight * 0.8;

    // No Magic Number !
    const nodeRadius = (dataName === 'jazz') ? 3 : 5,
        linkColor = '#000',
        linkOpacity = 0.15,
        legendX = 25,
        legendY = 50,
        legendSize = 15;

    let maxAxisVal = undefined,
        minCentralityVal = undefined,
        maxCentralityVal = undefined;

    setAxisInfo();
    drawColorLegend();
    drawLinks();
    drawNodes();

    /**
     * Set Axis Information
     */
    function setAxisInfo() {
        // position
        const maxXNode = _.maxBy(graph.nodes, function (node) {
            return Math.abs(node.x);
        });
        const maxAbsX = Math.abs(maxXNode.x);
        const maxYNode = _.maxBy(graph.nodes, function (node) {
            return Math.abs(node.y);
        });
        const maxAbsY = Math.abs(maxYNode.y);
        maxAxisVal = maxAbsX > maxAbsY ? maxAbsX : maxAbsY;

        // centrality
        const minCentralityNode = _.minBy(graph.nodes, function (node) {
            return node[refCentrality];
        });
        minCentralityVal = minCentralityNode[refCentrality];
        const maxCentralityNode = _.maxBy(graph.nodes, function (node) {
            return node[refCentrality];
        });
        maxCentralityVal = maxCentralityNode[refCentrality];
    }

    /**
     * Draw Color Legend
     */
    function drawColorLegend() {
        legendSvg.append('text')
            .text('low')
            .attrs({
                x: legendX,
                y: legendY - 5,
                'text-anchor': 'start',
                'alignment-baseline': 'ideographic'
            });
        legendSvg.append('text')
            .text('high')
            .attrs({
                x: legendX + 255 * 1.5,
                y: legendY - 5,
                'text-anchor': 'middle',
                'alignment-baseline': 'ideographic'
            });


        for (let i = 0; i <= 255; i++) {
            const relative = i / 255;
            const virtualCentrality = Util.getAbsoluteVal(relative, minCentralityVal, maxCentralityVal);
            const color = getHexColor(virtualCentrality);
            legendSvg.append('rect')
                .attrs({
                    x: legendX + i * 1.5,
                    y: legendY,
                    width: 4,
                    height: legendSize,
                    fill: color,
                });
            if (i === 0 || i === 127 || i === 255) {
                legendSvg.append('text')
                    .text(virtualCentrality.toFixed(2))
                    .attrs({
                        x: legendX + i * 1.5,
                        y: legendY + legendSize + 15,
                        'text-anchor': 'middle',
                        'alignment-baseline': 'central'
                    })
            }
        }
    }

    /**
     * Draw Nodes
     */
    function drawNodes() {
        _.forEach(graph.nodes, function (node) {
            const coord = getCoord({ x: node.x, y: node.y });
            const color = getHexColor(node[refCentrality]);
            svg.append('circle')
                .attrs({
                    cx: coord.x,
                    cy: coord.y,
                    r: nodeRadius,
                    fill: color
                })
                .classed('node', true)
                .on('click', function () {
                    console.log(node);
                    checkAnswerResult(node);
                })
        });
        transformDiagram();
    }

    /**
     * Draw Links
     */
    function drawLinks() {
        _.forEach(graph.links, function (link) {
            const sourceNodeIdx = link.source;
            const targetNodeIdx = link.target;
            const sourceCoord = getCoord(graph.nodes[sourceNodeIdx]);
            const targetCoord = getCoord(graph.nodes[targetNodeIdx]);

            svg.append('line')
                .attrs({
                    x1: sourceCoord.x,
                    x2: targetCoord.x,
                    y1: sourceCoord.y,
                    y2: targetCoord.y,
                    stroke: linkColor,
                    opacity: (dataName === 'jazz') ? linkOpacity / 3 : linkOpacity
                })
        });
    }

    function transformDiagram() {
        d3.selectAll('circle')
            .attr('transform', `rotate(${rotate}, ${svgWidth / 2}, ${svgHeight / 2}) scale(${scale}, ${scale}) translate(${moveX}, ${moveY})`);

        d3.selectAll('line')
            .attr('transform', `rotate(${rotate}, ${svgWidth / 2}, ${svgHeight / 2}) scale(${scale}, ${scale}) translate(${moveX}, ${moveY})`);
    }

    /**
     * 'pos' is the coordinate with center point (0,0).
     * Returns the top-left point to be (0,0).
     * @param pos
     * @returns {{x: number, y: number}}
     */
    function getCoord(pos) {
        return {
            x: (svgWidth / 2) + (pos.x / maxAxisVal) * (width / 2),
            y: (svgHeight / 2) + (pos.y / maxAxisVal) * (height / 2)
        }
    }

    /**
     * Get Hexadecimal Color from centrality
     * @param centrality
     * @returns {string} : rgb({r}, {g}, {b})
     */

    function getHexColor(centrality) {
        const relativeVal = Util.getRelativeVal(centrality, minCentralityVal, maxCentralityVal);
        let nonZeroVal = relativeVal;
        if (colorMapName === 'single_blue') {
            nonZeroVal = (relativeVal + 0.2) / 1.2;
        } else if (colorMapName === 'rainbow') {
            nonZeroVal = (relativeVal + 0.3) / 1.3;
        }
        return colorMap(nonZeroVal);
    }

    function setRandCentrality() {
        _.forEach(graph.nodes, (node) => {
            node['random'] = Math.random();
        })
    }

    function checkAnswerResult(userAnswerNode) {
        if (app.$data.isTaskComplete) {
            d3.selectAll('.correctnessText').remove();
        }

        d3.selectAll('.node').remove();
        d3.selectAll('.link').remove();
        const coord = getCoord({ x: userAnswerNode.x, y: userAnswerNode.y });
        svg.append('circle')
            .attrs({
                cx: coord.x,
                cy: coord.y,
                r: nodeRadius + 5,
                fill: '#000'
            })
            .classed('node', true);
        drawNodes();
        const elapsedTime = Util.getTimeDiffFrom(startTime);
        let isCorrect = isHighestValue ?
            userAnswerNode[refCentrality] >= maxCentralityVal : userAnswerNode[refCentrality] <= minCentralityVal;
        console.log("result : ", elapsedTime, isCorrect);

        if (isTutorial) {
            const isCorrectText = isCorrect ? 'CORRECT' : 'WRONG';
            svg.append('text')
                .text('Your answer is ' + isCorrectText + ' and time completion is ' + elapsedTime + ' seconds')
                .attrs({
                    x: 10,
                    y: svgHeight - 10,
                    'text-anchor': 'start',
                    'alignment-baseline': 'ideographic'
                })
                .classed('correctnessText', true);
            app.$data.user.test['tutorial_test'][taskNum] = {
                'time': elapsedTime,
                'correctness': isCorrect,
            };
        } else {
            app.$data.user.test['real_test'][taskNum] = {
                'time': elapsedTime,
                'correctness': isCorrect,
                'data_name': dataName,
                'centrality': refCentrality,
                'color-map': colorMapName,
                'is_high': isHighestValue,
                'correct_value': isHighestValue ? maxCentralityVal : minCentralityVal,
                'answered_value': userAnswerNode[refCentrality],
                'answered_node': userAnswerNode,
            };
        }
        app.$data.isTaskComplete = true;
        return { elapsedTime, isCorrect }
    }
}
