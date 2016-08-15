/* The (relative) URL where the user's data is located. You should not need to use this directly. */
var url = "../cdn/data.enc";

/* The salt used to derive a key from the user's password. */
var salt = "8a4785891590ea6a43b858d73af65f12f3376947d0717585dead654457ceecf0";

/* The IV that was used to encrypt the user's data */
var iv = new Uint8Array([0x72, 0x0d, 0x30, 0x32, 0x5a, 0xda, 0x6c, 0x56, 0xcc, 0x1c, 0x2d, 0xd4]);

/* The Merkle tree. merkle_root is the root of the tree, and merkle_tree contains the Merkle path.
 * merkle_tree[0] is a leaf node, merkle_tree[1] is one level up, etc. 
 *
 *                               merkle_root
 *                                 +     +
 *                                 |     |
 *                       <---------+     +--------->
 *                   [compute]               merkle_tree[2]
 *                     +   +
 *                <----+   +------->
 *            [compute]      merkle_tree[1]
 *              +   +
 *     <--------+   +------>
 * SHA256(data)      merkle_tree[0]
 *
 * */
var merkle_root = '2c53caff52f43b08b34e105ae67d8c33f0b33a297db7f749ff1b2a6deb646041';
var merkle_tree = ['8e86c8a733ce58e68e01a24a271f961346a4437584eec89f39bb0f3246b7759b',
        '5f08975093846d9f49e8bb7808672305b8e7824f410075f2a36b2c8acc072d12',
        '73ad4bcfc747f04d8d92d5ba3c9b0e7d678775b2df618bff0a2f700b20673cb5'];

var passwordEntered = function() {
    if (typeof data === "undefined") {
        if (window.location.href.substring(0,4) === "file") {
            console.warn("file:// URL detected. This webpage should be served using a web server.",
                    "See the assignment handout for details about how to run the assignment.");
        }
        throw("Not ready!");
    }
    var password = document.getElementById('password').value;
	
	if (!data_corrupted) {
		lib.balloonHash(password, salt).then(function(keyBuffer){
			console.log("balloon hash applied");
			lib.importKey(keyBuffer.slice(0,32)).then(function(key){
				console.log("key imported");
				var decryptPromise = lib.decrypt(key, data, iv);

				decryptPromise.then(function(decryptedData){
					console.log("data succesfully decrypted");
					//console.log(decryptedData);
					displayImage(decryptedData);
					console.log("hiding image in 5 seconds")
					setTimeout(hideImage, 5000);
				});

				decryptPromise.catch(function(){
					console.log("decrypting failed, password incorrect");
					alert("Incorrect Password! Please try again.");
				});
			});
		});
	} else {
		console.log("data corrupted during transmission.");
		alert(DATA_ERROR_CONST);	
	}
};

/* Loads the encrypted data */
var data;
/* checks if recovered data is corrupted */
var data_corrupted;
var data_check;
/* constant variable for data error */
var DATA_ERROR_CONST = "Data recovered was corrupted during transmission, please reload the page!"

lib.getData(url).then(function(arr) {
    data = arr;

	lib.sha256Hash(data).then(function(d0) {
                var d0s = lib.arrayBufferToHex(d0).concat(merkle_tree[0]);
                lib.sha256Hash(lib.hexToArrayBuffer(d0s)).then(function(d1) {
                        var d1s = lib.arrayBufferToHex(d1).concat(merkle_tree[1]);
                        lib.sha256Hash(lib.hexToArrayBuffer(d1s)).then(function(d2) {
                                var d2s = lib.arrayBufferToHex(d2).concat(merkle_tree[2]);
                                lib.sha256Hash(lib.hexToArrayBuffer(d2s)).then(function(r0) {
                                        data_check = lib.arrayBufferToHex(r0);
                                        if (data_check === merkle_root) {
                                                data_corrupted = false;
						console.log("Succesfully recovered the data.");
                                        } else {
                                                data_corrupted = true;
						alert(DATA_ERROR_CONST);
                                        }
                                });
                        });
                });
        });
});

/* Displays the decrypted image */
/* Source: https://jsfiddle.net/Jan_Miksovsky/yy7Zs/ */
var displayImage = function(arraybuffer) {
    var view = new Int8Array(arraybuffer);
    var blob = new Blob([view], { type: "image/png" });
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    var img = document.createElement("img");
    img.src = imageUrl;
    img.id = "img";
    document.getElementById("photos").appendChild(img);
};

var hideImage = function() {
	document.getElementById("photos").removeChild(document.getElementById("img"));

};
