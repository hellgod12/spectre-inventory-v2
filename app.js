let produk = JSON.parse(localStorage.getItem("produk")) || [];

function renderProduk() {
    const list = document.getElementById("produkList");
    list.innerHTML = "";

    produk.forEach((item, index) => {
        list.innerHTML += `
    <li>
        <strong>${item.nama}</strong>
        <br>Kategori: ${item.kategori}

        <br><br>

        S : ${item.stokS}
        <br>M : ${item.stokM}
        <br>L : ${item.stokL}
        <br>XL : ${item.stokXL}
        <br>XXL : ${item.stokXXL}

        <br><br>

        <button onclick="hapusProduk(${index})">
            Hapus
        </button>
    </li>
        `;
    });
}

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

    localStorage.setItem(
        "produk",
        JSON.stringify(produk)
    );

    renderProduk();

    document.getElementById("nama").value = "";
    document.getElementById("modal").value = "";
    document.getElementById("teman").value = "";
    document.getElementById("retail").value = "";
}

function hapusProduk(index) {
    produk.splice(index, 1);

    localStorage.setItem(
        "produk",
        JSON.stringify(produk)
    );

    renderProduk();
}

renderProduk();
