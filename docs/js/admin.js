const loginOverlay = document.getElementById("loginOverlay");
const adminPanel = document.getElementById("adminPanel");

async function adminLogin(){

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    const { data, error } =
    await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if(error){

        document.getElementById("loginError")
        .innerText = "Invalid Credentials";

        return;
    }

    loginOverlay.style.display = "none";

    adminPanel.classList.remove("hidden");

    loadInventory();
}

window.onload = async () => {

    const { data } =
    await supabaseClient.auth.getSession();

    if(data.session){

        loginOverlay.style.display = "none";

        adminPanel.classList.remove("hidden");

        loadInventory();
    }
};

async function loadInventory(){

    const tableBody =
    document.getElementById("inventoryBody");

    const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending:false });

    if(error){
        console.log(error);
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(product => {

        tableBody.innerHTML += `

        <tr>
            <td>
                <img src="${product.image}"
                class="table-img">
            </td>

            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹${product.offer_price}</td>
            <td>${product.stock}</td>

            <td>
                <button class="delete-btn"
                onclick="deleteProduct(${product.id})">
                Delete
                </button>
            </td>
        </tr>
        `;
    });
}

async function addProduct(){

    const name =
    document.getElementById("productName").value;

    const category =
    document.getElementById("productCategory").value;

    const actual_price =
    document.getElementById("actualPrice").value;

    const offer_price =
    document.getElementById("offerPrice").value;

    const stock =
    document.getElementById("stock").value;

    const description =
    document.getElementById("description").value;

    const imageFile =
    document.getElementById("productImage").files[0];

    const fileName = `${Date.now()}-${imageFile.name}`;

    const { error:uploadError } =
    await supabaseClient.storage
    .from("product-images")
    .upload(fileName, imageFile);

    if(uploadError){
        console.log(uploadError);
        return;
    }

    const imageUrl =
    `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;

    const { error } = await supabaseClient
    .from("products")
    .insert([
        {
            name,
            category,
            actual_price,
            offer_price,
            stock,
            description,
            image:imageUrl
        }
    ]);

    if(error){
        console.log(error);
        alert("Failed To Add Product");
        return;
    }

    alert("Product Added Successfully");

    closePopup();

    loadInventory();
}

async function deleteProduct(id){

    const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

    if(error){
        console.log(error);
        return;
    }

    loadInventory();
}

function openPopup(){
    document.getElementById("productPopup")
    .classList.remove("hidden");
}

function closePopup(){
    document.getElementById("productPopup")
    .classList.add("hidden");
}

async function logout(){

    await supabaseClient.auth.signOut();

    location.reload();
}
