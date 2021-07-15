const SERVER="http://localhost:3000";
let network = null;
const display_graph = (data) => {
    console.log("Hey data", data)
    const connections = data;
    let i = 0;
    const page_id_to_int = {}
    const int_to_page_id = {}
    const edges = []
    const nodes = [];

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
            // console.log(other_id)
            const to = page_id_to_int[other_id]
            const finder = edges.find((value) => value.from == to && value.to == from || value.to == to && value.from == from)
            console.log(finder)
            // if (edges.indexOf({from: to,to:from}) == -1)
            if (!finder)
                edges.push({
                    from: from,
                    to: to
                })
        }
    }

    console.log('edges=', edges)
    // create a network
    var container = document.getElementById("mynetwork");
    var data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
    };
    var options = {};
    network = new vis.Network(container, data, options);
}

function get_data(){
    // TODO
    $.ajax(SERVER + "/data", {
        'method': 'get',
        'data': {
            'mode': 'get_data'
        }
    }).then(data => display_graph(JSON.parse(data)))
}

$("#btn_rebuild_cache").on('click', ()=>{
    $.ajax(SERVER + "/rebuild", {
        'method': 'post',
        data:  {'ids': $("#inpIds").val().split(" ")}
    }).then((v) => {
        console.log("rebuilt", v);
        get_data();
    })
})
get_data();