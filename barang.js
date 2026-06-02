const supabase = window.supabase.createClient(
  "https://kbaltquoajrmpixgsiec.supabase.co",
  "PASTE_PUBLISHABLE_KEY"
);

const tbody = document.getElementById("tbodyBarang");

async function loadBarang() {

  const { data, error } = await supabase
    .from("product")
    .select("*")
    .order("id", { ascending: false });

  if(error){
    console.log(error);
    return;
  }

  tbody.innerHTML = "";

  data.forEach(item => {

    tbody.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.nama_barang}</td>
        <td>${item.stok}</td>
        <td>Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
        <td>Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
        <td>Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>

        <td>
          <button onclick="editBarang(${item.id})">
            Edit
          </button>

          <button onclick="hapusBarang(${item.id})">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });
}

async function simpanBarang(){

  const id = document.getElementById("id").value;

  const payload = {
    nama_barang: document.getElementById("nama_barang").value,
    stok: Number(document.getElementById("stok").value),
    harga_modal: Number(document.getElementById("harga_modal").value),
    harga_jual: Number(document.getElementById("harga_jual").value),
    harga_member: Number(document.getElementById("harga_member").value)
  };

  if(id){

    await supabase
      .from("product")
      .update(payload)
      .eq("id", id);

  }else{

    await supabase
      .from("product")
      .insert(payload);

  }

  resetForm();
  loadBarang();
}

async function editBarang(id){

  const { data } = await supabase
    .from("product")
    .select("*")
    .eq("id", id)
    .single();

  document.getElementById("id").value = data.id;
  document.getElementById("nama_barang").value = data.nama_barang;
  document.getElementById("stok").value = data.stok;
  document.getElementById("harga_modal").value = data.harga_modal;
  document.getElementById("harga_jual").value = data.harga_jual;
  document.getElementById("harga_member").value = data.harga_member;
}

async function hapusBarang(id){

  if(!confirm("Hapus barang?")) return;

  await supabase
    .from("product")
    .delete()
    .eq("id", id);

  loadBarang();
}

function cariBarang(){

  let input =
    document.getElementById("search")
    .value
    .toLowerCase();

  let tr =
    tbody.getElementsByTagName("tr");

  for(let i=0;i<tr.length;i++){

    let td = tr[i].getElementsByTagName("td")[1];

    if(td){

      let txt = td.textContent;

      tr[i].style.display =
      txt.toLowerCase().includes(input)
      ? ""
      : "none";

    }

  }
}

function tampilForm(){
  document
  .getElementById("formBox")
  .style.display = "grid";
}

function resetForm(){

  document.getElementById("id").value = "";
  document.getElementById("nama_barang").value = "";
  document.getElementById("stok").value = "";
  document.getElementById("harga_modal").value = "";
  document.getElementById("harga_jual").value = "";
  document.getElementById("harga_member").value = "";
}

loadBarang();
