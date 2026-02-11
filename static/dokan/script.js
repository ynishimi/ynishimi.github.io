var peer = new Peer();

peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);
    const para = document.createElement("p");
    para.innerText = ('your ID is: ' + id);
    document.body.appendChild(para);
});

// get dest peer ID
const btn = document.getElementById('connect-btn');

// connect
btn.addEventListener('click', () => {
    const id = document.getElementById('target-id-input').value;
    
    // connect
    var conn = peer.connect(id);
    sendrecv(conn);
});

// connected
peer.on('connection', function(conn) { 
    sendrecv(conn);
});

function sendrecv(conn) {
    conn.on('open', function() {
        console.log("connected", conn.peer);
        const statusPara = document.createElement("p");
        statusPara.innerText = ('connected with a peer: ' + conn.peer);
        document.body.appendChild(statusPara);
    });

        // input file
        const input = document.getElementById('file-selector');
        input.onchange = e => { 
            // getting a hold of the file reference
            const file = e.target.files[0]; 
            if (conn.open) {
                conn.send({
                    filename: file.name,
                    body: file,
                });
                console.log("sent", file);
                             console.log("conn closed");
                const sendPara = document.createElement("p");
                sendPara.innerText = ('sending a file: ' + file.name);
                document.body.appendChild(sendPara);
            }
            else {
                console.log("conn closed");
                const closedPara = document.createElement("p");
                closedPara.innerText = ('connection with a peer closed: ' + conn.peer);
                document.body.appendChild(closedPara);
            }
        }

    // Receive messages
    conn.on('data', function(data) {
        // receive data
        console.log('received', data);
        const receivedPara = document.createElement("p");
        receivedPara.innerText = ('downloaded ' + data.filename);
        document.body.appendChild(receivedPara);

        
        const blob = new Blob([data.body]);

        // download data
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
    });
    conn.on('close', function() {
        console.log('closed');
    });
}