"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart-store";
import { Package, ShoppingCart, Check, ChevronDown, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  groupKey: string;
  eventId: string;
  eventName: string;
  categoryName: string;
  ticketType: string;
  minPrice: number;
  stock: number;
  anyTicketId: string;
  metaNote?: string;
};

export function TicketGroupRow({
  groupKey,
  eventId,
  eventName,
  categoryName,
  ticketType,
  minPrice,
  stock,
  anyTicketId,
  metaNote,
}: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = stock <= 0;

  const maxQty = Math.min(10, Math.max(1, stock));
  const qtyOptions = Array.from({ length: maxQty }, (_, i) => i + 1);

  function addToCart() {
    if (qty < 1 || stock <= 0) return;
    addItem({
      id: `${groupKey}-${minPrice}`,
      xs2_ticket_id: anyTicketId,
      xs2_event_id: eventId,
      event_name: eventName,
      category_name: categoryName,
      ticket_type: ticketType,
      price: minPrice,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card transition-all hover:shadow-sm",
        isOutOfStock && "opacity-50"
      )}
    >
      <div className="px-2 py-1">
        <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Left: Ticket Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground">
                {ticketType}
              </span>{" "}
              <div className="text-left">
                <div className="font-semibold text-sm text-secondary">
                  £{minPrice.toFixed(0)}
                </div>
              </div>
            </div>

          </div>


          <div className="flex items-center gap-2 sm:w-auto">
            <Select
              value={String(qty)}
              onValueChange={(value) =>
                setQty(Math.min(Number(value), stock))
              }
              disabled={isOutOfStock}
            >
              <SelectTrigger className={cn(
                "h-9 sm:h-8 w-14 sm:w-14 text-xs px-1.5 sm:px-2 font-medium border-none transition-all flex-shrink-0",
                "hover:border-primary/50 focus:border-primary",
                "bg-background hover:bg-accent/50",
                isOutOfStock && "opacity-50 cursor-not-allowed"
              )} aria-label="Select quantity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qtyOptions.map((num) => (
                  <SelectItem
                    key={num}
                    value={String(num)}
                    className="text-xs font-medium"
                  >
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          
            <Button
              size="sm"
              onClick={addToCart}
              disabled={isOutOfStock || qty < 1}
              className={cn(
                "h-9 sm:h-8 px-3 sm:px-4 text-xs font-semibold gap-1 transition-all duration-200 flex-1 sm:flex-initial",
                "shadow-sm hover:shadow-md active:scale-95",
                added
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              style={
                added
                  ? {
                      backgroundColor: "var(--success)",
                      color: "var(--success-foreground)",
                    }
                  : undefined
              }
              aria-label="Add to cart"
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Added!</span>
                  <span className="sm:hidden">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                  <span className="sm:hidden">Add</span>
                </>
              )}
            </Button>
          </div>
		  </div>
      </div>
    </div>
  );
}
