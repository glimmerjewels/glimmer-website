const loginOverlay = document.getElementById("loginOverlay");
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
