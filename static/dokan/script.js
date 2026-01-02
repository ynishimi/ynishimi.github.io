var peer = new Peer();

peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);
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
    console.log("connected");

    conn.on('open', function() {
        // input file
        const input = document.getElementById('file-selector');
        input.onchange = e => { 
            // getting a hold of the file reference
            const file = e.target.files[0]; 
            conn.send(file);
            console.log("sent", file);
        }
    });

    // Receive messages
    conn.on('data', function(data) {
        // receive data
        console.log('Received', data);
    });
}