export default function OrderConfirmation({ params }: { params: { orderId: string } }) {
	return (
		<div className="container mx-auto px-4 py-16">
			<h1 className="text-2xl font-semibold">Order Confirmed</h1>
			<p className="mt-2 text-sm text-muted-foreground">Your order ID is {params.orderId}.</p>
			<a href="/" className="mt-6 inline-block rounded bg-white text-black px-4 py-2">Back to Home</a>
		</div>
	);
}


