const SERVER = "http://localhost:3000";
let network = null;

function loading() {
    $("#page_blocker").toggle()
}

function end_loading() {
    $("#page_blocker").toggle()
}

/**
 * 
 * Displays the graph using viz-network and the data from the server.
 */
const display_graph = (data) => {
    const connections = data;
    let i = 0;
    const page_id_to_int = {}
    const int_to_page_id = {}
    const edges = []
    const nodes = [];
    let K = 0;
    for (let page_id in connections) {
        page_id_to_int[page_id] = i
        int_to_page_id[i] = page_id
        nodes.push({
            id: i,
            label: connections[page_id].Title
        });
        i += 1;
    }

    for (let page_id in connections) {
        const from = page_id_to_int[page_id];
        for (let other_id of connections[page_id].adjacency) {
            const to = page_id_to_int[other_id]
            const finder = edges.find((value) => value.from == to && value.to == from || value.to == to && value.from == from)
            if (!finder)
                edges.push({
                    from: from,
                    to: to
                })
        }
    }
    // create a network
    var container = document.getElementById("mynetwork");
    var data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
    };
    var options = {};
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
            display_graph(JSON.parse(data))
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
        console.log("From rebuild cache: ", v, v == "done");
        if (v !== "done") {
            $("#error_div").html(`An error occurred while rebuilding cache ${v}`)
            $("#error_div").show();
        } else {
            get_data();
        }
    })
})
get_data();