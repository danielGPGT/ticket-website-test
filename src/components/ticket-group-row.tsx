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
import { ShoppingCart, Check, AlertCircle } from "lucide-react";
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
  const isLowStock = stock > 0 && stock <= 5;

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
        "group relative rounded-lg border transition-all duration-200",
        "bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-sm",
        isOutOfStock && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="px-2.5 sm:px-3 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Ticket Info */}
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                  {ticketType}
                </span>
                {isLowStock && !isOutOfStock && (
                  <Badge 
                    variant="outline" 
                    className="h-3.5 sm:h-4 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-medium border-warning/40 text-warning shrink-0"
                  >
                    {stock} left
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge 
                    variant="outline" 
                    className="h-3.5 sm:h-4 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-medium border-destructive/40 text-destructive shrink-0"
                  >
                    Sold out
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-sm sm:text-base font-bold text-foreground">
                  £{minPrice.toFixed(0)}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium inline">
                  per ticket
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quantity & Add to Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Select
              value={String(qty)}
              onValueChange={(value) =>
                setQty(Math.min(Number(value), stock))
              }
              disabled={isOutOfStock}
            >
              <SelectTrigger 
                className={cn(
                  "h-8 sm:h-9 w-14 sm:w-16 text-[11px] sm:text-xs font-semibold border-2 transition-all",
                  "hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "bg-background hover:bg-accent/50",
                  isOutOfStock && "opacity-50 cursor-not-allowed border-muted"
                )} 
                aria-label="Select quantity"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qtyOptions.map((num) => (
                  <SelectItem
                    key={num}
                    value={String(num)}
                    className="text-xs font-medium focus:bg-accent"
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
                "h-8 sm:h-9 px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold gap-1 sm:gap-1.5 transition-all duration-200",
                "shadow-sm hover:shadow-md active:scale-[0.98]",
                "flex-1 sm:flex-initial sm:min-w-[100px]",
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
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Added!</span>
                  <span className="sm:hidden">Done</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
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
