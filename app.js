let produk = JSON.parse(localStorage.getItem("produk")) || [];

// render produk
function renderProduk() {
    const list = document.getElementById("produkList");
    list.innerHTML = "";

    produk.forEach((item, index) => {
        list.innerHTML += `
            <li style="padding:10px; border:1px solid #39ff14; margin:10px 0;">
                <strong>${item.nama}</strong>
                <br>${item.kategori}

                <br><br>
                📏 Stok:
                <br>S: ${item.stok.S}
                <br>M: ${item.stok.M}
                <br>L: ${item.stok.L}
                <br>XL: ${item.stok.XL}
                <br>XXL: ${item.stok.XXL}

                <br><br>
                <button onclick="hapusProduk(${index})">Hapus</button>
            </li>
        `;
    });

    updateDashboard();
}

// tambah produk (AUTO SIZE)
function tambahProduk() {
    const nama = document.getElementById("nama").value;
    const kategori = document.getElementById("kategori").value;
    const modal = document.getElementById("modal").value;
    const teman = document.getElementById("teman").value;
    const retail = document.getElementById("retail").value;

    if (!nama) {
        alert("Nama produk wajib diisi");
        return;
    }

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

    document.getElementById("nama").value = "";
    document.getElementById("kategori").value = "";
    document.getElementById("modal").value = "";
    document.getElementById("teman").value = "";
    document.getElementById("retail").value = "";
}

// hapus produk
function hapusProduk(index) {
    produk.splice(index, 1);

    localStorage.setItem("produk", JSON.stringify(produk));

    renderProduk();
}

// dashboard
function updateDashboard() {
    let totalProduk = produk.length;
    let totalStok = 0;

    produk.forEach(item => {
        totalStok += item.stok.S;
        totalStok += item.stok.M;
        totalStok += item.stok.L;
        totalStok += item.stok.XL;
        totalStok += item.stok.XXL;
    });

    document.getElementById("totalProduk").innerText = totalProduk;
    document.getElementById("totalStok").innerText = totalStok;
}

// start awal
renderProduk();
