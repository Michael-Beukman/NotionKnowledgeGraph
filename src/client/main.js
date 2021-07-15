const SERVER = "http://localhost:3000";
let network = null;
let my_data = null;
let empty = false;
let curr_width = 0;


// Load and stop loading.
function loading() {
    $("#page_blocker").toggle()
}

function end_loading() {
    $("#page_blocker").toggle()
}
// adds in newlines for better display.
function shorten(s, l = 25){
    if (s.length <= l) return s;
    const start = s.slice(0, l) + "\n" + shorten(s.slice(l))
    return start
}
/**
 * 
 * Displays the graph using viz-network and the data from the server.
 */
const display_graph = (data, empty=false) => {
    const connections = data;
    let i = 0;
    // both ways mapping from id <=> index
    const page_id_to_int = {}
    const int_to_page_id = {}
    const edges = []
    const nodes = [];
    let K = 0;
    for (let page_id in connections) {
        page_id_to_int[page_id] = i
        int_to_page_id[i] = page_id
        // Make the node
        nodes.push({
            id: i,
            label: shorten(connections[page_id].Title),
            title: connections[page_id].Title,
            shape: 'ellipse',
            font:{
                size: (1-empty) * 14
            },
            chosen:{
                node: function(values){
                    values.size *= 2;
                },
                label: function (values){
                    values.size = 14;
                }
            },
            value: connections[page_id].adjacency.length * 10,
            scaling: {
                label: {
                    drawThreshold: 0
                }
            }
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
    var data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
    };
    var options = {
        configure: {
            enabled: true,
            // filter: 'nodes,edges',
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
              tooltipDelay: empty ? 0: 100
          }
    };
    network = new vis.Network(container, data, options);
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
$("#btnEmpty").on('click', ()=>{
    empty = !empty;
    display_graph(my_data, empty);
})

// Toggles the config menu
$("#btnConfig").on('click', ()=>{
    curr_width = (curr_width == 0) ? 20 : 0;

    $("#mynetwork").css("width", `${100 - curr_width}vw`);
    $("#sidepanel").css("width", `${curr_width}vw`);
});

get_data();