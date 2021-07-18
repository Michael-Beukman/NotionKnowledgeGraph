const SERVER = "http://localhost:3000";
let network = null;
let my_data = null;
let empty = true;
let curr_width = 0;
const og_colour = {
    border: '#2B7CE9',
    background: '#97C2FC',
    highlight: {
        border: '#2B7CE9',
        background: '#D2E5FF'
    },
    hover: {
        border: '#2B7CE9',
        background: '#D2E5FF'
    }
};

// Load and stop loading.
function loading() {
    $("#page_blocker").toggle()
}

function end_loading() {
    $("#page_blocker").toggle()
}
// adds in newlines for better display.
function shorten(s, l = 25) {
    if (s.length <= l) return s;
    const start = s.slice(0, l) + "\n" + shorten(s.slice(l))
    return start
}
/**
 * 
 * Displays the graph using viz-network and the data from the server.
 */

const display_graph = (data, empty = false) => {
    let graph_data;

    const connections = data;

    let i = 0;
    // both ways mapping from id <=> index
    const page_id_to_int = {}
    const int_to_page_id = {}
    const edges = []
    const nodes = [];
    // Go over all the nodes and add them to the data structure.
    // Lots of this comes from an example in https://github.com/visjs/vis-network/blob/master/examples/network/exampleApplications/neighbourhoodHighlight.html
    for (let page_id in connections) {
        page_id_to_int[page_id] = i
        int_to_page_id[i] = page_id

        // Make the node
        nodes.push({
            id: i,
            label: empty ? "" : shorten(connections[page_id].Title),
            hiddenLabel: shorten(connections[page_id].Title),
            title: connections[page_id].Title,
            shape: 'dot',
            font: {
                size: 14,
                strokeWidth: 10
            },
            scaling: {
                min: 8,
                max: 30,
                label: {
                    min: 8,
                    max: 30,
                    drawThreshold: 8,
                    maxVisible: 20,
                },
            },
            value: connections[page_id].adjacency.length,
            size: connections[page_id].adjacency.length * 2 + 5,
            chosen: {
                node: function (values, id, selected, hovering) {
                    values.color = 'red'
                }
            },
        });
        i += 1;
    }

    // Create the edges
    for (let page_id in connections) {
        const from = page_id_to_int[page_id];
        for (let other_id of connections[page_id].adjacency) {
            const to = page_id_to_int[other_id]

            // only add in new edges.
            const finder = edges.find((value) => value.from == to && value.to == from || value.to == to && value.from == from)
            if (!finder)
                edges.push({
                    from: from,
                    to: to
                })
        }
    }
    // create the network
    var container = document.getElementById("mynetwork");
    var panel = document.getElementById("sidepanel");
    graph_data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
    };

    const draw = () => {
        var options = {
            configure: {
                enabled: true,
                container: panel,
                showButton: true
            },
            physics: {
                'solver': "barnesHut",
                barnesHut: {
                    avoidOverlap: 0.2,
                    springLength: 200
                }
            },
            interaction: {
                tooltipDelay: empty ? 0 : 100
            }
        };
        network = new vis.Network(container, graph_data, options);
    }

    // are we in a state where nodes are highlighted
    let highlightActive = false;
    const onClick = (params) => {
        const allNodes = graph_data.nodes.get({
            returnType: "Object"
        });

        if (params.nodes.length > 0) {
            highlightActive = true;
            var i;
            var selectedNode = params.nodes[0];

            // mark all nodes as hard to read, i.e. grayed out.
            for (var nodeId in allNodes) {
                allNodes[nodeId].hiddenColor = allNodes[nodeId].color
                allNodes[nodeId].color = "rgba(200,200,200,0.5)";
                allNodes[nodeId].label = undefined;
            }
            var connectedNodes = network.getConnectedNodes(selectedNode);

            // all first degree nodes get their own color and their label back
            for (i = 0; i < connectedNodes.length; i++) {
                allNodes[connectedNodes[i]].color = og_colour;
            }

            // the main node gets its own color and its label back.
            allNodes[selectedNode].color = og_colour;
            allNodes[selectedNode].label = allNodes[selectedNode].hiddenLabel;
        
        } else if (highlightActive === true) {
            // reset all nodes to their OG state.
            for (var nodeId in allNodes) {
                allNodes[nodeId].color = og_colour;
                allNodes[nodeId].label = empty ? "" : allNodes[nodeId].hiddenLabel;
            }
            highlightActive = false;
        }
        // transform the object into an array and update the graph.
        var updateArray = [];
        for (nodeId in allNodes) {
            if (allNodes.hasOwnProperty(nodeId)) {
                updateArray.push(allNodes[nodeId]);
            }
        }
        graph_data.nodes.update(updateArray);
    }
    draw(data);
    network.on('click', onClick)
}

// Gets the data from the server.
function get_data() {
    $("#error_div").hide();
    loading();
    $.ajax(SERVER + "/data", {
        'method': 'get',
        'data': {
            'mode': 'get_data'
        }
    }).then(data => {
        end_loading();
        if (data.error) {
            $("#error_div").html(`An error occurred: ${data.message}`)
            $("#error_div").show();
        } else {
            my_data = JSON.parse(data);
            display_graph(my_data, empty);
        }
    })
}

// Rebuilds cache using the IDs given.
$("#btn_rebuild_cache").on('click', () => {
    const ids = $("#inpIds").val().split(" ").filter(x => x != "");
    if (ids.length == 0) {
        $("#error_div").html(`Please type in some IDs before pressing Rebuild Cache`)
        $("#error_div").show();
        return;
    }
    loading();
    $.ajax(SERVER + "/rebuild", {
        'method': 'post',
        data: {
            'ids': ids
        }
    }).then((v) => {
        end_loading();
        if (v !== "done") {
            $("#error_div").html(`An error occurred while rebuilding cache ${v}`)
            $("#error_div").show();
        } else {
            get_data();
        }
    })
})


// Removes labels from nodes
$("#btnEmpty").on('click', () => {
    empty = !empty;
    display_graph(my_data, empty);
})

// Toggles the config menu
$("#btnConfig").on('click', () => {
    curr_width = (curr_width == 0) ? 20 : 0;

    $("#mynetwork").css("width", `${100 - curr_width}vw`);
    $("#sidepanel").css("width", `${curr_width}vw`);
});

get_data();