function renderProduk() {
    const list = document.getElementById("produkList");
    list.innerHTML = "";

    produk.forEach((item, index) => {
        list.innerHTML += `
            <li class="product-card">
                <h3>${item.nama}</h3>
                <p>${item.kategori}</p>

                <div class="stock-grid">

                    <div class="stock-item">
                        <span>S</span>
                        <button onclick="ubahStok(${index},'S',-1)">-</button>
                        <b>${item.stok.S}</b>
                        <button onclick="ubahStok(${index},'S',1)">+</button>
                    </div>

                    <div class="stock-item">
                        <span>M</span>
                        <button onclick="ubahStok(${index},'M',-1)">-</button>
                        <b>${item.stok.M}</b>
                        <button onclick="ubahStok(${index},'M',1)">+</button>
                    </div>

                    <div class="stock-item">
                        <span>L</span>
                        <button onclick="ubahStok(${index},'L',-1)">-</button>
                        <b>${item.stok.L}</b>
                        <button onclick="ubahStok(${index},'L',1)">+</button>
                    </div>

                    <div class="stock-item">
                        <span>XL</span>
                        <button onclick="ubahStok(${index},'XL',-1)">-</button>
                        <b>${item.stok.XL}</b>
                        <button onclick="ubahStok(${index},'XL',1)">+</button>
                    </div>

                    <div class="stock-item">
                        <span>XXL</span>
                        <button onclick="ubahStok(${index},'XXL',-1)">-</button>
                        <b>${item.stok.XXL}</b>
                        <button onclick="ubahStok(${index},'XXL',1)">+</button>
                    </div>

                </div>

                <button class="delete-btn" onclick="hapusProduk(${index})">
                    Hapus Produk
                </button>
            </li>
        `;
    });
}
