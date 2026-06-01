let produk = JSON.parse(localStorage.getItem("produk")) || [];

// render
function renderProduk() {
    const list = document.getElementById("produkList");
    list.innerHTML = "";

    produk.forEach((item, index) => {
        list.innerHTML += `
            <li>
                <strong>${item.nama}</strong>
                <br>${item.kategori}

                <br><br>

                S: ${item.stok.S}
                <button onclick="ubahStok(${index},'S',1)">+</button>
                <button onclick="ubahStok(${index},'S',-1)">-</button>

                <br>
                M: ${item.stok.M}
                <button onclick="ubahStok(${index},'M',1)">+</button>
                <button onclick="ubahStok(${index},'M',-1)">-</button>

                <br>
                L: ${item.stok.L}
                <button onclick="ubahStok(${index},'L',1)">+</button>
                <button onclick="ubahStok(${index},'L',-1)">-</button>

                <br>
                XL: ${item.stok.XL}
                <button onclick="ubahStok(${index},'XL',1)">+</button>
                <button onclick="ubahStok(${index},'XL',-1)">-</button>

                <br>
                XXL: ${item.stok.XXL}
                <button onclick="ubahStok(${index},'XXL',1)">+</button>
                <button onclick="ubahStok(${index},'XXL',-1)">-</button>

                <br><br>
                <button onclick="hapusProduk(${index})">Hapus</button>
            </li>
        `;
    });
}

// tambah produk (AUTO SIZE)
function tambahProduk() {
    const nama = document.getElementById("nama").value;
    const kategori = document.getElementById("kategori").value;
    const modal = document.getElementById("modal").value;
    const teman = document.getElementById("teman").value;
    const retail = document.getElementById("retail").value;

    produk.push({
        nama,
        kategori,
        modal,
        teman,
        retail,
        stok: {
            S: 0,
            M: 0,
            L: 0,
            XL: 0,
            XXL: 0
        }
    });

    localStorage.setItem("produk", JSON.stringify(produk));

    renderProduk();
}

// hapus
function hapusProduk(index) {
    produk.splice(index, 1);
    localStorage.setItem("produk", JSON.stringify(produk));
    renderProduk();
}

// tambah / kurang stok
function ubahStok(index, size, value) {
    produk[index].stok[size] += value;

    if (produk[index].stok[size] < 0) {
        produk[index].stok[size] = 0;
    }

    localStorage.setItem("produk", JSON.stringify(produk));
    renderProduk();
}

// start
renderProduk();
