var quantityArray = [0];
var count_products = 0;
$(document).ready(function (){
		$.post("/retailer/order/count_product", function (data) {
			count_products = data["pro_id"];
			console.log(count_products["pro_id"]+"Hello");
			for (i = 1; i <= count_products; i++) {
				quantityArray[i] = 0;
			}
		});
});
$('.quantity').keyup(function(){
	var total_price = 0;
	var current_id = $(this).attr('id');
	var quantity = $('#'+current_id).val();
	if($.trim(quantity).length == 0){
		quantityArray[current_id] = 0;
		$(`#totalPrice${current_id}`).html("");
	}
	else{
		if(quantity.match(/^\d+(?:\.\d+)?$/)){
			$.ajax({
				type: 'POST',
				async: false,
				// data: 'quantity='+quantity+"&current_id="+current_id,
				url: `/retailer/order/count_products?quantity=${quantity}&current_id=${current_id}`,
				// data: 'quantity='+quantity+"&current_id="+current_id,
				success: function(data){
					console.log("Output"+data["total_price"]);
					$(`#totalPrice${current_id}`).html(data["total_price"]);
					quantityArray[current_id] = parseFloat(data["total_price"]);
				}
			});
		}
		else{
			$(`#totalPrice${current_id}`).html("Invalid Quantity");
		}
	}
	console.log("HELLO" + count_products);
	for(i=1;i<=count_products;i++){
		console.log(quantityArray[i]);
		total_price = parseFloat(total_price + quantityArray[i]);
	}
	console.log(total_price);
	$('#txtFinalAmount').val(total_price.toFixed(2));
});