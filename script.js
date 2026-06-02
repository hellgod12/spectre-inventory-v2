const supabase = window.supabase.createClient(
  "https://kbaltquoajrmpixgsiec.supabase.co",
  "KEY_ANON_KAMU"
);

async function loadDashboard() {

  const { count: barang } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true });

  document.getElementById("totalBarang").textContent = barang || 0;

  const { count: member } = await supabase
    .from("member")
    .select("*", { count: "exact", head: true });

  document.getElementById("totalMember").textContent = member || 0;
}

loadDashboard();
