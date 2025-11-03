import { create } from "zustand";

export interface CartItem {
	id: string;
	xs2_ticket_id: string;
	xs2_event_id: string;
	event_name: string;
	category_name: string;
	ticket_type: string;
	price: number;
	quantity: number;
}

export interface CartStore {
	items: CartItem[];
	addItem: (item: CartItem) => void;
	removeItem: (id: string) => void;
	clearCart: () => void;
	getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
	items: [],
	addItem: (item) =>
		set((state) => {
			const existing = state.items.find((i) => i.id === item.id);
			if (existing) {
				return {
					items: state.items.map((i) =>
						i.id === item.id
							? { ...i, quantity: i.quantity + item.quantity }
							: i
					),
				};
			}
			return { items: [...state.items, item] };
		}),
	removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
	clearCart: () => set({ items: [] }),
	getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));


